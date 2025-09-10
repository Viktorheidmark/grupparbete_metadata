import express from 'express';
import mysql from 'mysql2/promise';
import dbCredentials from './db-credentials.js';
import setupMusicRestRoutes from './music-rest-routes.js';
import setupPdfRestRoutes from './pdf-rest-routes.js';
import setupPicturesRestRoutes from './pictures-rest-routes.js';
import setupPowerpointRestRoutes from './powerpoint-rest-routes.js';


// connect to db
const db = await mysql.createConnection(dbCredentials);

// create a web server - app
const app = express();

// add rest routes for music search
setupMusicRestRoutes(app, db);
setupPdfRestRoutes(app, db);
setupPicturesRestRoutes(app, db);
setupPowerpointRestRoutes(app, db);

// Serve files from the frontend folder
app.use(express.static('frontend'));

// Start the web server
app.listen(3010, () => console.log('Listening on http://localhost:3010'));


// For the harder / more advanced example
app.get('/api/map-image-search/:latitude/:longitude/:radius', async (request, response) => {
    const latitude = parseFloat(request.params.latitude);
    const longitude = parseFloat(request.params.longitude);
    const radius = parseFloat(request.params.radius);

    try {
        const [result] = await db.execute(`
      SELECT * FROM (
        SELECT *,
          (((acos(sin((? * pi() / 180)) * sin((JSON_EXTRACT(metadata, '$.latitude') * pi() / 180)) +
          cos((? * pi() / 180)) * cos((JSON_EXTRACT(metadata, '$.latitude') * pi() / 180)) *
          cos(((? - JSON_EXTRACT(metadata, '$.longitude')) * pi() / 180)))) * 180 / pi()) * 60 * 1.1515 * 1.609344) AS distance
        FROM images
      ) AS subquery
      WHERE distance <= ?
    `, [latitude, latitude, longitude, radius]);

        response.json(result);
    } catch (error) {
        console.error('Error executing query:', error);
        response.status(500).json({ error: 'Database query failed' });
    }
});