/**
 * 双人关系计算（Node 版）。
 * 与 miniprogram/utils/matching.ts + config/relationships.ts 完全同源，
 * 由 tests/cloudMatching.test.ts 对比校验，任何一侧改动都必须同步修改另一侧。
 */

const DIMS = ['R', 'S', 'P', 'E', 'F', 'A']
const SCORE_MIN = 35
const SCORE_MAX = 96
const SIMILARITY_WEIGHT = 0.6
const COMPLEMENT_WEIGHT = 0.4

const RULES = [
  {
    id: 'rehab-duo',
    condition: { kind: 'splitScore', highAtLeast: 70, lowBelow: 45 },
  },
  {
    id: 'both-offline',
    condition: { kind: 'bothBelow', score: 45 },
  },
  {
    id: 'accident-crew',
    condition: { kind: 'bothAtLeast', dims: ['P', 'E'], score: 65 },
  },
  {
    id: 'online-close-offline-gone',
    condition: { kind: 'bothBelowAndBothAtLeast', belowDim: 'S', belowScore: 35, atLeastDim: 'F', atLeastScore: 45 },
  },
  {
    id: 'golden-meal-duo',
    condition: { kind: 'bothAtLeastWithDiffAtMost', atLeastDim: 'R', atLeastScore: 55, diffDim: 'S', maxDiff: 20 },
  },
  {
    id: 'propose-and-ignore',
    condition: { kind: 'diffAtLeast', dim: 'S', diff: 40 },
  },
  {
    id: 'silent-not-awkward',
    condition: { kind: 'bothAtLeastAndBothBelow', atLeastDim: 'F', atLeastScore: 55, belowDim: 'S', belowScore: 55 },
  },
  {
    id: 'random-event-crew',
    condition: { kind: 'bothAtLeast', dims: ['P'], score: 75 },
  },
  {
    id: 'planner-and-drifter',
    condition: { kind: 'diffAtLeastAndBothAtLeast', diffDim: 'P', diff: 40, atLeastDim: 'A', atLeastScore: 50 },
  },
  {
    id: 'ground-action-duo',
    condition: { kind: 'bothAtLeast', dims: ['R'], score: 70 },
  },
  {
    id: 'same-frequency',
    condition: { kind: 'avgDiffAtMost', maxAvgDiff: 15 },
  },
  {
    id: 'complement-duo',
    condition: { kind: 'complementOverSimilarity' },
  },
]

function averageAbsDiff(a, b) {
  const total = DIMS.reduce((acc, d) => acc + Math.abs(a[d] - b[d]), 0)
  return total / DIMS.length
}

function calcSimilarity(a, b) {
  return 100 - averageAbsDiff(a, b)
}

function calcComplement(a, b) {
  const total = DIMS.reduce((acc, d) => acc + Math.abs(a[d] + b[d] - 100), 0)
  return 100 - total / DIMS.length
}

function calcFriendScore(a, b) {
  const raw = calcSimilarity(a, b) * SIMILARITY_WEIGHT + calcComplement(a, b) * COMPLEMENT_WEIGHT
  const rounded = Math.round(raw)
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, rounded))
}

function bothAtLeast(a, b, dims, score) {
  return dims.every((d) => a[d] >= score && b[d] >= score)
}

function bothBelow(a, b, dims, score) {
  return dims.every((d) => a[d] < score && b[d] < score)
}

function evaluateCondition(condition, a, b, similarity, complement) {
  const da = a.dimensionScores
  const db = b.dimensionScores
  switch (condition.kind) {
    case 'splitScore':
      return (
        (a.humanScore >= condition.highAtLeast && b.humanScore < condition.lowBelow) ||
        (b.humanScore >= condition.highAtLeast && a.humanScore < condition.lowBelow)
      )
    case 'bothBelow':
      return a.humanScore < condition.score && b.humanScore < condition.score
    case 'bothAtLeast':
      return bothAtLeast(da, db, condition.dims, condition.score)
    case 'bothBelowAndBothAtLeast':
      return (
        bothBelow(da, db, [condition.belowDim], condition.belowScore) &&
        bothAtLeast(da, db, [condition.atLeastDim], condition.atLeastScore)
      )
    case 'bothAtLeastWithDiffAtMost':
      return (
        bothAtLeast(da, db, [condition.atLeastDim], condition.atLeastScore) &&
        Math.abs(da[condition.diffDim] - db[condition.diffDim]) <= condition.maxDiff
      )
    case 'diffAtLeast':
      return Math.abs(da[condition.dim] - db[condition.dim]) >= condition.diff
    case 'bothAtLeastAndBothBelow':
      return (
        bothAtLeast(da, db, [condition.atLeastDim], condition.atLeastScore) &&
        bothBelow(da, db, [condition.belowDim], condition.belowScore)
      )
    case 'diffAtLeastAndBothAtLeast':
      return (
        Math.abs(da[condition.diffDim] - db[condition.diffDim]) >= condition.diff &&
        bothAtLeast(da, db, [condition.atLeastDim], condition.atLeastScore)
      )
    case 'avgDiffAtMost':
      return averageAbsDiff(da, db) <= condition.maxAvgDiff
    case 'complementOverSimilarity':
      return complement > similarity
    default:
      return false
  }
}

function pickRelationship(a, b) {
  const similarity = calcSimilarity(a.dimensionScores, b.dimensionScores)
  const complement = calcComplement(a.dimensionScores, b.dimensionScores)
  for (const rule of RULES) {
    if (evaluateCondition(rule.condition, a, b, similarity, complement)) {
      return { ruleId: rule.id, similarity, complement }
    }
  }
  return {
    ruleId: similarity >= complement ? 'same-frequency' : 'complement-duo',
    similarity,
    complement,
  }
}

module.exports = {
  DIMS,
  averageAbsDiff,
  calcSimilarity,
  calcComplement,
  calcFriendScore,
  pickRelationship,
}
