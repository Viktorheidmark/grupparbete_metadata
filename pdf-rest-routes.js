export default function setupPdfRestRoutes(app, db) {

    app.get('/api/pdf-search/:field/:searchValue', async (req, res) => {
        // get field and searhValue from the request parameters
        const { field, searchValue } = req.params;
        // check that field is a valid field, if not do nothing
        if (!['title', 'author', 'subject'].includes(field)) {
            res.json({ error: 'Invalid field name!' });
            return;
        }
        // run the db query as a prepared statement
        const [result] = await db.execute(`
    SELECT id,meta->>'$.fileName' AS fileName,
      meta->>'$.common.title' AS titel,
      meta->>'$.common.author' AS författare
    FROM music
    WHERE LOWER(meta->>'$.common.${field}') LIKE LOWER(?)
  `, ['%' + searchValue + '%']
        );
        // return the result as json
        res.json(result);
    });

    // get all metadata for a single track (by id)
    app.get('/api/pdf-all-meta/:id', async (req, res) => {
        const { id } = req.params;
        let [result] = await db.execute(`
    SELECT * FROM pdf WHERE id = ?
  `, [id]);
        res.json(result);
    });

}