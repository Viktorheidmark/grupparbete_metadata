// test-db.js
import mysql from "mysql2/promise";
import dbConfig from "./db-credentials.js";

try {
  const db = await mysql.createConnection(dbConfig);
  const [rows] = await db.query("SELECT 1 AS ok");
  console.log("DB OK:", rows[0]);
  await db.end();
} catch (err) {
  console.error("DB FEL:", err.code, err.message);
}