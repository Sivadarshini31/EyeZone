import http from 'http';

const CLAUDE_API_URL = process.env.CLAUDE_API_URL;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const PORT = process.env.PORT || 8787;

if (!CLAUDE_API_URL || !CLAUDE_API_KEY) {
  console.warn('Warning: CLAUDE_API_URL or CLAUDE_API_KEY is not set. Server will still start but proxy calls will fail.');
}

const defaultHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const server = http.createServer(async (req, res) => {
  // Basic CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, defaultHeaders);
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/api/claude') {
    res.setHeader('Content-Type', 'application/json');
    Object.entries(defaultHeaders).forEach(([k, v]) => res.setHeader(k, v));

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        if (!CLAUDE_API_URL || !CLAUDE_API_KEY) {
          res.writeHead(500);
          return res.end(JSON.stringify({ error: 'Server not configured with CLAUDE_API_URL and CLAUDE_API_KEY' }));
        }

        const parsed = body ? JSON.parse(body) : {};

        // Forward the request body to the Claude endpoint
        const upstreamResp = await fetch(CLAUDE_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CLAUDE_API_KEY}`,
          },
          body: JSON.stringify(parsed),
        });

        const text = await upstreamResp.text();
        res.writeHead(upstreamResp.status, { 'Content-Type': upstreamResp.headers.get('content-type') || 'application/json' });
        return res.end(text);
      } catch (err) {
        console.error('Proxy error:', err);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Proxy failed', details: String(err) }));
      }
    });

    return;
  }

  // Not found
  res.writeHead(404, { 'Content-Type': 'application/json', ...defaultHeaders });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Claude proxy server running on http://localhost:${PORT}`);
});

export default server;
