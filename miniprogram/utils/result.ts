import { DIMENSIONS, DimensionCode } from '../config/dimensions'
import { getResult } from '../config/results'
import { ResultSnapshot, ScoreOutput, TestResult } from './types'

/** 由计分输出生成结果快照，用于写入邀请与关系记录，不含完整答题答案 */
export function buildSnapshot(score: ScoreOutput): ResultSnapshot {
  const def = getResult(score.resultId)
  return {
    contentVersion: score.contentVersion,
    dimensionScores: score.dimensionScores,
    humanScore: score.humanScore,
    band: score.band,
    keyDimension: score.keyDimension,
    resultId: score.resultId,
    title: def ? def.title : '',
  }
}

/** 由本地保存的测试结果生成快照，用于创建邀请 */
export function snapshotFromTestResult(result: TestResult): ResultSnapshot {
  const def = getResult(result.resultId)
  return {
    contentVersion: result.contentVersion,
    dimensionScores: result.dimensionScores,
    humanScore: result.humanScore,
    band: result.band,
    keyDimension: result.keyDimension,
    resultId: result.resultId,
    title: def ? def.title : '',
  }
}

/** 由计分输出生成本地保存的测试结果 */
export function buildTestResult(score: ScoreOutput, answerIds: string[]): TestResult {
  return {
    contentVersion: score.contentVersion,
    answerIds,
    dimensionScores: score.dimensionScores,
    humanScore: score.humanScore,
    band: score.band,
    keyDimension: score.keyDimension,
    resultId: score.resultId,
    createdAt: Date.now(),
  }
}

export interface DimensionView {
  code: DimensionCode
  name: string
  shortName: string
  score: number
}

/** 结果页六维图与列表使用的数据 */
export function dimensionViews(scores: Record<DimensionCode, number>): DimensionView[] {
  return DIMENSIONS.map((d) => ({
    code: d.code,
    name: d.name,
    shortName: d.shortName,
    score: scores[d.code],
  }))
}
