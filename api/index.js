// Vercel serverless entry: wraps the existing Express app and reuses
// the Mongo connection across invocations for performance.
const serverless = require('serverless-http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const { createApp } = require('../server/src/app');
const { connectDB } = require('../server/src/db');

let mongoReady = null;
const app = createApp();
const handler = serverless(app);

module.exports = async (req, res) => {
  try {
    if (!mongoReady) {
      const uri = process.env.MONGODB_URI;
      if (!uri) throw new Error('Missing MONGODB_URI');
      mongoReady = connectDB(uri);
    }
    await mongoReady;
  } catch (err) {
    console.error('DB connect error:', err && err.message ? err.message : err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Database connection failed' }));
    return;
  }
  return handler(req, res);
};

