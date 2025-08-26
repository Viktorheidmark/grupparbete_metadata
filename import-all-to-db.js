// import-all-to-db.js
// Importerar BILDER + LJUD + PDF + POWERPOINT till `files` + `metadata`

import fs from "fs";
import path from "path";
import crypto from "crypto";
import mysql from "mysql2/promise";
import { exiftool } from "exiftool-vendored";

// ---- Mappar & filtyper ----
const ROOT = "data";
const GROUPS = [
  { sub: "bilder",      type: "image", exts: [".jpg",".jpeg",".png",".heic",".tif",".tiff",".webp"] },
  { sub: "music",   type: "audio", exts: [".mp3",".wav",".m4a",".flac",".aac",".ogg"] },
  { sub: "pdfs",        type: "pdf",   exts: [".pdf"] },
  { sub: "powerpoints", type: "ppt",   exts: [".ppt",".pptx"] },
];

// ---- DB ----
const db = await mysql.createConnection({
  host: "5.189.183.23",
  port: 4567,
  user: "dm24-sthm-grupp3",
  password: "YFTJJ88469",
  database: "dm24-sthm-grupp3",
});
async function query(sql, vals){ const [rows] = await db.execute(sql, vals); return rows; }

// ---- Helpers ----
function mimeFromExt(ext){
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
function sha256(absPath){
  return new Promise((res,rej)=>{
    const h=crypto.createHash("sha256"); const s=fs.createReadStream(absPath);
    s.on("data",c=>h.update(c)); s.on("error",rej); s.on("end",()=>res(h.digest("hex")));
  });
}
// generella parsern för value/value_num/value_date
function toTriplet(key, raw){
  if (raw==null) return { value:null, value_num:null, value_date:null };
  const value = Array.isArray(raw) ? raw.join(", ") : String(raw);
  let value_num = null, value_date = null;

  const num = Number(value);
  if (!Number.isNaN(num) && Number.isFinite(num)) value_num = num;

  if (/^\d{4}(:|-)\d{2}(:|-)\d{2}/.test(value)) {
    const isoish = value.replace(/^(\d{4}):(\d{2}):/,"$1-$2-").replace(" ","T");
    const d = new Date(isoish); if (!Number.isNaN(d.getTime())) value_date = d;
  }
  return { value, value_num, value_date };
}
// lite smartare normalisering för ljudfält
function normalizeAudio(key, raw){
  const s = String(raw);
  if (key==="Duration"){ // "3:21" -> sekunder
    if (/^\d+(\.\d+)?$/.test(s)) return { value:s, value_num:Number(s), value_date:null };
    const parts = s.split(":").map(Number); if (parts.some(isNaN)) return toTriplet(key, raw);
    let sec=0; while(parts.length) sec = sec*60 + parts.shift();
    return { value:s, value_num:sec, value_date:null };
  }
  if (key==="Bitrate"){ // "192 kbps" -> 192
    const m=s.match(/([\d.]+)/); return m?{ value:s, value_num:Number(m[1]), value_date:null }:toTriplet(key, raw);
  }
  if (key==="SampleRate"){ // "44.1 kHz" -> 44100
    const m=s.match(/([\d.]+)/); if(!m) return toTriplet(key, raw);
    const hz = s.toLowerCase().includes("k") ? Number(m[1])*1000 : Number(m[1]);
    return { value:s, value_num:hz, value_date:null };
  }
  if (["Track","TrackNumber","Year","Channels"].includes(key)){
    const m=s.match(/([\d.]+)/); return m?{ value:s, value_num:Number(m[1]), value_date:null }:toTriplet(key, raw);
  }
  return toTriplet(key, raw);
}

// nycklar vi sparar per typ
const KEYS_COMMON = ["FileType","MIMEType","CreateDate","ModifyDate","Title","Author","Keywords"];
const KEYS_IMAGE  = ["ImageWidth","ImageHeight","Megapixels","Make","Model","GPSLatitude","GPSLongitude"];
const KEYS_AUDIO  = ["Artist","Album","Genre","Composer","Track","TrackNumber","Year","Duration","Bitrate","SampleRate","Channels","ChannelMode","Encoder","AudioFormat"];
const KEYS_PDF    = ["Creator","Producer","PageCount","Subject"];
const KEYS_PPT    = ["Company","LastModifiedBy","Slides","SlideCount"];

function keysFor(type){
  const all = [...KEYS_COMMON];
  if (type==="image") all.push(...KEYS_IMAGE);
  if (type==="audio") all.push(...KEYS_AUDIO);
  if (type==="pdf")   all.push(...KEYS_PDF);
  if (type==="ppt")   all.push(...KEYS_PPT);
  return all;
}

// ---- Kör igenom alla mappar ----
let imported = 0;

for (const g of GROUPS){
  const folderAbs = path.join(process.cwd(), ROOT, g.sub);
  if (!fs.existsSync(folderAbs)){ console.log(`(hoppar över) saknar ${ROOT}/${g.sub}`); continue; }

  const files = fs.readdirSync(folderAbs).filter(f => g.exts.includes(path.extname(f).toLowerCase()));
  if (!files.length){ console.log(`(inga ${g.type}-filer) i ${ROOT}/${g.sub}`); continue; }

  console.log(`\n=== Importerar ${g.type} från ${ROOT}/${g.sub} (${files.length} st) ===`);

  for (const name of files){
    const abs = path.join(folderAbs, name);
    try{
      const st = fs.statSync(abs);
      const relPath = path.join(ROOT, g.sub, name);
      const ext = path.extname(name).toLowerCase();
      const mime = mimeFromExt(ext);
      const hash = await sha256(abs);
      const createdAt = st.birthtime, modifiedAt = st.mtime;

      // upsert i files
      await query(
        `INSERT INTO files (path, filename, ext, mime, size, hash, created_at, modified_at, filetype)
         VALUES (?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE size=VALUES(size), mime=VALUES(mime), hash=VALUES(hash),
           created_at=VALUES(created_at), modified_at=VALUES(modified_at), filetype=VALUES(filetype)`,
        [relPath, name, ext.slice(1), mime, st.size, hash, createdAt, modifiedAt, g.type]
      );

      const row = await query("SELECT id FROM files WHERE path=?", [relPath]);
      const fileId = row[0]?.id; if (!fileId){ console.warn("kunde inte slå upp id för", relPath); continue; }

      // exiftool metadata
      const meta = await exiftool.read(abs);

      // special: om bild, spara GPS på files
      if (g.type==="image" && meta.GPSLatitude!=null && meta.GPSLongitude!=null){
        await query("UPDATE files SET lat=?, lng=? WHERE id=?", [meta.GPSLatitude, meta.GPSLongitude, fileId]);
      }

      // spara nycklar
      const keys = keysFor(g.type);
      for (const k of keys){
        if (meta[k]==null) continue;
        const triplet = (g.type==="audio") ? normalizeAudio(k, meta[k]) : toTriplet(k, meta[k]);
        await query(
          "INSERT INTO metadata (file_id, `key`, `value`, value_num, value_date) VALUES (?,?,?,?,?)",
          [fileId, k, triplet.value, triplet.value_num, triplet.value_date]
        );
      }

      imported++;
      console.log("✓", name);
    }catch(err){
      console.error("x", name, "-", err.message);
    }
  }
}

await exiftool.end();
await db.end();
console.log(`\n✅ Klart! Importerade totalt ${imported} filer från ${ROOT}.`);