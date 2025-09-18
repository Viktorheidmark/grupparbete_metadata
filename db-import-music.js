import fs from 'fs';
import * as musicMetadata from 'music-metadata';
import mysql from 'mysql2/promise';
import dbCredentials from './db-credentials.js';

// Skapa en DB-anslutning
const db = await mysql.createConnection(dbCredentials);

// Läs alla filer i mappen
const files = fs.readdirSync('./frontend/data/music');

// Töm tabellen (valfritt – bara om du vill börja om varje gång)
await db.execute('DELETE FROM music');

for (let file of files) {
  // Läs metadata med music-metadata
  let metadata = await musicMetadata.parseFile('./frontend/data/music/' + file);
  // Skapa ett objekt med filnamn + metadata
  let cleaned = { file, common: metadata.common, format: metadata.format };

  let [result] = await db.execute(`
    INSERT INTO music (meta)
    VALUES(?)
  `, [cleaned]);
  console.log(file, result);
}

// Avsluta DB-anslutningen
console.log('All metadata imported!');
process.exit(); 