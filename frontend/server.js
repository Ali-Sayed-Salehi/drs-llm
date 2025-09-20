// server.js (ESM)
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DIST = path.join(__dirname, 'dist');
const PORT = process.env.PORT || 2173;
const HOST = process.env.HOST || '0.0.0.0';

// Keep real client IPs when behind nginx
app.set('trust proxy', true);

// Security headers (tune CSP later if desired)
app.use(helmet({ contentSecurityPolicy: false }));

// Gzip/deflate compression
app.use(compression());

// 1) Serve static assets under /drs without auto index/redirects
app.use(
  '/drs',
  express.static(DIST, {
    index: false, // IMPORTANT: don't redirect /drs -> /drs/; we'll handle it
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        // Cache hashed assets aggressively
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  })
);

// 2) Serve the SPA shell for /drs (no redirect)
app.get('/drs', (_req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

// 3) SPA fallback for any deep link under /drs/* that wasn't a file
// Use a RegExp to bypass path-to-regexp quirks
// (static above runs first and serves real files; this catches the rest)
app.get(/^\/drs\/.*$/, (_req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`DRS frontend listening at http://${HOST}:${PORT}/drs`);
});
