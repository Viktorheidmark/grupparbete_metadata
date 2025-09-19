export default function setupPdfRestRoutes(app, db) {

    // Sök i PDF metadata
    app.get('/api/pdf-search/:field/:searchValue', async (req, res) => {
        try {
            let { field, searchValue } = req.params;
            field = field.toLowerCase();

            if (!['title', 'author', 'text', 'all'].includes(field)) {
                res.json({ error: 'Invalid field name!' });
                return;
            }

            let whereClause;
            if (field === 'title') {
                whereClause = "LOWER(meta->>'$.info.Title') LIKE LOWER(?)";
            } else if (field === 'author') {
                whereClause = "LOWER(meta->>'$.info.Author') LIKE LOWER(?)";
            } else if (field === 'text') {
                whereClause = "LOWER(meta->>'$.text') LIKE LOWER(?)";
            } else if (field === 'all') {
                whereClause = `
          LOWER(meta->>'$.info.Title') LIKE LOWER(?)
          OR LOWER(meta->>'$.info.Author') LIKE LOWER(?)
          OR LOWER(meta->>'$.text') LIKE LOWER(?)
        `;
            }

            let params = ['%' + searchValue + '%'];
            if (field === 'all') params = [params[0], params[0], params[0]];

            const [result] = await db.execute(`
        SELECT 
          id,
          meta->>'$.fileName' AS fileName,
          meta->>'$.info.Title' AS title,
          meta->>'$.info.Author' AS author,
          meta->>'$.text' AS text
        FROM pdf
        WHERE ${whereClause}
      `, params);

            res.json(result);

        } catch (err) {
            console.error("DB error:", err);
            res.json({ error: "Database query failed" });
        }
    });

    // Hämta all metadata för en PDF via id
    app.get('/api/pdf-all-meta/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.execute(`SELECT * FROM pdf WHERE id = ?`, [id]);
            res.json(result);
        } catch (err) {
            console.error("DB error:", err);
            res.json({ error: "Database query failed" });
        }
    });

}
