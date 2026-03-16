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

http.createServer((req, res) => {
  // POST /api/tips — add a new tip
  if (req.method === 'POST' && req.url === '/api/tips') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const tip = JSON.parse(body);
        if (!tip.title || !tip.body || !tip.category) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'title, body, and category are required' }));
          return;
        }
        const existing = JSON.parse(fs.readFileSync(TIPS_FILE, 'utf8'));
        const newTip = {
          id: existing.length ? Math.max(...existing.map(t => t.id)) + 1 : 1,
          category: tip.category,
          title: tip.title.trim(),
          body: tip.body.trim(),
          author: tip.author ? tip.author.trim() : null,
          link: tip.link ? tip.link.trim() : null,
          image: null,
        };
        existing.push(newTip);
        fs.writeFileSync(TIPS_FILE, JSON.stringify(existing, null, 2));
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newTip));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  const filePath = path.join(ROOT, url);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const headers = {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    };

    // Gzip compress text resources
    const acceptGzip = (req.headers['accept-encoding'] || '').includes('gzip');
    if (acceptGzip && COMPRESSIBLE.has(ext)) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      zlib.gzip(data, (_, compressed) => res.end(compressed));
    } else {
      res.writeHead(200, headers);
      res.end(data);
    }
  });
}).listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
