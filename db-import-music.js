import fs from 'fs';
import * as musicMetadata from 'music-metadata';
import mysql from 'mysql2/promise';
import dbCredentials from './db-credentials.js';

// connect to db
const db = await mysql.createConnection(dbCredentials);

// read all files
const files = fs.readdirSync('./frontend/data/music');

// remove all posts from the musicMeta
await db.execute('DELETE FROM music');

for (let file of files) {
  // get all metadata
  let metadata = await musicMetadata.parseFile('./frontend/data/music/' + file);
  // create cleaned up version with filename + metadata
  // we want to import mysql
  let cleaned = { file, common: metadata.common, format: metadata.format };

  let [result] = await db.execute(`
    INSERT INTO music (meta)
    VALUES(?)
  `, [cleaned]);
  console.log(file, result);
}

// Exit process when import is done
console.log('All metadata imported!');
process.exit();