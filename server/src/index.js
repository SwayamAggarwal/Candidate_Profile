// Server bootstrap: connect to Mongo, then start the API.
// Keeps logs practical (redacts secrets), and nudges the port if the default is taken.
require('dotenv').config();
const { connectDB } = require('./db');
const { createApp } = require('./app');

const PORT = process.env.PORT || 4000;
const RAW_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

if (!RAW_URI) {
  console.error('Missing MONGODB_URI in environment');
  process.exit(1);
}

// Attach a database name to the URI path if it doesn't already include one.
function withDbName(uri, dbName) {
  if (!dbName) return uri;
  // Only add dbName if URI has no explicit path segment (e.g., ends with .net/ or .net)
  try {
    const hasSlash = uri.match(/mongodb(\+srv)?:\/\/[^/]+\/(.*)/);
    if (hasSlash && hasSlash[2] && !hasSlash[2].startsWith('?')) return uri; // already has a path
    const [base, query = ''] = uri.split('?');
    const baseFixed = base.endsWith('/') ? base : base + '/';
    return query ? `${baseFixed}${dbName}?${query}` : `${baseFixed}${dbName}`;
  } catch {
    return uri;
  }
}

const MONGODB_URI = withDbName(RAW_URI, DB_NAME);
// Remove password from logs to avoid leaking secrets in terminals/CI.
const redact = (s) => s.replace(/:\\?[^@]+@/, ':*****@');

// Try the desired port, then increment a few times if it's busy.
function listenWithRetry(app, port, attempts = 10) {
  return new Promise((resolve, reject) => {
    const tryListen = (p, remaining) => {
      const server = app.listen(p, () => {
        console.log(`API listening on http://localhost:${p}`);
        resolve(server);
      });
      server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE' && remaining > 0) {
          const next = Number(p) + 1;
          console.warn(`Port ${p} in use, trying ${next}...`);
          setTimeout(() => tryListen(next, remaining - 1), 200);
        } else {
          reject(err);
        }
      });
    };
    tryListen(Number(port), attempts);
  });
}

(async () => {
  try {
    await connectDB(MONGODB_URI);
    console.log('Connected to MongoDB');
    const app = createApp();
    await listenWithRetry(app, PORT);
  } catch (err) {
    if (err && err.message) {
      console.error('Failed to start server. Check MONGODB_URI and DB user permissions.');
      console.error('Using DB_NAME:', DB_NAME || '(not set)');
      console.error('Raw URI (redacted):', redact(RAW_URI));
      console.error('Computed URI (redacted):', redact(MONGODB_URI));
    }
    console.error(err);
    process.exit(1);
  }
})();
