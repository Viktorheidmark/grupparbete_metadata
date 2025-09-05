import express from 'express';
const app = express();
app.use(express.json());
app.use(express.static('frontend')); // om du serverar frontend från denna mapp

// Enkel geojson-endpoint
app.get('/api/geojson', (req, res) => {
    const geojson = {
        "type": "FeatureCollection",
        "features": [
            // ... dina features från DB eller fil ...
        ]
    };
    res.json(geojson);
});


// Start the web server
app.listen(3010, () => console.log('Listening on http://localhost:3010'));
