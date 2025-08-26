// import-audio-to-db.js
// Importerar ljudfiler från data/ljudfiler till `files` + `metadata`

import fs from "fs";
import path from "path";
import crypto from "crypto";
import mysql from "mysql2/promise";
import { exiftool } from "exiftool-vendored";

// ---- Konfig ----
const FOLDER = "data/ljudfiler";
const EXTS = new Set([".mp3", ".wav", ".m4a", ".flac", ".aac", ".ogg"]);

// ---- DB ----
const db = await mysql.createConnection({
  host: "5.189.183.23",
  port: 4567,
  user: "dm24-sthm-grupp3",
  password: "YFTJJ88469",
  database: "dm24-sthm-grupp3",
});

async function query(sql, values) {
  const [rows] = await db.execute(sql, values);
  return rows;
}

// ---- Helpers ----
function mimeFromExt(ext) {
  const e = ext.toLowerCase();
  if (e === ".mp3") return "audio/mpeg";
  if (e === ".wav") return "audio/wav";
  if (e === ".m4a") return "audio/mp4";
  if (e === ".flac") return "audio/flac";
  if (e === ".aac") return "audio/aac";
  if (e === ".ogg") return "audio/ogg";
  return "application/octet-stream";
}

function hashFileSha256(absPath) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash("sha256");
    const s = fs.createReadStream(absPath);
    s.on("data", (c) => h.update(c));
    s.on("error", reject);
    s.on("end", () => resolve(h.digest("hex")));
  });
}

// Få fram ett tal ur sträng som "192 kbps", "44.1 kHz"
function toNumber(val) {
  const m = String(val).match(/[\d.]+/);
  return m ? Number(m[0]) : null;
}

// Duration → sekunder (accepterar "mm:ss" / "h:mm:ss" eller rena sekunder)
function durationToSeconds(v) {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const s = String(v);
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  if (s.includes(":")) {
    const parts = s.split(":").map(Number); // [h, m, s] eller [m, s]
    if (parts.some((x) => Number.isNaN(x))) return null;
    let sec = 0;
    while (parts.length) sec = sec * 60 + parts.shift();
    return sec;
  }
  return null;
}

// Normalisera metadata-värden → value, value_num, value_date
function normalizeKV(key, rawVal) {
  let value = Array.isArray(rawVal) ? rawVal.join(", ") : String(rawVal);
  let value_num = null;
  let value_date = null;

  if (key === "Duration") {
    value_num = durationToSeconds(rawVal); // sekunder
  } else if (key === "Bitrate") {
    // spara i kbps
    const n = toNumber(rawVal);
    if (n != null) value_num = n; // ex 192 (kbps)
  } else if (key === "SampleRate") {
    const n = toNumber(rawVal);
    if (n != null) value_num = n * (String(rawVal).includes("k") ? 1000 : 1); // 44.1 kHz -> 44100
  } else if (["Track", "TrackNumber", "Year", "Channels"].includes(key)) {
    const n = toNumber(rawVal);
    if (n != null) value_num = n;
  } else {
    // generellt: om det ÄR ett tal, spara som num
    const n = Number(value);
    if (!Number.isNaN(n) && Number.isFinite(n)) value_num = n;

    // datum: "YYYY:MM:DD HH:MM:SS"
    if (/^\d{4}(:|-)\d{2}(:|-)\d{2}/.test(value)) {
      const isoish = value.replace(/^(\d{4}):(\d{2}):/, "$1-$2-").replace(" ", "T");
      const d = new Date(isoish);
      if (!Number.isNaN(d.getTime())) value_date = d;
    }
  }

  return { value, value_num, value_date };
}

// Vilka nycklar vi försöker spara för ljud
const KEYS_AUDIO = [
  "FileType", "MIMEType",
  "Title", "Artist", "Album", "Genre", "Composer",
  "Track", "TrackNumber", "Year",
  "Duration", "Bitrate", "SampleRate", "Channels", "ChannelMode",
  "Encoder", "AudioFormat", "CreateDate", "ModifyDate"
];

// ---- Kör ----
const dirAbs = path.join(process.cwd(), FOLDER);
if (!fs.existsSync(dirAbs)) {
  console.log(`Saknar mapp: ${FOLDER}`);
  await db.end();
  process.exit(0);
}

const entries = fs.readdirSync(dirAbs).filter((f) => EXTS.has(path.extname(f).toLowerCase()));
if (entries.length === 0) {
  console.log(`Inga ljudfiler hittades i ${FOLDER}`);
  await db.end();
  process.exit(0);
}

for (const filename of entries) {
  const abs = path.join(dirAbs, filename);
  try {
    const st = fs.statSync(abs);
    const relPath = path.join(FOLDER, filename);
    const ext = path.extname(filename).toLowerCase();
    const mime = mimeFromExt(ext);
    const hash = await hashFileSha256(abs);
    const createdAt = st.birthtime;
    const modifiedAt = st.mtime;

    // Lägg in/uppdatera i files
    await query(
      `INSERT INTO files (path, filename, ext, mime, size, hash, created_at, modified_at, filetype)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'audio')
       ON DUPLICATE KEY UPDATE
         size=VALUES(size), mime=VALUES(mime), hash=VALUES(hash),
         created_at=VALUES(created_at), modified_at=VALUES(modified_at),
         filetype='audio'`,
      [relPath, filename, ext.slice(1), mime, st.size, hash, createdAt, modifiedAt]
    );

    const row = await query("SELECT id FROM files WHERE path = ?", [relPath]);
    const fileId = row[0]?.id;
    if (!fileId) { console.warn("Kunde inte slå upp id för", relPath); continue; }

    // Läs metadata via ExifTool
    const meta = await exiftool.read(abs);

    // Spara utvalda nycklar
    for (const k of KEYS_AUDIO) {
      if (meta[k] == null) continue;
      const { value, value_num, value_date } = normalizeKV(k, meta[k]);
      await query(
        "INSERT INTO metadata (file_id, `key`, `value`, value_num, value_date) VALUES (?,?,?,?,?)",
        [fileId, k, value, value_num, value_date]
      );
    }

    console.log("✓ Importerad ljudfil:", filename);
  } catch (err) {
    console.error("x Fel för", filename, "-", err.message);
  }
}

await exiftool.end();
await db.end();
console.log(`✅ Klart! Importerade ${entries.length} ljudfiler från ${FOLDER}.`);