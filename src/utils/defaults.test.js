import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_TOPICS } from '../data/defaults.js';

test('every default practice question has simple Roman Urdu and Urdu script', () => {
  const formalWords = /\b(?:durust|wazeh|aaghaz|foran|guftagu|shakhs|tafseel|koshish)\b/i;

  for (const topic of DEFAULT_TOPICS) {
    assert.equal(topic.questions.length, topic.questionMeanings.length, topic.id);
    assert.equal(topic.questions.length, topic.questionUrduMeanings.length, topic.id);
    assert.ok(topic.questionMeanings.every((meaning) => meaning && !formalWords.test(meaning)), topic.id);
    assert.ok(topic.questionUrduMeanings.every((meaning) => /[\u0600-\u06ff]/u.test(meaning)), topic.id);
  }
});
