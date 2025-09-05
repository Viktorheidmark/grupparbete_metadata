export default function setupPowerpointRestRoutes(app, db) {
  app.get('/api/powerpoint-search/:field/:searchValue', async (req, res) => {
    const { field, searchValue } = req.params;
    if (!['Title', 'Author'].includes(field)) {
      res.json({ error: 'Invalid field name!' });
      return;
    }
    const [result] = await db.execute(`
      SELECT id, JSON_UNQUOTE(JSON_EXTRACT(meta, '$.FileName')) AS FileName,
             JSON_UNQUOTE(JSON_EXTRACT(meta, '$.${field}')) AS ${field}
      FROM powerpoint
      WHERE LOWER(JSON_UNQUOTE(JSON_EXTRACT(meta, '$.${field}'))) LIKE LOWER(?)
    `, ['%' + searchValue + '%']);
    res.json(result);
  });

  app.get('/api/powerpoint-all-meta/:id', async (req, res) => {
    const { id } = req.params;
    const [result] = await db.execute('SELECT * FROM powerpoint WHERE id = ?', [id]);
    res.json(result);
  });
}

  // get all metadata for a single track (by id)
  app.get('/api/powerpoint-all-meta/:id', async (req, res) => {
    const { id } = req.params;
    let [result] = await db.execute(`
    SELECT * FROM powerpoint WHERE id = ?
  `, [id]);
    res.json(result);
  });
