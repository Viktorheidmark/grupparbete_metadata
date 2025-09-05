export default function setupMusicRestRoutes(app, db) {
  app.get('/api/music-search/:field/:searchValue', async (req, res) => {
    const { field, searchValue } = req.params;
    if (!['title', 'album', 'artist', 'genre'].includes(field)) {
      res.json({ error: 'Invalid field name!' });
      return;
    }
    const [result] = await db.execute(`
      SELECT id, JSON_UNQUOTE(JSON_EXTRACT(meta, '$.file')) AS fileName,
             JSON_UNQUOTE(JSON_EXTRACT(meta, '$.common.${field}')) AS ${field}
      FROM music
      WHERE LOWER(JSON_UNQUOTE(JSON_EXTRACT(meta, '$.common.${field}'))) LIKE LOWER(?)
    `, ['%' + searchValue + '%']);
    res.json(result);
  });

  app.get('/api/music-all-meta/:id', async (req, res) => {
    const { id } = req.params;
    const [result] = await db.execute('SELECT * FROM music WHERE id = ?', [id]);
    res.json(result);
  });
}
