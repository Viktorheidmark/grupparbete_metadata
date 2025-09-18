import fs from 'fs';
import pdfParse from 'pdf-parse-fork';
import mysql from 'mysql2/promise';
import dbCredentials from './db-credentials.js';

async function main() {
  // Skapa en DB-anslutning
  const db = await mysql.createConnection(dbCredentials);

  // läs alla filer i pdf-mappen
  const files = fs.readdirSync('./frontend/data/pdf');

  // ta bara .pdf
  await db.execute('DELETE FROM pdf');

  for (let file of files) {
    // bara pdf
    let metadata = { fileName: file, ...(await pdfParse(fs.readFileSync('./frontend/data/pdf/' + file))) };
    // Spara som JSON-sträng
    let [result] = await db.execute(`
      INSERT INTO pdf (meta)
      VALUES(?)
    `, [metadata]);
    console.log(file, result);
  }

  // avsluta DB-anslutningen
  console.log('All metadata imported!');
  process.exit();
}

main();