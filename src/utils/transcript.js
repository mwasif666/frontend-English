const cleanTranscript = (value = '') => value.trim().replace(/\s+/g, ' ');

export const mergeTranscripts = (previousValue = '', incomingValue = '') => {
  const previous = cleanTranscript(previousValue);
  const incoming = cleanTranscript(incomingValue);

  if (!previous) return incoming;
  if (!incoming) return previous;

  const previousLower = previous.toLowerCase();
  const incomingLower = incoming.toLowerCase();

  if (previousLower === incomingLower || previousLower.endsWith(incomingLower)) return previous;
  if (incomingLower.startsWith(previousLower)) return incoming;

  const previousWords = previous.split(' ');
  const incomingWords = incoming.split(' ');
  const maxOverlap = Math.min(previousWords.length, incomingWords.length);

  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    const previousTail = previousWords.slice(-overlap).join(' ').toLowerCase();
    const incomingHead = incomingWords.slice(0, overlap).join(' ').toLowerCase();
    if (previousTail === incomingHead) {
      return [...previousWords, ...incomingWords.slice(overlap)].join(' ');
    }
  }

  return `${previous} ${incoming}`;
};

