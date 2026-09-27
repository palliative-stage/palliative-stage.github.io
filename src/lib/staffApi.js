export async function staffFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body != null && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers,
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  return { ok: res.ok, status: res.status, data };
}

export function staffDestination(user) {
  if (!user) return '/login';
  if (user.mustChangePassword) return '/account/password';
  if (user.role === 'admin' || user.role === 'super_admin') return '/admin/analytics';
  return '/';
}
