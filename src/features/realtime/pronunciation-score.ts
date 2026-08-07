export type PronunciationScore = {
  score: number;
  matchedWords: string[];
  needsPractice: string[];
};

function words(value: string) {
  return value.toLowerCase().match(/[a-z']+/g) ?? [];
}

export function scorePronunciation(target: string, transcript: string): PronunciationScore {
  const expected = words(target);
  const actual = words(transcript);
  const rows = expected.length + 1;
  const columns = actual.length + 1;
  const distance = Array.from({ length: rows }, () => Array<number>(columns).fill(0));
  for (let row = 0; row < rows; row += 1) distance[row][0] = row;
  for (let column = 0; column < columns; column += 1) distance[0][column] = column;
  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      distance[row][column] = Math.min(
        distance[row - 1][column] + 1,
        distance[row][column - 1] + 1,
        distance[row - 1][column - 1] + (expected[row - 1] === actual[column - 1] ? 0 : 1),
      );
    }
  }
  const actualSet = new Set(actual);
  const matchedWords = expected.filter((word) => actualSet.has(word));
  const needsPractice = expected.filter((word) => !actualSet.has(word));
  const score = expected.length
    ? Math.max(0, Math.round((1 - distance[expected.length][actual.length] / expected.length) * 100))
    : 0;
  return { score, matchedWords: [...new Set(matchedWords)], needsPractice: [...new Set(needsPractice)] };
}
