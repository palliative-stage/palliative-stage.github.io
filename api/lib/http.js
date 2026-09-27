/**
 * Small helpers shared by the staff API routes.
 */

function sendJson(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(body);
}

async function readJsonBody(req) {
  if (req.body !== undefined && req.body !== null && req.body !== '') {
    if (typeof req.body === 'string') {
      return JSON.parse(req.body);
    }
    if (Buffer.isBuffer(req.body)) {
      return JSON.parse(req.body.toString('utf8'));
    }
    return req.body;
  }

  const raw = await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

  if (!raw) return null;
  return JSON.parse(raw);
}

module.exports = {
  sendJson,
  readJsonBody,
};
