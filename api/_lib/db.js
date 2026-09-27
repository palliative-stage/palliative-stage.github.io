/**
 * Shared Postgres pool for serverless API routes.
 */

const { Pool } = require('pg');

function buildConnectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return null;
  }
  if (/uselibpqcompat=true/i.test(url)) {
    return url;
  }
  if (/sslmode=(prefer|require|verify-ca)(?=(&|$))/i.test(url)) {
    return url.replace(/sslmode=(prefer|require|verify-ca)(?=(&|$))/i, 'sslmode=verify-full');
  }
  if (/sslmode=/i.test(url)) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}sslmode=verify-full`;
}

let pool;
function getPool() {
  if (!pool) {
    const connectionString = buildConnectionString();
    if (!connectionString) {
      return null;
    }
    pool = new Pool({
      connectionString,
      max: 2,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

module.exports = {
  buildConnectionString,
  getPool,
};
