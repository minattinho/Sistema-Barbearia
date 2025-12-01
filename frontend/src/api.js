const envBase = import.meta.env.VITE_API_URL;
const fallbackBase = import.meta.env.DEV ? '' : (typeof window !== 'undefined' ? window.location.origin : '');
const API_BASE = (envBase || fallbackBase || '').replace(/\/$/, '');

const buildUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath;
};

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = Object.assign({}, options.headers || {});
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(buildUrl(path), Object.assign({}, options, { headers }));
  const text = await res.text();
  let data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || res.statusText || 'Request failed');
    err.status = res.status;
    err.data = data;
    if (data?.error) err.error = data.error;
    if (data?.details) err.details = data.details;
    throw err;
  }
  return data;
}

export const api = {
  get: (path, opts) => request(path, Object.assign({ method: 'GET' }, opts)),
  post: (path, body, opts) => request(path, Object.assign({ method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }, opts)),
  put: (path, body, opts) => request(path, Object.assign({ method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }, opts)),
  patch: (path, body, opts) => request(path, Object.assign({ method: 'PATCH', body: body instanceof FormData ? body : JSON.stringify(body) }, opts)),
  del: (path, opts) => request(path, Object.assign({ method: 'DELETE' }, opts)),
};

export default api;
