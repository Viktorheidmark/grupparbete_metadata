export default function setupPowerpointRestRoutes(app, db) {

  app.get('/api/powerpoint-search/:field/:searchValue', async (req, res) => {
    let { field, searchValue } = req.params;

    // Tillåt bara dessa fält i UI:t
    if (!['Company', 'Author'].includes(field)) {
      res.status(400).json({ error: 'Invalid field name!' });
      return;
    }

    // Bygg WHERE som täcker olika JSON-nycklar beroende på fält
    let whereClause = '';
    if (field === 'Company') {
      whereClause = `
        (
          LOWER(meta->>'$.Company') LIKE LOWER(?)
          OR LOWER(meta->>'$.company') LIKE LOWER(?)
          OR LOWER(meta->>'$.Properties.Company') LIKE LOWER(?)
        )
      `;
    } else if (field === 'Author') {
      whereClause = `
        (
          LOWER(meta->>'$.Author') LIKE LOWER(?)
          OR LOWER(meta->>'$.author') LIKE LOWER(?)
        )
      `;
    }

    const [result] = await db.execute(
      `
      SELECT
        id,
        meta->>'$.FileName' AS FileName,
        COALESCE(
          meta->>'$.Company',
          meta->>'$.company',
          meta->>'$.Properties.Company'
        ) AS Company,
        COALESCE(
          meta->>'$.Author',
          meta->>'$.author'
        ) AS Author
      FROM powerpoint
      WHERE ${whereClause}
      `,
      // tre placeholders om Company, två om Author
      field === 'Company'
        ? Array(3).fill('%' + searchValue + '%')
        : Array(2).fill('%' + searchValue + '%')
    );

    res.json(result);
  });

  app.get('/api/powerpoint-all-meta/:id', async (req, res) => {
    const { id } = req.params;
    const [rows] = await db.execute(`SELECT * FROM powerpoint WHERE id = ?`, [id]);
    res.json(rows);
  });

}