// Tiny static server for previewing index.html in a browser (dev only; not shipped).
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, port = +(process.env.PORT || 5178);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.ico': 'image/x-icon' };
http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, () => console.log('voice-meter preview on http://localhost:' + port));
