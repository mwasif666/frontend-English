import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRecognitionTranscript,
  collapseAccidentalRepetitions,
  mergeTranscripts,
} from './transcript.js';

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

test('deduplicates final and interim chunks inside one browser event', () => {
  const results = [
    [{ transcript: 'I want to improve my English' }],
    [{ transcript: 'I want to improve my English for interviews' }],
  ];

  assert.equal(
    buildRecognitionTranscript(results),
    'I want to improve my English for interviews',
  );
});

test('collapses a phrase replayed multiple times by recognition', () => {
  assert.equal(
    collapseAccidentalRepetitions('my name is my name is my name is Wasif'),
    'my name is Wasif',
  );
});

test('collapses three accidental copies of one word but preserves a natural double', () => {
  assert.equal(collapseAccidentalRepetitions('I I I work here'), 'I work here');
  assert.equal(collapseAccidentalRepetitions('It is very very good'), 'It is very very good');
});
