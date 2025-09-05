// db-import-powerpoint.js
import fs from 'fs';
import path from 'path';
import { exiftool } from 'exiftool-vendored';
import mysql from 'mysql2/promise';
import dbCredentials from './db-credentials.js';

async function main() {
  // connect to db
  const db = await mysql.createConnection(dbCredentials);

  // var ligger filerna?
  const dir = './frontend/data/powerpoint';

  // läs alla filer och ta bara .ppt
  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.ppt'));

  // töm tabellen (ändra tabellnamn om din heter något annat)
  await db.execute('DELETE FROM powerpoint');

  for (let file of files) {
    try {
      const fullPath = path.join(dir, file);
      // hämta metadata via exiftool
      const meta = await exiftool.read(fullPath);

      // bygg objekt i samma stil som pdf-importen
      const metadata = { fileName: file, ...meta };

      // Spara som JSON-sträng i kolumnen `meta`
      const [result] = await db.execute(
        `INSERT INTO powerpoint (meta) VALUES (?)`,
        [JSON.stringify(metadata)]
      );

      console.log(`✓ ${file} -> id ${result.insertId}`);
    } catch (err) {
      console.error(`x ${file} - ${err.message}`);
    }
  }

  // Exit process when import is done
  console.log('All metadata imported!');
  await exiftool.end();
  process.exit();
}

main();