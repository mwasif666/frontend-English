import { API_URL } from './api.js';

export const createRealtimeUrl = () => {
  const url = new URL(API_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/realtime`;
  url.search = '';
  return url.toString();
};

const newRequestId = () => (
  globalThis.crypto?.randomUUID?.() || `request_${Date.now()}_${Math.random().toString(36).slice(2)}`
);

class RealtimeClient {
  constructor() {
    this.socket = null;
    this.token = '';
    this.status = 'offline';
    this.pending = new Map();
    this.statusListeners = new Set();
    this.eventListeners = new Set();
    this.reconnectTimer = null;
    this.reconnectAttempt = 0;
    this.intentionalClose = false;
  }

  setStatus(status) {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  subscribeStatus(listener) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  subscribeEvents(listener) {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  connect(token) {
    if (!token) {
      this.disconnect();
      return;
    }
    if (this.token === token && ['connecting', 'authenticating', 'ready'].includes(this.status)) return;
    this.disconnect();
    this.token = token;
    this.intentionalClose = false;
    this.open();
  }

  open() {
    if (!this.token || typeof WebSocket === 'undefined') {
      this.setStatus('offline');
      return;
    }
    window.clearTimeout(this.reconnectTimer);
    this.setStatus('connecting');
    const socket = new WebSocket(createRealtimeUrl());
    this.socket = socket;

    socket.addEventListener('open', () => {
      this.setStatus('authenticating');
      socket.send(JSON.stringify({ type: 'auth', payload: { token: this.token } }));
    });

    socket.addEventListener('message', (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message.type === 'auth:ready') {
        this.reconnectAttempt = 0;
        this.setStatus('ready');
        return;
      }
      if (message.type === 'auth:error') {
        this.intentionalClose = true;
        this.token = '';
        this.setStatus('error');
        socket.close(4401, 'Authentication failed');
        return;
      }
      if (message.type === 'sync:event') {
        this.eventListeners.forEach((listener) => listener(message.payload));
        return;
      }
      const pending = this.pending.get(message.requestId);
      if (!pending) return;
      pending.onEvent?.(message);
      if (['dictionary:suggestions', 'dictionary:lookup:result', 'chat:result'].includes(message.type)) {
        pending.result = message.payload;
      }
      if (message.type === 'request:error') {
        window.clearTimeout(pending.timer);
        this.pending.delete(message.requestId);
        pending.reject(new Error(message.payload?.message || 'Realtime request failed.'));
      } else if (message.type === 'request:complete') {
        window.clearTimeout(pending.timer);
        this.pending.delete(message.requestId);
        pending.resolve(pending.result ?? message.payload);
      }
    });

    socket.addEventListener('close', () => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.rejectPending(new Error('Realtime connection closed.'));
      if (this.intentionalClose || !this.token) {
        this.setStatus('offline');
        return;
      }
      this.setStatus('reconnecting');
      const delay = Math.min(1000 * (2 ** this.reconnectAttempt), 15000);
      this.reconnectAttempt += 1;
      this.reconnectTimer = window.setTimeout(() => this.open(), delay);
    });

    socket.addEventListener('error', () => {
      this.setStatus('error');
    });
  }

  disconnect() {
    this.intentionalClose = true;
    this.token = '';
    window.clearTimeout(this.reconnectTimer);
    this.rejectPending(new Error('Realtime connection unavailable.'));
    this.socket?.close(1000, 'Client disconnected');
    this.socket = null;
    this.setStatus('offline');
  }

  rejectPending(error) {
    this.pending.forEach((pending) => {
      window.clearTimeout(pending.timer);
      pending.reject(error);
    });
    this.pending.clear();
  }

  request(type, payload, { onEvent, timeout = 45000 } = {}) {
    if (this.status !== 'ready' || this.socket?.readyState !== WebSocket.OPEN) {
      return {
        requestId: null,
        promise: null,
        cancel: () => {},
      };
    }
    const requestId = newRequestId();
    let cancel;
    const promise = new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pending.delete(requestId);
        this.socket?.send(JSON.stringify({ type: 'request:cancel', requestId }));
        reject(new Error('Realtime request timed out.'));
      }, timeout);
      this.pending.set(requestId, { resolve, reject, onEvent, timer, result: null });
      cancel = () => {
        const pending = this.pending.get(requestId);
        if (!pending) return;
        window.clearTimeout(pending.timer);
        this.pending.delete(requestId);
        this.socket?.send(JSON.stringify({ type: 'request:cancel', requestId }));
        reject(new DOMException('Realtime request cancelled.', 'AbortError'));
      };
      try {
        this.socket.send(JSON.stringify({ type, requestId, payload }));
      } catch (error) {
        window.clearTimeout(timer);
        this.pending.delete(requestId);
        reject(error);
      }
    });
    return { requestId, promise, cancel };
  }
}

export const realtimeClient = new RealtimeClient();
