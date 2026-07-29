import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeTranscripts } from './transcript.js';

test('does not append an identical browser replay', () => {
  assert.equal(
    mergeTranscripts('I want to improve my English', 'I want to improve my English'),
    'I want to improve my English',
  );
});

test('merges a replayed tail with genuinely new words', () => {
  assert.equal(
    mergeTranscripts('I want to improve my English', 'my English for interviews'),
    'I want to improve my English for interviews',
  );
});

test('keeps unrelated new speech', () => {
  assert.equal(
    mergeTranscripts('My name is Wasif', 'I work as a developer'),
    'My name is Wasif I work as a developer',
  );
});

