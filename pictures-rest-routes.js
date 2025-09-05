export default function setupPicturesRestRoutes(app, db) {
    app.get('/api/pictures-search/:field/:searchValue', async (req, res) => {
        const { field, searchValue } = req.params;
        if (!['Make', 'Model'].includes(field)) {
            res.json({ error: 'Invalid field name!' });
            return;
        }
        const [result] = await db.execute(`
      SELECT id, JSON_UNQUOTE(JSON_EXTRACT(meta, '$.file')) AS fileName,
             JSON_UNQUOTE(JSON_EXTRACT(meta, '$.metadata.make')) AS make,
             JSON_UNQUOTE(JSON_EXTRACT(meta, '$.metadata.model')) AS model
      FROM pictures
      WHERE LOWER(JSON_UNQUOTE(JSON_EXTRACT(meta, '$.metadata.${field}'))) LIKE LOWER(?)
    `, ['%' + searchValue + '%']);
        res.json(result);
    });

    app.get('/api/pictures-all-meta/:id', async (req, res) => {
        const { id } = req.params;
        const [result] = await db.execute('SELECT * FROM pictures WHERE id = ?', [id]);
        res.json(result);
    });
}

    // get all metadata for a single track (by id)
    app.get('/api/pictures-all-meta/:id', async (req, res) => {
        const { id } = req.params;
        let [result] = await db.execute(`
    SELECT * FROM pictures WHERE id = ?
  `, [id]);
        res.json(result);
    });

}