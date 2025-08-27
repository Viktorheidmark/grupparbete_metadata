import express from "express";
import mysql from "mysql2/promise";
import dbCredentials from "./db-credentials.js";

// anslut till databasen
const db = await mysql.createConnection(dbCredentials);

// skapa en express-app
const app = express();

// enkel test-route: lista de senaste 10 filerna
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

// route för metadata till en specifik fil
app.get("/api/files/:id/metadata", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(`
      SELECT \`key\`, value_text, value_num, value_date
      FROM metadata
      WHERE file_id = ?
      ORDER BY \`key\` ASC
    `, [id]);
    res.json(rows);
  } catch (err) {
    console.error("DB error:", err.message);
    res.status(500).json({ error: "Database query failed" });
  }
});

// starta servern på en egen port (t.ex. 3010)
const PORT = 3010;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});