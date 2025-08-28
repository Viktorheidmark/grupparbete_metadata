import express from 'express';
import mysql from 'mysql2/promise';
import dbCredentials from './db-credentials.js';

// connect to db
const db = await mysql.createConnection(dbCredentials);

// create a web server - app
const app = express();

app.get('/api/music-search/:field/:searchValue', async (req, res) => {
  // get field and searhValue from the request parameters
  const { field, searchValue } = req.params;
  // check that field is a valid field, if not do nothing
  if (!['title', 'album', 'artist', 'genre'].includes(field)) {
    res.json({ error: 'Invalid field name!' });
    return;
  }
  // run the db query as a prepared statement
  const [result] = await db.execute(`
    SELECT id,meta->>'$.file' AS fileName,
      meta->>'$.common.title' AS title,
      meta->>'$.common.artist' AS artist,
      meta->>'$.common.album' AS album,
      meta->>'$.common.genre' AS genre
    FROM music
    WHERE LOWER(meta->>'$.common.${field}') LIKE LOWER(?)
  `, ['%' + searchValue + '%']
  );
  // return the result as json
  res.json(result);
});

// metadata för en viss fil
app.get("/api/files/:id/metadata", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(
      `SELECT \`key\`, value_text, value_num, value_date
       FROM metadata
       WHERE file_id = ?
       ORDER BY \`key\` ASC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error("DB error:", err.message);
    res.status(500).json({ error: "Database query failed" });
  }
});

const PORT = 3010;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});