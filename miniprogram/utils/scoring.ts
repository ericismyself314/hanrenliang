import { CONTENT_VERSION } from '../config/content'
import {
  DIMENSION_CODES,
  MAX_RAW_PER_DIMENSION,
  DimensionCode,
  TIE_BREAK_ORDER,
  TIE_BREAK_QUESTION_START_INDEX,
} from '../config/dimensions'
import { QUESTIONS, TOTAL_QUESTIONS } from '../config/questions'
import { BANDS, BandIndex, resultIdOf } from '../config/results'
import { DimensionScores, ScoreOutput, emptyDimensionScores } from './types'

/**
 * 综合含人量所在档位。
 * 0 → 0-24，1 → 25-49，2 → 50-74，3 → 75-100
 */
export function bandOf(humanScore: number): BandIndex {
  if (humanScore <= 24) return 0
  if (humanScore <= 49) return 1
  if (humanScore <= 74) return 2
  return 3
}

/** 原始分转标准分：四舍五入(原始分 ÷ 24 × 100) */
export function standardize(raw: number): number {
  return Math.round((raw / MAX_RAW_PER_DIMENSION) * 100)
}

/** 逐题校验并归一化答案：支持按题序传入的 optionId 数组 */
function normalizeAnswers(answerIds: string[]): string[] {
  if (!Array.isArray(answerIds) || answerIds.length !== TOTAL_QUESTIONS) {
    throw new Error(`答案数量不正确，需要 ${TOTAL_QUESTIONS} 个`)
  }
  return QUESTIONS.map((question, i) => {
    const optionId = answerIds[i]
    const option = question.options.find((o) => o.id === optionId)
    if (!option) {
      throw new Error(`第 ${question.index} 题的答案无效：${String(optionId)}`)
    }
    return option.id
  })
}

/**
 * 纯函数计分：输入 24 个答案（按题序的 optionId 数组），稳定输出六维分数、含人量、档位、关键维度和结果 ID。
 * 不读取全局状态、不产生副作用，同一组答案在任何设备上结果完全相同。
 */
export function scoreAnswers(answerIds: string[]): ScoreOutput {
  const normalized = normalizeAnswers(answerIds)

  const raw = emptyDimensionScores()
  const zeroCount = emptyDimensionScores()
  const threeCount = emptyDimensionScores()
  const lateScores = emptyDimensionScores()

  normalized.forEach((optionId, questionIndex) => {
    const option = QUESTIONS[questionIndex].options.find((o) => o.id === optionId)!
    DIMENSION_CODES.forEach((dim) => {
      const value = option.scores[dim]
      if (value === undefined) return
      raw[dim] += value
      if (value === 0) zeroCount[dim] += 1
      if (value === 3) threeCount[dim] += 1
      if (questionIndex >= TIE_BREAK_QUESTION_START_INDEX) lateScores[dim] += value
    })
  })

  const dimensionScores = emptyDimensionScores()
  DIMENSION_CODES.forEach((dim) => {
    dimensionScores[dim] = standardize(raw[dim])
  })

  const sum = DIMENSION_CODES.reduce((acc, dim) => acc + dimensionScores[dim], 0)
  const humanScore = Math.round(sum / DIMENSION_CODES.length)
  const band = bandOf(humanScore)
  const pickLowest = BANDS[band].pick === 'lowest'
  const keyDimension = pickKeyDimension(dimensionScores, zeroCount, threeCount, lateScores, pickLowest)

  return {
    contentVersion: CONTENT_VERSION,
    raw,
    dimensionScores,
    humanScore,
    band,
    keyDimension,
    resultId: resultIdOf(band, keyDimension),
    debug: { zeroCount, threeCount, lateScores },
  }
}

/**
 * 选择关键维度。
 * 1. 低于 50 分选最低维度，50 分及以上选最高维度
 * 2. 并列时，低分档优先选 0 分次数更多的，高分档优先选 3 分次数更多的
 * 3. 仍并列时比较第 19-24 题得分，低分档取更低者，高分档取更高者
 * 4. 仍并列时按 A、F、S、E、P、R 固定顺序
 */
export function pickKeyDimension(
  dimensionScores: DimensionScores,
  zeroCount: DimensionScores,
  threeCount: DimensionScores,
  lateScores: DimensionScores,
  pickLowest: boolean,
): DimensionCode {
  const values = DIMENSION_CODES.map((d) => dimensionScores[d])
  const target = pickLowest ? Math.min(...values) : Math.max(...values)
  let candidates = DIMENSION_CODES.filter((d) => dimensionScores[d] === target)
  if (candidates.length === 1) return candidates[0]

  const countKey = pickLowest ? zeroCount : threeCount
  const countValues = candidates.map((d) => countKey[d])
  const bestCount = pickLowest ? Math.max(...countValues) : Math.max(...countValues)
  candidates = candidates.filter((d) => countKey[d] === bestCount)
  if (candidates.length === 1) return candidates[0]

  const lateValues = candidates.map((d) => lateScores[d])
  const bestLate = pickLowest ? Math.min(...lateValues) : Math.max(...lateValues)
  candidates = candidates.filter((d) => lateScores[d] === bestLate)
  if (candidates.length === 1) return candidates[0]

  for (const dim of TIE_BREAK_ORDER) {
    if (candidates.indexOf(dim) >= 0) return dim
  }
  return candidates[0]
}

/** 从答案映射 { [questionId]: optionId } 计分 */
export function scoreAnswerMap(answerMap: Record<string, string>): ScoreOutput {
  return scoreAnswers(QUESTIONS.map((q) => answerMap[q.id]))
}
