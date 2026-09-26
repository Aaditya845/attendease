const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('attendease_token');
}

function setSession(token, name) {
  localStorage.setItem('attendease_token', token);
  localStorage.setItem('attendease_name', name || '');
}

function clearSession() {
  localStorage.removeItem('attendease_token');
  localStorage.removeItem('attendease_name');
}

async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }
  return data;
}

function requireLoginOrRedirect() {
  if (!getToken()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}
