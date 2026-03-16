const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Text types that benefit from gzip
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.svg']);

const TIPS_FILE = path.join(ROOT, 'data', 'tips.json');

// Rate limiter: max 10 POST requests per IP per minute
const rateBuckets = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;
function rateOk(ip) {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) || []).filter(t => now - t < RATE_WINDOW);
  if (hits.length >= RATE_LIMIT) return false;
  hits.push(now);
  rateBuckets.set(ip, hits);
  return true;
}

const MAX_BODY = 64 * 1024; // 64 KB max POST body
const VALID_CATEGORIES = ['Tactics', 'Aircraft', 'Ships', 'Weapons', 'Sensors', 'General'];
const MAX_TITLE = 200;
const MAX_BODY_FIELD = 10_000;
const MAX_AUTHOR = 100;
const MAX_LINK = 500;

// Security headers applied to every response
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

http.createServer((req, res) => {
  // POST /api/tips — add a new tip
  if (req.method === 'POST' && req.url === '/api/tips') {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (!rateOk(ip)) {
      res.writeHead(429, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
      res.end(JSON.stringify({ error: 'Too many requests. Try again later.' }));
      return;
    }

    let body = '';
    let aborted = false;
    req.on('data', chunk => {
      body += chunk;
      if (body.length > MAX_BODY) {
        aborted = true;
        res.writeHead(413, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
        res.end(JSON.stringify({ error: 'Request body too large' }));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (aborted) return;
      try {
        const tip = JSON.parse(body);

        // Validate required fields exist and are strings
        if (!tip.title || typeof tip.title !== 'string' ||
            !tip.body  || typeof tip.body  !== 'string' ||
            !tip.category || typeof tip.category !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
          res.end(JSON.stringify({ error: 'title, body, and category are required' }));
          return;
        }

        // Enforce length limits
        if (tip.title.trim().length > MAX_TITLE ||
            tip.body.trim().length > MAX_BODY_FIELD) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
          res.end(JSON.stringify({ error: 'Title or body exceeds maximum length' }));
          return;
        }
        if (tip.author && String(tip.author).trim().length > MAX_AUTHOR) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
          res.end(JSON.stringify({ error: 'Author name too long' }));
          return;
        }

        // Validate category against allowlist
        if (!VALID_CATEGORIES.includes(tip.category)) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
          res.end(JSON.stringify({ error: 'Invalid category' }));
          return;
        }

        // Validate link URL if provided
        if (tip.link) {
          const linkStr = String(tip.link).trim();
          if (linkStr.length > MAX_LINK || !/^https?:\/\//i.test(linkStr)) {
            res.writeHead(400, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
            res.end(JSON.stringify({ error: 'Link must be a valid http/https URL' }));
            return;
          }
        }

        const existing = JSON.parse(fs.readFileSync(TIPS_FILE, 'utf8'));
        const newTip = {
          id: existing.length ? Math.max(...existing.map(t => t.id)) + 1 : 1,
          category: tip.category,
          title: tip.title.trim(),
          body: tip.body.trim(),
          author: tip.author ? String(tip.author).trim() : null,
          link: tip.link ? String(tip.link).trim() : null,
          image: null,
        };
        existing.push(newTip);
        fs.writeFileSync(TIPS_FILE, JSON.stringify(existing, null, 2));
        res.writeHead(201, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
        res.end(JSON.stringify(newTip));
      } catch (e) {
        console.error('POST /api/tips error:', e);
        res.writeHead(500, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  }

  // ── Static file serving ──
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';

  // Decode percent-encoded characters, normalize, and resolve
  let decoded;
  try { decoded = decodeURIComponent(url); } catch { decoded = url; }
  const filePath = path.resolve(path.join(ROOT, decoded));

  // Path traversal guard: resolved path must be inside ROOT
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403, { ...SECURITY_HEADERS });
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { ...SECURITY_HEADERS });
        res.end('Not found');
      } else {
        res.writeHead(500, { ...SECURITY_HEADERS });
        res.end('Internal server error');
      }
      return;
    }
    const headers = {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      ...SECURITY_HEADERS,
    };

    // Gzip compress text resources
    const acceptGzip = (req.headers['accept-encoding'] || '').includes('gzip');
    if (acceptGzip && COMPRESSIBLE.has(ext)) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      zlib.gzip(data, (err, compressed) => {
        if (err) { res.end(data); return; }
        res.end(compressed);
      });
    } else {
      res.writeHead(200, headers);
      res.end(data);
    }
  });
}).listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
