import { DimensionCode } from '../config/dimensions'
import { BandIndex } from '../config/results'

/** 六维分数，0-100 标准分 */
export type DimensionScores = Record<DimensionCode, number>

export function emptyDimensionScores(): DimensionScores {
  return { R: 0, S: 0, P: 0, E: 0, F: 0, A: 0 }
}

/** 计分纯函数的输出 */
export interface ScoreOutput {
  contentVersion: string
  /** 六维原始分，每个维度 0-24 */
  raw: DimensionScores
  /** 六维标准分，0-100 */
  dimensionScores: DimensionScores
  /** 综合含人量，0-100 */
  humanScore: number
  band: BandIndex
  keyDimension: DimensionCode
  resultId: string
  /** 并列处理用的中间量，只用于排查与测试 */
  debug: {
    zeroCount: DimensionScores
    threeCount: DimensionScores
    lateScores: DimensionScores
  }
}

/** 写入邀请与关系记录的结果快照，不含完整答题答案 */
export interface ResultSnapshot {
  contentVersion: string
  dimensionScores: DimensionScores
  humanScore: number
  band: BandIndex
  keyDimension: DimensionCode
  resultId: string
  title: string
}

/** 本地保存的测试结果 */
export interface TestResult {
  contentVersion: string
  answerIds: string[]
  dimensionScores: DimensionScores
  humanScore: number
  band: BandIndex
  keyDimension: DimensionCode
  resultId: string
  createdAt: number
}

export interface Invitation {
  token: string
  inviterAlias: string
  inviterResultSnapshot: ResultSnapshot
  /** 邀请者怀疑对方属于的物种 resultId */
  expectedPartnerResult: string
  contentVersion: string
  createdAt: number
  expiresAt: number
  status: 'pending' | 'processing' | 'completed'
}

export interface Relationship {
  invitationToken: string
  inviterResultSnapshot: ResultSnapshot
  inviteeResultSnapshot: ResultSnapshot
  /** 好友玩法分，35-96 */
  compatibilityScore: number
  /** 命中的关系规则 id */
  relationshipType: string
  createdAt: number
}

export type AnalyticsEventName =
  | 'page_view'
  | 'test_start'
  | 'question_answer'
  | 'test_complete'
  | 'result_view'
  | 'share_personal'
  | 'invite_created'
  | 'invite_opened'
  | 'invite_test_complete'
  | 'relationship_view'
  | 'share_relationship'
  | 'poster_saved'

export interface AnalyticsEvent {
  anonymousId: string
  eventName: AnalyticsEventName
  source: string
  inviteToken: string
  value?: number
  contentVersion: string
  timestamp: number
}
