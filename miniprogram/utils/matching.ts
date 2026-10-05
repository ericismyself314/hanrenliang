import { DIMENSION_CODES, DimensionCode } from '../config/dimensions'
import {
  COMPLEMENT_WEIGHT,
  RELATIONSHIP_RULES,
  RelationshipCondition,
  RelationshipRule,
  SCORE_MAX,
  SCORE_MIN,
  SHARED_GAP_TEXT,
  SHARED_STRENGTH_TEXT,
  SIMILARITY_WEIGHT,
} from '../config/relationships'
import { DimensionScores } from './types'

export interface RelationInput {
  humanScore: number
  dimensionScores: DimensionScores
}

/** 六维绝对差的平均值 */
export function averageAbsDiff(a: DimensionScores, b: DimensionScores): number {
  const total = DIMENSION_CODES.reduce((acc, d) => acc + Math.abs(a[d] - b[d]), 0)
  return total / DIMENSION_CODES.length
}

/** 相似度 = 100 − 六个维度绝对差的平均值 */
export function calcSimilarity(a: DimensionScores, b: DimensionScores): number {
  return 100 - averageAbsDiff(a, b)
}

/** 互补度 = 100 − 六个维度两人得分之和与 100 之间差值的平均值 */
export function calcComplement(a: DimensionScores, b: DimensionScores): number {
  const total = DIMENSION_CODES.reduce((acc, d) => acc + Math.abs(a[d] + b[d] - 100), 0)
  return 100 - total / DIMENSION_CODES.length
}

/** 好友玩法分，限制在 35 至 96 之间，仅用于娱乐展示 */
export function calcFriendScore(a: DimensionScores, b: DimensionScores): number {
  const raw = calcSimilarity(a, b) * SIMILARITY_WEIGHT + calcComplement(a, b) * COMPLEMENT_WEIGHT
  const rounded = Math.round(raw)
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, rounded))
}

function both(predicate: (value: number) => boolean, a: DimensionScores, b: DimensionScores, dims: DimensionCode[]): boolean {
  return dims.every((d) => predicate(a[d]) && predicate(b[d]))
}

export function evaluateCondition(
  condition: RelationshipCondition,
  a: RelationInput,
  b: RelationInput,
  similarity: number,
  complement: number,
): boolean {
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
      return both((v) => v >= condition.score, da, db, condition.dims)
    case 'bothBelowAndBothAtLeast':
      return (
        both((v) => v < condition.belowScore, da, db, [condition.belowDim]) &&
        both((v) => v >= condition.atLeastScore, da, db, [condition.atLeastDim])
      )
    case 'bothAtLeastWithDiffAtMost':
      return (
        both((v) => v >= condition.atLeastScore, da, db, [condition.atLeastDim]) &&
        Math.abs(da[condition.diffDim] - db[condition.diffDim]) <= condition.maxDiff
      )
    case 'diffAtLeast':
      return Math.abs(da[condition.dim] - db[condition.dim]) >= condition.diff
    case 'bothAtLeastAndBothBelow':
      return (
        both((v) => v >= condition.atLeastScore, da, db, [condition.atLeastDim]) &&
        both((v) => v < condition.belowScore, da, db, [condition.belowDim])
      )
    case 'diffAtLeastAndBothAtLeast':
      return (
        Math.abs(da[condition.diffDim] - db[condition.diffDim]) >= condition.diff &&
        both((v) => v >= condition.atLeastScore, da, db, [condition.atLeastDim])
      )
    case 'avgDiffAtMost':
      return averageAbsDiff(da, db) <= condition.maxAvgDiff
    case 'complementOverSimilarity':
      return complement > similarity
    default:
      return false
  }
}

/**
 * 按顺序命中第一条关系规则。
 * 内容规则未覆盖「平均差值 > 15 且互补分 ≤ 相似分」的情形，
 * 此处按语义最接近的方式兜底：相似度不低于互补度时归为同频生活体，否则归为互补生存搭子。
 */
export function pickRelationshipRule(a: RelationInput, b: RelationInput): {
  rule: RelationshipRule
  similarity: number
  complement: number
} {
  const similarity = calcSimilarity(a.dimensionScores, b.dimensionScores)
  const complement = calcComplement(a.dimensionScores, b.dimensionScores)

  for (const rule of RELATIONSHIP_RULES) {
    if (evaluateCondition(rule.condition, a, b, similarity, complement)) {
      return { rule, similarity, complement }
    }
  }

  const fallbackId = similarity >= complement ? 'same-frequency' : 'complement-duo'
  const rule = RELATIONSHIP_RULES.find((r) => r.id === fallbackId)!
  return { rule, similarity, complement }
}

function rankDims(a: DimensionScores, b: DimensionScores): DimensionCode[] {
  return [...DIMENSION_CODES].sort((x, y) => {
    const totalDiff = a[y] + b[y] - (a[x] + b[x])
    if (totalDiff !== 0) return totalDiff
    return DIMENSION_CODES.indexOf(x) - DIMENSION_CODES.indexOf(y)
  })
}

export interface RelationshipSummary {
  ruleId: string
  relationshipType: string
  verdict: string
  /** 好友玩法分，35-96 */
  compatibilityScore: number
  similarity: number
  complement: number
  sharedStrengths: string[]
  sharedGaps: string[]
}

/** 生成双人关系摘要，供关系页与双人海报使用 */
export function buildRelationship(a: RelationInput, b: RelationInput): RelationshipSummary {
  const { rule, similarity, complement } = pickRelationshipRule(a, b)
  const ranked = rankDims(a.dimensionScores, b.dimensionScores)

  const strongDims = ranked.filter((d) => Math.min(a.dimensionScores[d], b.dimensionScores[d]) >= 55)
  const weakDims = [...ranked].reverse().filter((d) => Math.max(a.dimensionScores[d], b.dimensionScores[d]) < 50)

  const strengths = (strongDims.length > 0 ? strongDims : ranked).slice(0, 2)
  const gaps = (weakDims.length > 0 ? weakDims : [...ranked].reverse()).slice(0, 2)

  return {
    ruleId: rule.id,
    relationshipType: rule.name,
    verdict: rule.verdict,
    compatibilityScore: calcFriendScore(a.dimensionScores, b.dimensionScores),
    similarity: Math.round(similarity),
    complement: Math.round(complement),
    sharedStrengths: strengths.map((d) => SHARED_STRENGTH_TEXT[d]),
    sharedGaps: gaps.map((d) => SHARED_GAP_TEXT[d]),
  }
}
