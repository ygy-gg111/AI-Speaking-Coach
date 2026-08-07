export type PronunciationScore = {
  score: number;
  accuracy: number;
  completeness: number;
  fluency: number;
  prosody: number;
  transcript: string;
  matchedWords: string[];
  needsPractice: string[];
};

export type PronunciationSignals = {
  durationMs?: number;
  pauseRatio?: number;
  energyVariation?: number;
};

function words(value: string) {
  return value.toLowerCase().match(/[a-z']+/g) ?? [];
}

export function scorePronunciation(
  target: string,
  transcript: string,
  signals: PronunciationSignals = {},
): PronunciationScore {
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
  const accuracy = expected.length
    ? Math.max(0, Math.round((1 - distance[expected.length][actual.length] / expected.length) * 100))
    : 0;
  const completeness = expected.length
    ? Math.round((matchedWords.length / expected.length) * 100)
    : 0;
  const durationMinutes = Math.max(1 / 60, (signals.durationMs ?? 0) / 60_000);
  const wordsPerMinute = actual.length / durationMinutes;
  const paceScore = signals.durationMs
    ? Math.max(0, 100 - Math.round(Math.abs(wordsPerMinute - 125) * 0.8))
    : accuracy;
  const pauseScore = signals.pauseRatio === undefined
    ? accuracy
    : Math.max(0, Math.round(100 - Math.abs(signals.pauseRatio - 0.18) * 180));
  const fluency = Math.round(paceScore * 0.6 + pauseScore * 0.4);
  const prosody = signals.energyVariation === undefined
    ? accuracy
    : Math.max(0, Math.min(100, Math.round(45 + signals.energyVariation * 220)));
  const score = Math.round(
    accuracy * 0.45 + completeness * 0.2 + fluency * 0.25 + prosody * 0.1,
  );
  return {
    score,
    accuracy,
    completeness,
    fluency,
    prosody,
    transcript,
    matchedWords: [...new Set(matchedWords)],
    needsPractice: [...new Set(needsPractice)],
  };
}
