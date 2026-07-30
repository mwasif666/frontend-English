import test from 'node:test';
import assert from 'node:assert/strict';
import { createRealtimeUrl } from '../services/realtime.js';

test('realtime URL uses secure WebSocket and keeps the API prefix', () => {
  assert.equal(
    createRealtimeUrl(),
    'wss://english-tutorial-1ejj.vercel.app/api/realtime',
  );
});
