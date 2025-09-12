import fs from 'fs';
import exifr from 'exifr';
import mysql from 'mysql2/promise';
import dbCredentials from './db-credentials.js';

// skapa en DB-anslutning
const db = await mysql.createConnection(dbCredentials);

// läs alla filer i mappen
const files = fs.readdirSync('./frontend/data/pictures');

// töm tabellen (valfritt – bara om du vill börja om varje gång)
await db.execute('DELETE FROM pictures');

for (let file of files) {
  try {
    // läs metadata med exifr
    const metadata = await exifr.parse('./frontend/data/pictures/' + file);

    // skapa ett objekt med filnamn + metadata
    const cleaned = { file, metadata };

    // spara i DB som JSON
    let [result] = await db.execute(
      `INSERT INTO pictures (meta) VALUES (?)`,
      [JSON.stringify(cleaned)]
    );

    console.log("✓", file, result.insertId);
  } catch (err) {
    console.error("x", file, "-", err.message);
  }
}

// avsluta DB-anslutningen
console.log('All metadata imported!');
process.exit();