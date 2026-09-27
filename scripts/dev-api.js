/**
 * Local stand-in for the Vercel /api routes.
 *
 *   node scripts/dev-api.js
 *   DEV_API_PROXY=http://127.0.0.1:3001 yarn start
 */

const http = require('http');
const login = require('../api/auth/login');
const logout = require('../api/auth/logout');
const me = require('../api/auth/me');
const changePassword = require('../api/auth/change-password');
const profile = require('../api/auth/profile');
const users = require('../api/admin/users');
const resetPassword = require('../api/admin/users/reset-password');
const analyticsReport = require('../api/admin/analytics');
const analyticsIngest = require('../api/analytics');

const routes = {
  'POST /api/auth/login': login,
  'POST /api/auth/logout': logout,
  'GET /api/auth/me': me,
  'POST /api/auth/change-password': changePassword,
  'PATCH /api/auth/profile': profile,
  'GET /api/admin/users': users,
  'POST /api/admin/users': users,
  'POST /api/admin/users/reset-password': resetPassword,
  'GET /api/admin/analytics': analyticsReport,
  'POST /api/analytics': analyticsIngest,
  'OPTIONS /api/analytics': analyticsIngest,
};

function adaptResponse(res) {
  res.status = function status(code) {
    this.statusCode = code;
    return this;
  };
  res.json = function json(body) {
    if (!this.getHeader('Content-Type')) {
      this.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    this.end(JSON.stringify(body));
  };
  return res;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  req.query = Object.fromEntries(url.searchParams.entries());
  const handler = routes[`${req.method} ${url.pathname}`];
  if (!handler) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'not_found' }));
    return;
  }
  try {
    await handler(req, adaptResponse(res));
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'unavailable' }));
    }
  }
});

const port = Number(process.env.PORT || 3001);
server.listen(port, '127.0.0.1', () => {
  console.log(`Staff API listening on http://127.0.0.1:${port}`);
});
