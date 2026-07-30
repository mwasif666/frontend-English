const API_URL = (import.meta.env.VITE_API_URL || 'https://english-tutorial-1ejj.vercel.app/api').replace(/\/+$/, '');

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
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-ID': getGuestId(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('The English tutor API is unreachable. Check the backend deployment and CORS settings.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `The tutor API returned ${response.status}.`);
  }
  return data;
};

const params = (values) => {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  });
  const result = query.toString();
  return result ? `?${result}` : '';
};

export const tutorApi = {
  respond: (payload) => request('/tutor/respond', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getProgress: () => request('/tutor/progress'),
  getDashboard: () => request('/tutor/dashboard'),
  getTopics: () => request('/tutor/suggestions/topics'),
  getWordSuggestions: ({ query, context, topic }) => request(
    `/tutor/suggestions/words${params({ q: query, context, topic })}`,
  ),
  generatePractice: (payload) => request('/tutor/suggestions/practice', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  checkWriting: (text) => request('/tutor/writing-check', {
    method: 'POST',
    body: JSON.stringify({ text }),
  }),
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

export const dictionaryApi = {
  lookup: (term) => request('/dictionary/lookup', {
    method: 'POST',
    body: JSON.stringify({ term }),
  }),
  getOverview: () => request('/dictionary/overview'),
  createProject: (name) => request('/dictionary/projects', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
  saveWord: (projectId, entry) => request('/dictionary/words', {
    method: 'POST',
    body: JSON.stringify({ projectId, entry }),
  }),
  getProjectWords: (projectId) => request(`/dictionary/projects/${projectId}/words`),
  deleteWord: (wordId) => request(`/dictionary/words/${wordId}`, { method: 'DELETE' }),
};
