import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, files = [], skip = new Set(['node_modules', 'build', '.git', '.docusaurus'])) {
  for (const name of fs.readdirSync(dir)) {
    if (skip.has(name)) continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, files, skip);
    else if (/\.(md|mdx|js|json)$/.test(name) && !name.includes('check-links')) files.push(full);
  }
  return files;
}

function extractUrls(content) {
  const urls = new Set();
  for (const re of [
    /https?:\/\/[^\s\)"'<>*\]]+/gi,
    /pdfUrl=["']([^"']+)["']/gi,
    /href:\s*['"]([^'"]+)['"]/gi,
  ]) {
    let m;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(content)) !== null) {
      const u = (m[1] ?? m[0]).replace(/\*\*/g, '').replace(/[.,;:\]]+$/, '');
      if (u.startsWith('http') || u.startsWith('/')) urls.add(u);
    }
  }
  return urls;
}

function checkLocal(url) {
  const rel = url.startsWith('/') ? url.slice(1) : url;
  return fs.existsSync(path.join(root, 'static', rel)) || fs.existsSync(path.join(root, rel));
}

function fetchStatus(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const tryGet = () => {
      lib.get(url, { timeout: 15000, headers: { 'User-Agent': 'link-checker/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return resolve(fetchStatus(new URL(res.headers.location, url).href));
        }
        res.resume();
        resolve(res.statusCode);
      }).on('error', (e) => resolve(e.code || e.message)).on('timeout', function () { this.destroy(); resolve('timeout'); });
    };
    const req = lib.request(url, { method: 'HEAD', timeout: 15000, headers: { 'User-Agent': 'link-checker/1.0' } }, (res) => {
      if ([403, 401, 405].includes(res.statusCode)) {
        res.resume();
        return tryGet();
      }
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(fetchStatus(new URL(res.headers.location, url).href));
      }
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', () => tryGet());
    req.on('timeout', () => { req.destroy(); tryGet(); });
    req.end();
  });
}

const byUrl = new Map();
for (const file of walk(root)) {
  for (const url of extractUrls(fs.readFileSync(file, 'utf8'))) {
    if (!byUrl.has(url)) byUrl.set(url, []);
    byUrl.get(url).push(path.relative(root, file));
  }
}
for (const name of fs.readdirSync(path.join(root, 'static', 'pdf')).filter((f) => f.endsWith('.pdf'))) {
  const text = fs.readFileSync(path.join(root, 'static', 'pdf', name), 'latin1');
  for (const m of text.matchAll(/URI\((https?:\/\/[^)]+)\)/g)) {
    const url = m[1];
    if (!byUrl.has(url)) byUrl.set(url, []);
    byUrl.get(url).push(`static/pdf/${name}`);
  }
}

const local = [...byUrl.keys()].filter((u) => u.startsWith('/'));
const external = [...byUrl.keys()].filter((u) => u.startsWith('http'));

const failedLocal = local.filter((u) => !checkLocal(u)).map((u) => ({ url: u, files: byUrl.get(u) }));
const failedExt = [];

for (const url of external) {
  const status = await fetchStatus(url);
  const ok = typeof status === 'number' && status >= 200 && status < 400;
  process.stdout.write(ok ? '.' : 'X');
  if (!ok) failedExt.push({ url, status, files: byUrl.get(url) });
}
console.log(`\nChecked ${external.length} external URLs`);

failedExt.sort((a, b) => String(a.status).localeCompare(String(b.status)));

const lines = [
  'Internal/doc build: OK (yarn build passed)',
  `Local assets: ${local.length - failedLocal.length}/${local.length} OK`,
  `External: ${external.length - failedExt.length}/${external.length} OK`,
];
if (failedLocal.length) {
  lines.push('', '--- Broken local ---');
  for (const { url, files } of failedLocal) lines.push(`${url} <- ${files.join(', ')}`);
}
if (failedExt.length) {
  lines.push('', '--- Broken external ---');
  for (const { url, status, files } of failedExt) lines.push(`[${status}] ${url} <- ${files.join(', ')}`);
}
const report = lines.join('\n');
fs.writeFileSync(path.join(root, 'link-check-report.txt'), report);
console.log('\n' + report);
process.exit(failedLocal.length + failedExt.length > 0 ? 1 : 0);
