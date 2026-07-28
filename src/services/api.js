const API_URL = import.meta.env.VITE_API_URL || 'https://english-tutorial-1ejj.vercel.app/api';

const getGuestId = () => {
  const storageKey = 'speakflow_guest_id';
  let guestId = localStorage.getItem(storageKey);
  if (guestId) return guestId;

  guestId = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID().replaceAll('-', '_')
    : `guest_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
  localStorage.setItem(storageKey, guestId);
  return guestId;
};

const request = async (path, options = {}) => {
  const token = localStorage.getItem('speakflow_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Guest-ID': getGuestId(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }
  return data;
};

export const tutorApi = {
  respond: (payload) => request('/tutor/respond', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getProgress: () => request('/tutor/progress'),
  getSessions: () => request('/tutor/sessions'),
  getSession: (sessionId) => request(`/tutor/sessions/${sessionId}`),
  deleteSession: (sessionId) => request(`/tutor/sessions/${sessionId}`, { method: 'DELETE' }),
  claimSessions: () => request('/tutor/sessions/claim', { method: 'POST' }),
};

export const authApi = {
  register: (payload) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  login: (payload) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  me: () => request('/auth/me'),
};
