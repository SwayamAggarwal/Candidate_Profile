// Vercel serverless entry: wraps the existing Express app and reuses
// the Mongo connection across invocations for performance.
const serverless = require('serverless-http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const { createApp } = require('../server/src/app');
const { connectDB } = require('../server/src/db');

let mongoReady = null;
let isConnected = false;
const app = createApp();
const handler = serverless(app);

module.exports = async (req, res) => {
  try {
    if (!isConnected) {
      const uri = process.env.MONGODB_URI;
      if (!uri) throw new Error('Missing MONGODB_URI');
      mongoReady = connectDB(uri);
      await mongoReady;
      isConnected = true;
    }
  } catch (err) {
    const msg = (err && err.message) ? err.message : String(err);
    console.error('DB connect error:', msg);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    // Provide a helpful hint without leaking secrets
    res.end(JSON.stringify({ error: 'Database connection failed. Ensure MONGODB_URI/DB_NAME are set and Atlas IP allowlist allows Vercel (0.0.0.0/0 for testing).'}));
    return;
  }
  return handler(req, res);
};
