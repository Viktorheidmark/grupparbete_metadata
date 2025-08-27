import fs from "fs";
import path from "path";
import crypto from "crypto";
import mysql from "mysql2/promise";
import { exiftool } from "exiftool-vendored";
import dbConfig from "./db-credentials.js";

// ---- Konfig ----
const ROOT = "data";
const GROUPS = [
  { sub: "bilder",      type: "image", exts: [".jpg",".jpeg",".png",".heic",".tif",".tiff",".webp"] },
  { sub: "music",       type: "audio", exts: [".mp3",".wav",".m4a",".flac",".aac",".ogg"] },
  { sub: "pdfs",        type: "pdf",   exts: [".pdf"] },
  { sub: "powerpoints", type: "ppt",   exts: [".ppt",".pptx"] },
];

const db = await mysql.createConnection(dbConfig);

async function query(sql, vals) {
  const [rows] = await db.execute(sql, vals);
  return rows;
}

function mimeFromExt(ext) {
  const e = ext.toLowerCase();
  if (e===".jpg"||e===".jpeg") return "image/jpeg";
  if (e===".png")  return "image/png";
  if (e===".webp") return "image/webp";
  if (e===".heic") return "image/heic";
  if (e===".tif"||e===".tiff") return "image/tiff";
  if (e===".pdf")  return "application/pdf";
  if (e===".mp3")  return "audio/mpeg";
  if (e===".wav")  return "audio/wav";
  if (e===".m4a")  return "audio/mp4";
  if (e===".flac") return "audio/flac";
  if (e===".aac")  return "audio/aac";
  if (e===".ogg")  return "audio/ogg";
  if (e===".ppt")  return "application/vnd.ms-powerpoint";
  if (e===".pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  return "application/octet-stream";
}

function sha256(absPath) {
  return new Promise((res, rej) => {
    const h = crypto.createHash("sha256");
    const s = fs.createReadStream(absPath);
    s.on("data", c => h.update(c));
    s.on("error", rej);
    s.on("end", () => res(h.digest("hex")));
  });
}

function toTriplet(raw) {
  if (raw == null) return { value_text: null, value_num: null, value_date: null };
  const value_text = Array.isArray(raw) ? raw.join(", ") : String(raw);
  const n = Number(value_text);
  const value_num = Number.isFinite(n) ? n : null;
  let value_date = null;
  if (/^\d{4}(:|-)\d{2}(:|-)\d{2}/.test(value_text)) {
    const isoish = value_text.replace(/^(\d{4}):(\d{2}):/, "$1-$2-").replace(" ", "T");
    const d = new Date(isoish);
    if (!Number.isNaN(d.getTime())) value_date = d;
  }
  return { value_text, value_num, value_date };
}

const KEYS_COMMON = ["FileType","MIMEType","CreateDate","ModifyDate","Title","Author","Keywords"];
const KEYS_IMAGE  = ["ImageWidth","ImageHeight","Megapixels","Make","Model","GPSLatitude","GPSLongitude"];
const KEYS_AUDIO  = ["Artist","Album","Genre","Composer","Track","TrackNumber","Year","Duration","Bitrate","SampleRate","Channels","ChannelMode","Encoder","AudioFormat"];
const KEYS_PDF    = ["Creator","Producer","PageCount","Subject"];
const KEYS_PPT    = ["Company","LastModifiedBy","Slides","SlideCount"];

function keysFor(type) {
  const all = [...KEYS_COMMON];
  if (type==="image") all.push(...KEYS_IMAGE);
  if (type==="audio") all.push(...KEYS_AUDIO);
  if (type==="pdf")   all.push(...KEYS_PDF);
  if (type==="ppt")   all.push(...KEYS_PPT);
  return all;
}

let imported = 0;

for (const g of GROUPS) {
  const folderAbs = path.join(process.cwd(), ROOT, g.sub);
  if (!fs.existsSync(folderAbs)) {
    console.log(`(hoppar över) saknar ${ROOT}/${g.sub}`);
    continue;
  }

  const files = fs.readdirSync(folderAbs).filter(f => g.exts.includes(path.extname(f).toLowerCase()));
  if (!files.length) {
    console.log(`(inga ${g.type}-filer) i ${ROOT}/${g.sub}`);
    continue;
  }

  console.log(`\n=== Importerar ${g.type} från ${ROOT}/${g.sub} (${files.length} st) ===`);

  for (const name of files) {
    const abs = path.join(folderAbs, name);
    const relPath = path.join(ROOT, g.sub, name);

    try {
      const st = fs.statSync(abs);
      const ext = path.extname(name).toLowerCase();
      const mime = mimeFromExt(ext);
      const hash = await sha256(abs);
      const createdAt = st.birthtime;
      const modifiedAt = st.mtime;

      const meta = await exiftool.read(abs);

      const lat = (g.type==="image" && meta.GPSLatitude  != null) ? meta.GPSLatitude  : null;
      const lng = (g.type==="image" && meta.GPSLongitude != null) ? meta.GPSLongitude : null;

      const res = await query(`
        INSERT INTO files
          (path, filename, ext, mime, size, hash, created_at, modified_at, filetype, lat, lng)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          id = LAST_INSERT_ID(id),
          filename=VALUES(filename),
          ext=VALUES(ext),
          mime=VALUES(mime),
          size=VALUES(size),
          hash=VALUES(hash),
          created_at=VALUES(created_at),
          modified_at=VALUES(modified_at),
          filetype=VALUES(filetype),
          lat=VALUES(lat),
          lng=VALUES(lng)
      `, [
        relPath, name, ext.slice(1), mime, st.size, hash, createdAt, modifiedAt, g.type, lat, lng
      ]);

      const fileId = res.insertId;

      const keys = keysFor(g.type);
      for (const k of keys) {
        if (meta[k] == null) continue;
        const { value_text, value_num, value_date } = toTriplet(meta[k]);
        await query(`
          INSERT INTO metadata (file_id, \`key\`, value_text, value_num, value_date)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            value_text = VALUES(value_text),
            value_num  = VALUES(value_num),
            value_date = VALUES(value_date)
        `, [fileId, k, value_text, value_num, value_date]);
      }

      imported++;
      console.log("✓", name);

    } catch (err) {
      console.error("x", name, "-", err.message);
    }
  }
}

await exiftool.end();
await db.end();
console.log(`\n Klart! Importerade totalt ${imported} filer från ${ROOT}.`);