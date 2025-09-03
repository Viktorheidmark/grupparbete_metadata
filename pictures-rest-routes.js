export default function setupPicturesRestRoutes(app, db) {

    app.get('/api/pictures-search/:field/:searchValue', async (req, res) => {
        // get field and searhValue from the request parameters
        const { field, searchValue } = req.params;
        // check that field is a valid field, if not do nothing
        if (!['Make', 'Model'].includes(field)) {
            res.json({ error: 'Invalid field name!' });
            return;
        }
        // run the db query as a prepared statement
        const [result] = await db.execute(`
    SELECT id,meta->>'$.file' AS fileName,
      meta->>'$.metadata.make' AS make,
      meta->>'$.metadata.model' AS model
    FROM pictures
    WHERE LOWER(meta->>'$.metadata.${field}') LIKE LOWER(?)
  `, ['%' + searchValue + '%']
        );
        // return the result as json
        res.json(result);
    });

    // get all metadata for a single track (by id)
    app.get('/api/pictures-all-meta/:id', async (req, res) => {
        const { id } = req.params;
        let [result] = await db.execute(`
    SELECT * FROM pictures WHERE id = ?
  `, [id]);
        res.json(result);
    });

}