export default function setupPdfRestRoutes(app, db) {

    app.get('/api/pdf-search/:field/:searchValue', async (req, res) => {
        // get field and searhValue from the request parameters
        let { field, searchValue } = req.params;
        // check that field is a valid field, if not do nothing
        if (!['title', 'author'].includes(field)) {
            res.json({ error: 'Invalid field name!' });
            return;
        }
        // capitalize field name
        field = field[0].toUpperCase() + field.slice(1);

        // run the db query as a prepared statement
        const [result] = await db.execute(`
            SELECT id,meta->>'$.fileName' AS fileName,
            meta->>'$.info.Title' AS title,
            meta->>'$.info.Author' AS author
            FROM pdf
            WHERE LOWER(meta->>'$.info.${field}') LIKE LOWER(?)
        `, ['%' + searchValue + '%']);
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