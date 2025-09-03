export default function setupPowerpointRestRoutes(app, db) {

  app.get('/api/powerpoint-search/:field/:searchValue', async (req, res) => {
    // get field and searhValue from the request parameters
    const { field, searchValue } = req.params;
    // check that field is a valid field, if not do nothing
    if (!['Title', 'Author'].includes(field)) {
      res.json({ error: 'Invalid field name!' });
      return;
    }
    // run the db query as a prepared statement
    const [result] = await db.execute(`
    SELECT id,meta->>'$.fileName' AS FileName,
      meta->>'$.Title' AS Title,
      meta->>'$.Author' AS Author
    FROM powerpoint
    WHERE LOWER(meta->>'$.${field}') LIKE LOWER(?)
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