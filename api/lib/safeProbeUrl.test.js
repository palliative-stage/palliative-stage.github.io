const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseHttpUrl,
  isBlockedIp,
  isBlockedHostname,
  assertSafeToFetch,
  probeUrl,
} = require('./safeProbeUrl');

describe('parseHttpUrl', () => {
  it('allows public https URLs on the default port', () => {
    const url = parseHttpUrl('https://www.palliativecareguidelines.scot.nhs.uk/');
    assert.equal(url.hostname, 'www.palliativecareguidelines.scot.nhs.uk');
  });

  it('allows public IPs on ports 80 and 443', () => {
    assert.ok(parseHttpUrl('http://8.8.8.8/'));
    assert.ok(parseHttpUrl('http://8.8.8.8:443/'));
  });

  it('rejects non-http(s) schemes', () => {
    assert.equal(parseHttpUrl('file:///etc/passwd'), null);
    assert.equal(parseHttpUrl('ftp://example.com/'), null);
    assert.equal(parseHttpUrl('mailto:a@b.c'), null);
    assert.equal(parseHttpUrl('javascript:alert(1)'), null);
  });

  it('rejects credentials in the URL', () => {
    assert.equal(parseHttpUrl('https://user:pass@example.com/'), null);
    assert.equal(parseHttpUrl('http://127.0.0.1:80@example.com/'), null);
  });

  it('rejects ports other than 80 and 443', () => {
    assert.equal(parseHttpUrl('http://example.com:8080/'), null);
    assert.equal(parseHttpUrl('https://example.com:8443/'), null);
  });

  it('rejects loopback, link-local, and RFC1918 literals including odd IPv4 forms', () => {
    assert.equal(parseHttpUrl('http://127.0.0.1/'), null);
    assert.equal(parseHttpUrl('http://2130706433/'), null);
    assert.equal(parseHttpUrl('http://0x7f000001/'), null);
    assert.equal(parseHttpUrl('http://0177.0.0.1/'), null);
    assert.equal(parseHttpUrl('http://127.1/'), null);
    assert.equal(parseHttpUrl('http://0/'), null);
    assert.equal(parseHttpUrl('http://169.254.169.254/latest/meta-data/'), null);
    assert.equal(parseHttpUrl('http://10.0.0.1/'), null);
    assert.equal(parseHttpUrl('http://192.168.1.1/'), null);
    assert.equal(parseHttpUrl('http://172.16.0.1/'), null);
    assert.equal(parseHttpUrl('http://[::1]/'), null);
    assert.equal(parseHttpUrl('http://[::ffff:127.0.0.1]/'), null);
  });

  it('rejects localhost and cloud-metadata hostnames', () => {
    assert.equal(parseHttpUrl('http://localhost/'), null);
    assert.equal(parseHttpUrl('http://foo.localhost/'), null);
    assert.equal(parseHttpUrl('http://printer.local/'), null);
    assert.equal(parseHttpUrl('http://metadata.google.internal/'), null);
    assert.equal(parseHttpUrl('http://foo.internal/'), null);
  });
});

describe('isBlockedIp / isBlockedHostname', () => {
  it('blocks RFC1918, loopback, link-local, CGNAT, and IPv6 unique-local', () => {
    assert.equal(isBlockedIp('10.1.2.3'), true);
    assert.equal(isBlockedIp('172.16.0.1'), true);
    assert.equal(isBlockedIp('172.31.255.255'), true);
    assert.equal(isBlockedIp('192.168.0.1'), true);
    assert.equal(isBlockedIp('127.0.0.1'), true);
    assert.equal(isBlockedIp('169.254.169.254'), true);
    assert.equal(isBlockedIp('100.64.0.1'), true);
    assert.equal(isBlockedIp('::1'), true);
    assert.equal(isBlockedIp('fc00::1'), true);
    assert.equal(isBlockedIp('fe80::1'), true);
    assert.equal(isBlockedIp('::ffff:7f00:1'), true);
  });

  it('allows public addresses, including 172.15 which is outside RFC1918', () => {
    assert.equal(isBlockedIp('8.8.8.8'), false);
    assert.equal(isBlockedIp('172.15.0.1'), false);
    assert.equal(isBlockedIp('1.1.1.1'), false);
    assert.equal(isBlockedHostname('cdel-palliative.org.il'), false);
  });
});

describe('assertSafeToFetch', () => {
  it('rejects a hostname that resolves to a private address', async () => {
    const result = await assertSafeToFetch('https://rebind.example/', {
      lookup: async () => [{ address: '127.0.0.1', family: 4 }],
    });
    assert.equal(result, false);
  });

  it('rejects mixed public and private DNS records', async () => {
    const result = await assertSafeToFetch('https://mixed.example/', {
      lookup: async () => [
        { address: '8.8.8.8', family: 4 },
        { address: '10.0.0.1', family: 4 },
      ],
    });
    assert.equal(result, false);
  });

  it('allows a hostname that resolves only to public addresses', async () => {
    const result = await assertSafeToFetch('https://ok.example/', {
      lookup: async () => [{ address: '8.8.8.8', family: 4 }],
    });
    assert.equal(result, true);
  });

  it('returns dns_failed when lookup throws', async () => {
    const result = await assertSafeToFetch('https://nx.example/', {
      lookup: async () => {
        throw new Error('ENOTFOUND');
      },
    });
    assert.equal(result, 'dns_failed');
  });
});

function jsonHeaders(headers) {
  return {
    get(name) {
      const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
      return key ? headers[key] : null;
    },
  };
}

describe('probeUrl', () => {
  it('does not fetch blocked literals', async () => {
    let calls = 0;
    const result = await probeUrl('http://127.0.0.1/', {
      fetch: async () => {
        calls += 1;
        throw new Error('should not fetch');
      },
    });
    assert.equal(result.skipped, true);
    assert.equal(calls, 0);
  });

  it('does not follow a redirect onto a private address', async () => {
    const urls = [];
    const result = await probeUrl('https://ok.example/start', {
      lookup: async () => [{ address: '8.8.8.8', family: 4 }],
      fetch: async (url) => {
        urls.push(url);
        return {
          status: 302,
          headers: jsonHeaders({ location: 'http://127.0.0.1/secret' }),
          body: { cancel: async () => {} },
        };
      },
    });
    assert.equal(result.skipped, true);
    assert.deepEqual(urls, ['https://ok.example/start']);
  });

  it('follows a safe redirect and reports the final public status', async () => {
    const urls = [];
    const result = await probeUrl('https://ok.example/start', {
      lookup: async () => [{ address: '8.8.8.8', family: 4 }],
      fetch: async (url) => {
        urls.push(url);
        if (url.endsWith('/start')) {
          return {
            status: 301,
            headers: jsonHeaders({ location: 'https://ok.example/end' }),
            body: { cancel: async () => {} },
          };
        }
        return {
          status: 200,
          headers: jsonHeaders({}),
          body: { cancel: async () => {} },
        };
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.statusCode, 200);
    assert.deepEqual(urls, ['https://ok.example/start', 'https://ok.example/end']);
  });

  it('stops after three redirects without treating the chain as a broken link', async () => {
    let calls = 0;
    const result = await probeUrl('https://ok.example/r0', {
      lookup: async () => [{ address: '8.8.8.8', family: 4 }],
      fetch: async (url) => {
        calls += 1;
        const n = Number(url.slice(-1));
        return {
          status: 302,
          headers: jsonHeaders({ location: `https://ok.example/r${n + 1}` }),
          body: { cancel: async () => {} },
        };
      },
    });
    assert.equal(result.ok, true);
    assert.equal(calls, 4);
  });

  it('retries with GET when HEAD is not allowed, without following redirects automatically', async () => {
    const methods = [];
    const result = await probeUrl('https://ok.example/file', {
      lookup: async () => [{ address: '1.1.1.1', family: 4 }],
      fetch: async (_url, opts) => {
        methods.push(opts.method);
        assert.equal(opts.redirect, 'manual');
        if (opts.method === 'HEAD') {
          return {
            status: 405,
            headers: jsonHeaders({}),
            body: { cancel: async () => {} },
          };
        }
        return {
          status: 404,
          headers: jsonHeaders({}),
          body: { cancel: async () => {} },
        };
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.statusCode, 404);
    assert.deepEqual(methods, ['HEAD', 'GET']);
  });
});
