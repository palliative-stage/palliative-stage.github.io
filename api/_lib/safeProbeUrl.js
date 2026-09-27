/**
 * SSRF guards for server-side link probing.
 * Allows only http(s) on ports 80/443, and rejects loopback, link-local,
 * RFC1918, and other non-public destinations before each fetch hop.
 */

const dns = require('dns').promises;
const net = require('net');

const MAX_REDIRECTS = 3;
const ALLOWED_PORTS = new Set([80, 443]);
const PROBE_TIMEOUT_MS = 5000;
const PROBE_USER_AGENT = 'PalliativeSiteErrorChecker/1.0';

const ipv4Block = new net.BlockList();
ipv4Block.addSubnet('0.0.0.0', 8, 'ipv4');
ipv4Block.addSubnet('10.0.0.0', 8, 'ipv4');
ipv4Block.addSubnet('100.64.0.0', 10, 'ipv4');
ipv4Block.addSubnet('127.0.0.0', 8, 'ipv4');
ipv4Block.addSubnet('169.254.0.0', 16, 'ipv4');
ipv4Block.addSubnet('172.16.0.0', 12, 'ipv4');
ipv4Block.addSubnet('192.168.0.0', 16, 'ipv4');
ipv4Block.addSubnet('224.0.0.0', 4, 'ipv4');
ipv4Block.addSubnet('240.0.0.0', 4, 'ipv4');

const ipv6Block = new net.BlockList();
ipv6Block.addAddress('::', 'ipv6');
ipv6Block.addAddress('::1', 'ipv6');
ipv6Block.addSubnet('fc00::', 7, 'ipv6');
ipv6Block.addSubnet('fe80::', 10, 'ipv6');
ipv6Block.addSubnet('ff00::', 8, 'ipv6');
ipv6Block.addSubnet('2001:db8::', 32, 'ipv6');

function canonicalHostname(hostname) {
  if (!hostname || typeof hostname !== 'string') return '';
  let host = hostname.toLowerCase();
  if (host.startsWith('[') && host.endsWith(']')) {
    host = host.slice(1, -1);
  }
  if (host.endsWith('.')) host = host.slice(0, -1);
  return host;
}

function mappedIpv4(ip) {
  const lower = String(ip).toLowerCase();
  if (!lower.startsWith('::ffff:')) return null;
  const rest = ip.slice(7);
  if (net.isIP(rest) === 4) return rest;
  const hexPair = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(rest);
  if (!hexPair) return null;
  const high = parseInt(hexPair[1], 16);
  const low = parseInt(hexPair[2], 16);
  return `${(high >> 8) & 255}.${high & 255}.${(low >> 8) & 255}.${low & 255}`;
}

function isBlockedIp(ip) {
  const family = net.isIP(ip);
  if (family === 4) return ipv4Block.check(ip, 'ipv4');
  if (family === 6) {
    const mapped = mappedIpv4(ip);
    if (mapped) return ipv4Block.check(mapped, 'ipv4');
    return ipv6Block.check(ip, 'ipv6');
  }
  return true;
}

function isBlockedHostname(hostname) {
  const host = canonicalHostname(hostname);
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (host === 'metadata.google.internal') return true;
  const ip = host;
  if (net.isIP(ip)) return isBlockedIp(ip);
  return false;
}

function portOf(url) {
  if (url.port) return Number(url.port);
  if (url.protocol === 'http:') return 80;
  if (url.protocol === 'https:') return 443;
  return NaN;
}

function parseHttpUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  if (!ALLOWED_PORTS.has(portOf(url))) return null;
  if (isBlockedHostname(url.hostname)) return null;
  return url;
}

async function assertSafeToFetch(url, { lookup = dns.lookup.bind(dns) } = {}) {
  const parsed = url instanceof URL ? parseHttpUrl(url.toString()) : parseHttpUrl(url);
  if (!parsed) return false;

  const host = canonicalHostname(parsed.hostname);
  if (net.isIP(host)) {
    return isBlockedIp(host) ? false : true;
  }

  let records;
  try {
    records = await lookup(host, { all: true, verbatim: true });
  } catch {
    return 'dns_failed';
  }

  const list = Array.isArray(records) ? records : records ? [records] : [];
  if (list.length === 0) return 'dns_failed';
  if (list.some((record) => isBlockedIp(record.address))) return false;
  return true;
}

function isRedirectStatus(status) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

async function discardBody(response) {
  if (response && response.body && typeof response.body.cancel === 'function') {
    try {
      await response.body.cancel();
    } catch {
      /* ignore */
    }
  }
}

async function probeUrl(rawUrl, deps = {}) {
  const doFetch = deps.fetch || globalThis.fetch;
  const lookup = deps.lookup || dns.lookup.bind(dns);
  const timeoutMs = deps.timeoutMs != null ? deps.timeoutMs : PROBE_TIMEOUT_MS;

  const original = (() => {
    try {
      const url = new URL(String(rawUrl));
      url.hash = '';
      return url.toString().slice(0, 2000);
    } catch {
      return null;
    }
  })();

  let current = parseHttpUrl(original);
  if (!current) {
    return { ok: false, skipped: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let method = 'HEAD';
    let redirects = 0;

    while (true) {
      const safety = await assertSafeToFetch(current, { lookup });
      if (safety === false) {
        return { ok: false, skipped: true, failedUrl: original };
      }
      if (safety === 'dns_failed') {
        return {
          ok: false,
          statusCode: null,
          failedUrl: original,
          probeMethod: method,
          probeError: 'dns_failed',
        };
      }

      let response = await doFetch(current.toString(), {
        method,
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': PROBE_USER_AGENT },
      });

      if ((response.status === 405 || response.status === 501) && method === 'HEAD') {
        await discardBody(response);
        method = 'GET';
        response = await doFetch(current.toString(), {
          method,
          redirect: 'manual',
          signal: controller.signal,
          headers: { 'User-Agent': PROBE_USER_AGENT },
        });
      }

      if (isRedirectStatus(response.status)) {
        const location = response.headers.get('location');
        await discardBody(response);
        if (!location) {
          return {
            ok: false,
            statusCode: response.status,
            failedUrl: original,
            probeMethod: method,
            probeError: 'missing_redirect_location',
          };
        }
        if (redirects >= MAX_REDIRECTS) {
          return {
            ok: true,
            statusCode: response.status,
            failedUrl: original,
            probeMethod: method,
          };
        }
        let next;
        try {
          next = parseHttpUrl(new URL(location, current).toString());
        } catch {
          next = null;
        }
        if (!next) {
          return { ok: false, skipped: true, failedUrl: original };
        }
        current = next;
        redirects += 1;
        continue;
      }

      await discardBody(response);
      return {
        ok: response.status < 400,
        statusCode: response.status,
        failedUrl: original,
        probeMethod: method,
      };
    }
  } catch (err) {
    return {
      ok: false,
      statusCode: null,
      failedUrl: original,
      probeMethod: 'HEAD',
      probeError: err.name === 'AbortError' ? 'timeout' : String(err.message || err).slice(0, 255),
    };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  MAX_REDIRECTS,
  ALLOWED_PORTS,
  parseHttpUrl,
  isBlockedIp,
  isBlockedHostname,
  assertSafeToFetch,
  probeUrl,
  PROBE_TIMEOUT_MS,
  PROBE_USER_AGENT,
};
