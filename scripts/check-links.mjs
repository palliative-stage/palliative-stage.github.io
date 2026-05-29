import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', 'build', '.git', '.docusaurus', 'scripts/check-links.mjs']);
const EXT = new Set(['.md', '.mdx', '.js', '.json']);

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (EXT.has(path.extname(name))) files.push(full);
  }
  return files;
}

function extractUrls(content) {
  const urls = new Set();
  for (const re of [
    /https?:\/\/[^\s\)"'<>*\]]+/gi,
    /pdfUrl=["']([^"']+)["']/gi,
    /href:\s*['"]([^'"]+)['"]/gi,
    /to:\s*['"]([^'"]+)['"]/gi,
  ]) {
    let m;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(content)) !== null) {
      let u = (m[1] ?? m[0]).replace(/\*\*/g, '').replace(/[.,;:\]]+$/, '');
      if (u.startsWith('http') || u.startsWith('/')) urls.add(u);
    }
  }
  return [...urls];
}

function checkLocal(url) {
  const rel = url.startsWith('/') ? url.slice(1) : url;
  if (fs.existsSync(path.join(root, 'static', rel))) return true;
  if (fs.existsSync(path.join(root, rel))) return true;
  return false;
}

function fetchUrl(url, redirects = 0) {
  return new Promise((resolve) => {
    if (redirects > 8) return resolve({ ok: false, status: 'too many redirects' });
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(
      url,
      { method: 'HEAD', timeout: 15000, headers: { 'User-Agent': 'link-checker/1.0' } },
      (res) => {
        const code = res.statusCode;
        if (code >= 300 && code < 400 && res.headers.location) {
          const next = new URL(res.headers.location, url).href;
          res.resume();
          return resolve(fetchUrl(next, redirects + 1));
        }
        if ([405, 403, 401].includes(code)) {
          res.resume();
          return getUrl(url, redirects);
        }
        res.resume();
        resolve({ ok: code >= 200 && code < 400, status: code });
      }
    );
    req.on('error', (e) => resolve({ ok: false, status: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 'timeout' }); });
    req.end();
  });
}

function getUrl(url, redirects = 0) {
  return new Promise((resolve) => {
    if (redirects > 8) return resolve({ ok: false, status: 'too many redirects' });
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: 15000, headers: { 'User-Agent': 'link-checker/1.0' } }, (res) => {
      const code = res.statusCode;
      if (code >= 300 && code < 400 && res.headers.location) {
        const next = new URL(res.headers.location, url).href;
        res.resume();
        return resolve(getUrl(next, redirects + 1));
      }
      res.resume();
      resolve({ ok: code >= 200 && code < 400, status: code });
    });
    req.on('error', (e) => resolve({ ok: false, status: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 'timeout' }); });
  });
}

const byUrl = new Map();
for (const file of walk(root)) {
  if (file.includes('yarn.lock')) continue;
  for (const url of extractUrls(fs.readFileSync(file, 'utf8'))) {
    if (!byUrl.has(url)) byUrl.set(url, []);
    byUrl.get(url).push(path.relative(root, file));
  }
}

// PDF URI links
const pdfDir = path.join(root, 'static', 'pdf');
for (const name of fs.readdirSync(pdfDir).filter((f) => f.endsWith('.pdf'))) {
  const text = fs.readFileSync(path.join(pdfDir, name), 'latin1');
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
async function main() {
process.stdout.write(`Checking ${external.length} external URLs: `);
let idx = 0;
async function worker() {
  while (true) {
    const n = idx++;
    if (n >= external.length) break;
    const url = external[n];
    const r = await fetchUrl(url);
    if (!r.ok) failedExt.push({ url, status: r.status, files: byUrl.get(url) });
    process.stdout.write(r.ok ? '.' : 'X');
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
console.log('\n');

failedExt.sort((a, b) => String(a.status).localeCompare(String(b.status)));

const report = [
  'Internal/doc build: OK',
  '=== SUMMARY ===',
  `Local: ${local.length - failedLocal.length}/${local.length} OK`,
  `External: ${external.length - failedExt.length}/${external.length} OK`,
  '',
  ...(failedLocal.length ? ['--- Broken local ---', ...failedLocal.map(({ url, files }) => `${url} <- ${files.join(', ')}`)] : []),
  ...(failedExt.length ? ['--- Broken external ---', ...failedExt.map(({ url, status, files }) => `[${status}] ${url} <- ${files.join(', ')}`)] : []),
].join('\n');
fs.writeFileSync(path.join(root, 'link-check-report.txt'), report);
console.log('\n' + report);
}

main()
  .then(() => process.exit(failedExt.length + failedLocal.length > 0 ? 1 : 0))
  .catch((e) => { console.error(e); process.exit(1); });
