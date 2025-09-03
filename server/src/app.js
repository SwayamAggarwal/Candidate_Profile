const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const profileRouter = require('./routes/profile');
const queryRouter = require('./routes/query');

function createApp() {
  const app = express();

  const allowedOrigins = (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Dynamic CORS decision per request so we can compare origin vs host
  app.use(
    cors((req, cb) => {
      const origin = req.headers.origin;
      const allowWildcard = allowedOrigins.includes('*');
      const allowListed = origin && allowedOrigins.includes(origin);
      let allow = false;
      if (!origin || allowWildcard || allowListed) {
        allow = true;
      } else {
        try {
          const reqHost = (req.headers.host || '').toLowerCase();
          const originHost = new URL(origin).host.toLowerCase();
          if (reqHost && originHost && reqHost === originHost) allow = true; // same host, different port
        } catch {}
      }
      cb(null, {
        origin: allow,
        credentials: false,
        optionsSuccessStatus: 200,
      });
    })
  );
  app.use(
    helmet({
      contentSecurityPolicy: false, // allow inline scripts for the simple CDN React setup
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(morgan('dev'));
  app.use(express.json({ limit: '1mb' }));

  // Health
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // API routes
  app.use('/api/profile', profileRouter);
  app.use('/api', queryRouter);

  // Serve static frontend from client directory
  const clientDir = path.join(__dirname, '../../client');
  app.use(express.static(clientDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });

  // Error handler
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
  });

  return app;
}

module.exports = { createApp };
