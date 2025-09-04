import express from 'express';
import mysql from 'mysql2/promise';
import dbCredentials from './db-credentials.js';

const server = express();

const db = await mysql.createConnection(dbCredentials);

async function query(sql, listOfValues) {
  let result = await db.execute(sql, listOfValues);
  return result[0];
}

server.use(express.static('frontend'));

// Note: Port 5173 is needed for the API key we
// use for Google Maps in the harder / more advanced
// example to work!

server.listen(5173, () => console.log('Listening on http://localhost:5173'));

// REST routes

// For the simple example
server.get('/api/images', async (request, response) => {
  let result = await query('SELECT * FROM images');
  response.json(result);
});

// For the harder / more advanced example
server.get('/api/map-image-search/:latitude/:longitude/:radius', async (request, response) => {
  let { latitude, longitude, radius } = request.params;
  let result = await query(`
    SELECT * FROM (
      SELECT *,(((acos(sin((?*pi()/180)) * sin((metadata -> '$.latitude' *pi()/180))+cos((?*pi()/180)) * cos((metadata -> '$.latitude' * pi()/180)) * cos(((? - metadata -> '$.longitude')*pi()/180))))*180/pi())*60*1.1515*1.609344) as distance FROM images) AS subquery
    WHERE distance <= ?
  `, [latitude, latitude, longitude, radius]);
  response.json(result);
});
