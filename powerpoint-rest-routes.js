export default function setupPowerpointRestRoutes(app, db) {

  app.get('/api/powerpoint-search/:field/:searchValue', async (req, res) => {
    // get field and searhValue from the request parameters
    const { field, searchValue } = req.params;
    // check that field is a valid field, if not do nothing
    if (!['title', 'author'].includes(field)) {
      res.json({ error: 'Invalid field name!' });
      return;
    }
    // run the db query as a prepared statement
    const [result] = await db.execute(`
    SELECT id,meta->>'$.file' AS fileName,
      meta->>'$.common.title' AS title,
      meta->>'$.common.author' AS författare
    FROM powerpoint
    WHERE LOWER(meta->>'$.common.${field}') LIKE LOWER(?)
  `, ['%' + searchValue + '%']
    );
    // return the result as json
    res.json(result);
  });

  // get all metadata for a single track (by id)
  app.get('/api/powerpoint-all-meta/:id', async (req, res) => {
    const { id } = req.params;
    let [result] = await db.execute(`
    SELECT * FROM powerpoint WHERE id = ?
  `, [id]);
    res.json(result);
  });

}