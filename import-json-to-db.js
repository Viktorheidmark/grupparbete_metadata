// import-json-to-db.js
// Importerar bilder från data/bilder till `files` + `metadata`
// Fyller hash, created_at, modified_at och ev. GPS (lat/lng)

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import { exiftool } from 'exiftool-vendored';

// ---- 1) Konfiguration ----
const FOLDER = 'data/bilder'; // din bildmapp
const exts = new Set(['.jpg', '.jpeg', '.png', '.heic', '.tif', '.tiff']);

// ---- 2) Anslut till databasen ----
const db = await mysql.createConnection({
  host: '5.189.183.23',
  port: 4567,
  user: 'dm24-sthm-grupp3',
  password: 'YFTJJ88469',
  database: 'dm24-sthm-grupp3'
});

// Liten hjälpare för queries (samma stil som ditt exempel)
async function query(sql, values) {
  const [rows] = await db.execute(sql, values);
  return rows;
}

// Enkel mime-map (slipper extra paket)
function mimeFromExt(ext) {
  const e = ext.toLowerCase();
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg';
  if (e === '.png') return 'image/png';
  if (e === '.heic') return 'image/heic';
  if (e === '.tif' || e === '.tiff') return 'image/tiff';
  return 'application/octet-stream';
}

// Beräkna SHA-256-hash av fil (streamad)
function hashFileSha256(absPath) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash('sha256');
    const s = fs.createReadStream(absPath);
    s.on('data', chunk => h.update(chunk));
    s.on('error', reject);
    s.on('end', () => resolve(h.digest('hex')));
  });
}

// Försök tolka tal & datum till metadata-tabellen
function parseValueHelpers(v) {
  if (v == null) return { value: null, value_num: null, value_date: null };
  const value = Array.isArray(v) ? v.join(', ') : String(v);

  let value_num = null;
  const n = Number(value);
  if (!Number.isNaN(n) && Number.isFinite(n)) value_num = n;

  let value_date = null;
  // Exif-datum kommer ofta som "YYYY:MM:DD HH:MM:SS"
  if (/^\d{4}(:|-)\d{2}(:|-)\d{2}/.test(value)) {
    const isoish = value.replace(/^(\d{4}):(\d{2}):/, '$1-$2-').replace(' ', 'T');
    const d = new Date(isoish);
    if (!Number.isNaN(d.getTime())) value_date = d;
  }

  return { value, value_num, value_date };
}

// ---- 3) Läs alla filer i mappen ----
const filesInFolder = fs.existsSync(FOLDER) ? fs.readdirSync(FOLDER) : [];
const imageFiles = filesInFolder.filter(f => exts.has(path.extname(f).toLowerCase()));

if (imageFiles.length === 0) {
  console.log(`Inga bildfiler hittades i ${FOLDER}`);
  await db.end();
  process.exit(0);
}

for (const file of imageFiles) {
  const abs = path.join(process.cwd(), FOLDER, file);
  try {
    // Grunddata om filen
    const stat = fs.statSync(abs);
    const relPath = path.join(FOLDER, file);      // ex: "data/bilder/foo.jpg"
    const ext = path.extname(file).slice(1);      // ex: "jpg"
    const mime = mimeFromExt('.' + ext);

    // NYTT: hash + created/modified
    const hash = await hashFileSha256(abs);
    const createdAt = stat.birthtime; // filens skapad-datum
    const modifiedAt = stat.mtime;    // filens senaste ändring

    // ---- 4) Lägg in i files (upsert) och fyll hash/datum ----
    await query(
      `INSERT INTO files (path, filename, ext, mime, size, hash, created_at, modified_at, filetype)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'image')
       ON DUPLICATE KEY UPDATE
         size=VALUES(size),
         mime=VALUES(mime),
         hash=VALUES(hash),
         created_at=VALUES(created_at),
         modified_at=VALUES(modified_at),
         filetype='image'`,
      [relPath, file, ext, mime, stat.size, hash, createdAt, modifiedAt]
    );

    // Hämta id (om den redan fanns)
    const rows = await query('SELECT id FROM files WHERE path = ?', [relPath]);
    const fileId = rows[0]?.id;
    if (!fileId) {
      console.warn('Kunde inte slå upp file_id för', relPath);
      continue;
    }

    // ---- 5) Läs metadata med ExifTool ----
    const meta = await exiftool.read(abs);

    // Uppdatera lat/lng om finns
    if (meta.GPSLatitude != null && meta.GPSLongitude != null) {
      await query('UPDATE files SET lat=?, lng=? WHERE id=?', [meta.GPSLatitude, meta.GPSLongitude, fileId]);
    }

    // ---- 6) Spara utvalda nycklar i metadata-tabellen ----
    const keysToKeep = [
      'FileType', 'MIMEType',
      'ImageWidth', 'ImageHeight', 'Megapixels',
      'CreateDate', 'ModifyDate',
      'Make', 'Model',
      'Title', 'Author', 'Keywords'
    ];

    for (const k of keysToKeep) {
      if (meta[k] == null) continue;
      const { value, value_num, value_date } = parseValueHelpers(meta[k]);
      await query(
        'INSERT INTO metadata (file_id, `key`, `value`, value_num, value_date) VALUES (?,?,?,?,?)',
        [fileId, k, value, value_num, value_date]
      );
    }

    console.log('✓ Importerad:', file);
  } catch (err) {
    console.error('x Fel för', file, '-', err.message);
  }
}

// Stäng ExifTool & DB
await exiftool.end();
await db.end();
console.log('✅ Klart! Alla bilder i', FOLDER, 'har importerats med hash/datum och ev. GPS.');