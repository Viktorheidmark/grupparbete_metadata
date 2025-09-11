export default function setupPicturesRestRoutes(app, db) {

  // Sök bilder på Make/Model och returnera endast id, file, Make, Model
  app.get('/api/pictures-search/:field/:searchValue', async (req, res) => {
    const { field, searchValue } = req.params;

    // tillåt bara Make/Model (rätt case, eftersom JSON-keys är case-känsliga)
    if (!['Make', 'Model'].includes(field)) {
      res.status(400).json({ error: 'Invalid field name!' });
      return;
    }

    const [result] = await db.execute(`
      SELECT
        id,
        meta->>'$.file'                    AS file,
        COALESCE(
          meta->>'$.metadata.Make',
          meta->>'$.metadata.make'
        )                                  AS Make,
        COALESCE(
          meta->>'$.metadata.Model',
          meta->>'$.metadata.model'
        )                                  AS Model,
        meta->>'$.metadata.latitude'       AS latitude,
        meta->>'$.metadata.longitude'      AS longitude
      FROM pictures
      WHERE LOWER(meta->>'$.metadata.${field}') LIKE LOWER(?)
    `, ['%' + searchValue + '%']);

    res.json(result);
  });

  // Hämta all metadata för en bild (ett objekt, inte en array)
  app.get('/api/pictures-all-meta/:id', async (req, res) => {
    const { id } = req.params;
    const [rows] = await db.execute(`SELECT * FROM pictures WHERE id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  });

}