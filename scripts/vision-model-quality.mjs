export function scoreVisionModelRuns({ samples, runs }) {
  const sampleById = new Map(samples.map((sample) => [sample.id, sample]));
  const modelScores = new Map();

  for (const run of runs) {
    const sample = sampleById.get(run.sampleId);
    if (!sample) continue;
    const current = modelScores.get(run.model) ?? { model: run.model, totalScore: 0, possibleScore: 0, matchedCandidates: 0, sampleCount: 0 };
    current.sampleCount += 1;
    const score = scoreSample(sample.expected, run.candidates ?? []);
    current.totalScore += score.totalScore;
    current.possibleScore += score.possibleScore;
    current.matchedCandidates += score.matchedCandidates;
    modelScores.set(run.model, current);
  }

  const models = Array.from(modelScores.values()).sort((a, b) => b.totalScore - a.totalScore || a.model.localeCompare(b.model));
  const winner = models.length > 1 && models[0].totalScore > models[1].totalScore ? models[0].model : null;
  return { models, winner };
}

function scoreSample(expectedCandidates, actualCandidates) {
  let totalScore = 0;
  let possibleScore = 0;
  let matchedCandidates = 0;
  const unused = [...actualCandidates];

  for (const expected of expectedCandidates) {
    possibleScore += possibleCandidateScore(expected);
    const best = findBestCandidate(expected, unused);
    if (!best) continue;
    totalScore += best.score;
    matchedCandidates += best.score > 0 ? 1 : 0;
    unused.splice(best.index, 1);
  }

  return { totalScore, possibleScore, matchedCandidates };
}

function findBestCandidate(expected, actualCandidates) {
  return actualCandidates
    .map((actual, index) => ({ index, score: scoreCandidate(expected, actual) }))
    .sort((a, b) => b.score - a.score)[0] ?? null;
}

function scoreCandidate(expected, actual) {
  let score = 0;
  if (actual.type === expected.type) score += 1;
  if (normalize(actual.title).includes(normalize(expected.title))) score += 1;
  if (expected.scheduled_at !== undefined && sameInstantMinute(actual.scheduled_at, expected.scheduled_at)) score += 1;
  if (expected.dose !== undefined && normalizeNullable(actual.dose) === normalizeNullable(expected.dose)) score += 1;
  if (expected.unit !== undefined && normalizeNullable(actual.unit) === normalizeNullable(expected.unit)) score += 1;
  return score;
}

function possibleCandidateScore(expected) {
  return 2 + Number(expected.scheduled_at !== undefined) + Number(expected.dose !== undefined) + Number(expected.unit !== undefined);
}

function normalize(value) {
  return String(value ?? '').replace(/\s+/gu, '').toLowerCase();
}

function normalizeNullable(value) {
  const normalized = normalize(value);
  return normalized || null;
}

function sameInstantMinute(a, b) {
  if (a === null || b === null) return a === b;
  if (!a || !b) return false;
  const left = new Date(a).getTime();
  const right = new Date(b).getTime();
  if (Number.isNaN(left) || Number.isNaN(right)) return false;
  return Math.abs(left - right) < 60_000;
}
