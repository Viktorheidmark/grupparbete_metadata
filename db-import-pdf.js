import fs from 'fs';
import pdfParse from 'pdf-parse-fork';
import mysql from 'mysql2/promise';
import dbCredentials from './db-credentials.js';

async function main() {
  // connect to db
  const db = await mysql.createConnection(dbCredentials);

  // read all files
  const files = fs.readdirSync('./frontend/data/pdf');

  // remove all posts from the musicMeta
  await db.execute('DELETE FROM pdf');

  for (let file of files) {
    // get all metadata
    let metadata = { fileName:file, ...(await pdfParse(fs.readFileSync('./frontend/data/pdf/' + file))) };
    // Spara som JSON-sträng
   let [result] = await db.execute(`
      INSERT INTO pdf (meta)
      VALUES(?)
    `, [metadata]);
    console.log(file, result);
  }

  // Exit process when import is done
  console.log('All metadata imported!');
  process.exit();
}

main();