import express from 'express';
import mysql from 'mysql2/promise';
import dbCredentials from './db-credentials.js';
import setupMusicRestRoutes from './backend/music-rest-routes.js';

// connect to db
const db = await mysql.createConnection(dbCredentials);

// create a web server - app
const app = express();

// add rest routes for music search
setupMusicRestRoutes(app, db);

// Serve files from the frontend folder
app.use(express.static('frontend'));

// Start the web server
app.listen(3010, () => console.log('Listening on http://localhost:3010'));