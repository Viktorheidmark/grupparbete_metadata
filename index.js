import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dbCredentials from './db-credentials.js';

import setupPicturesRestRoutes from './pictures-rest-routes.js';
import setupPdfRestRoutes from './pdf-rest-routes.js';
import setupPowerpointRestRoutes from './powerpoint-rest-routes.js';
import setupMusicRestRoutes from './music-rest-routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Skapa DB-connection pool
const pool = mysql.createPool({ ...dbCredentials, waitForConnections: true, connectionLimit: 10 });

// Registrera alla REST-routes
setupPicturesRestRoutes(app, pool);
setupPdfRestRoutes(app, pool);
setupPowerpointRestRoutes(app, pool);
setupMusicRestRoutes(app, pool);

// GeoJSON endpoint från bilder
app.get('/api/pictures-geojson', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
      SELECT id,
        JSON_UNQUOTE(JSON_EXTRACT(meta, '$.file')) AS fileName,
        JSON_UNQUOTE(JSON_EXTRACT(meta, '$.metadata.make')) AS make,
        JSON_UNQUOTE(JSON_EXTRACT(meta, '$.metadata.model')) AS model,
        lat, lng
      FROM pictures
      WHERE lat IS NOT NULL AND lng IS NOT NULL
    `);

        const features = rows.map(r => ({
            type: 'Feature',
            properties: {
                id: r.id,
                fileName: r.fileName,
                make: r.make,
                model: r.model
            },
            geometry: { type: 'Point', coordinates: [parseFloat(r.lng), parseFloat(r.lat)] }
        }));

        res.json({ type: 'FeatureCollection', features });
    } catch (err) {
        console.error('pictures-geojson error', err);
        res.status(500).json({ error: 'Could not build geojson' });
    }
});

// Starta server
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
