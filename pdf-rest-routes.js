export default function setupPdfRestRoutes(app, db) {
    app.get('/api/pdf-search/:field/:searchValue', async (req, res) => {
        let { field, searchValue } = req.params;
        if (!['title', 'author'].includes(field)) {
            res.json({ error: 'Invalid field name!' });
            return;
        }
        field = field[0].toUpperCase() + field.slice(1);
        const [result] = await db.execute(`
      SELECT id, JSON_UNQUOTE(JSON_EXTRACT(meta, '$.fileName')) AS fileName,
             JSON_UNQUOTE(JSON_EXTRACT(meta, '$.info.${field}')) AS ${field}
      FROM pdf
      WHERE LOWER(JSON_UNQUOTE(JSON_EXTRACT(meta, '$.info.${field}'))) LIKE LOWER(?)
    `, ['%' + searchValue + '%']);
        res.json(result);
    });

    app.get('/api/pdf-all-meta/:id', async (req, res) => {
        const { id } = req.params;
        const [result] = await db.execute('SELECT * FROM pdf WHERE id = ?', [id]);
        res.json(result);
    });
}
