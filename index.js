import express from "express";
import mysql from "mysql2/promise";
import dbConfig from "./db-credentials.js";

const db = await mysql.createConnection(dbConfig);
const app = express();

// test
app.get("/api/ping", (req, res) => res.json({ ok: true, time: new Date() }));

// senaste 10 filer
app.get("/api/files", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT id, filename, filetype, created_at, modified_at
      FROM files
      ORDER BY id DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    console.error("DB error:", err.message);
    res.status(500).json({ error: "Database query failed" });
  }
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

<<<<<<< HEAD
// Start the web server at port 3000
app.listen(3000, () => console.log('Listening on http://localhost:3000'));
=======
const PORT = 3010;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
>>>>>>> d24ee3a076b71a64d1c9f54af01f84d80fffd488
