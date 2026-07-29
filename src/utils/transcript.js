const cleanTranscript = (value = '') => value.trim().replace(/\s+/g, ' ');
const wordKey = (value = '') => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}']/gu, '');

export const collapseAccidentalRepetitions = (value = '') => {
  const words = cleanTranscript(value).split(' ').filter(Boolean);
  if (words.length < 2) return words.join(' ');

  const sameBlock = (firstStart, secondStart, size) => {
    for (let offset = 0; offset < size; offset += 1) {
      if (wordKey(words[firstStart + offset]) !== wordKey(words[secondStart + offset])) return false;
    }
    return true;
  };

  for (let blockSize = Math.floor(words.length / 2); blockSize >= 2; blockSize -= 1) {
    let index = 0;
    while (index + (blockSize * 2) <= words.length) {
      if (sameBlock(index, index + blockSize, blockSize)) {
        words.splice(index + blockSize, blockSize);
      } else {
        index += 1;
      }
    }
  }

  let index = 0;
  while (index < words.length) {
    let runEnd = index + 1;
    while (runEnd < words.length && wordKey(words[runEnd]) === wordKey(words[index])) runEnd += 1;
    if (runEnd - index >= 3) words.splice(index + 1, runEnd - index - 1);
    index += 1;
  }

  return words.join(' ');
};

export const mergeTranscripts = (previousValue = '', incomingValue = '') => {
  const previous = cleanTranscript(previousValue);
  const incoming = cleanTranscript(incomingValue);

  if (!previous) return incoming;
  if (!incoming) return previous;

  const previousWords = previous.split(' ');
  const incomingWords = incoming.split(' ');
  const previousKeys = previousWords.map(wordKey);
  const incomingKeys = incomingWords.map(wordKey);
  const maxOverlap = Math.min(previousWords.length, incomingWords.length);

  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    const previousTail = previousKeys.slice(-overlap).join(' ');
    const incomingHead = incomingKeys.slice(0, overlap).join(' ');
    if (previousTail && previousTail === incomingHead) {
      return collapseAccidentalRepetitions(
        [...previousWords, ...incomingWords.slice(overlap)].join(' '),
      );
    }
  }

  return collapseAccidentalRepetitions(`${previous} ${incoming}`);
};

export const buildRecognitionTranscript = (results = []) => (
  Array.from(results).reduce(
    (transcript, result) => mergeTranscripts(transcript, result?.[0]?.transcript || ''),
    '',
  )
);
