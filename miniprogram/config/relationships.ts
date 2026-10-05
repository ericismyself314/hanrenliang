import { DimensionCode } from './dimensions'

export type RelationshipCondition =
  /** 一人综合分 ≥ highAtLeast，另一人 < lowBelow */
  | { kind: 'splitScore'; highAtLeast: number; lowBelow: number }
  /** 两人综合分都 < score */
  | { kind: 'bothBelow'; score: number }
  /** 两人在指定维度上都 ≥ score */
  | { kind: 'bothAtLeast'; dims: DimensionCode[]; score: number }
  /** 两人在 belowDim 上 < belowScore，且在 atLeastDim 上 ≥ atLeastScore */
  | { kind: 'bothBelowAndBothAtLeast'; belowDim: DimensionCode; belowScore: number; atLeastDim: DimensionCode; atLeastScore: number }
  /** 两人在 atLeastDim 上 ≥ atLeastScore，且 diffDim 差值 ≤ maxDiff */
  | { kind: 'bothAtLeastWithDiffAtMost'; atLeastDim: DimensionCode; atLeastScore: number; diffDim: DimensionCode; maxDiff: number }
  /** 两人在 dim 上的差值 ≥ diff */
  | { kind: 'diffAtLeast'; dim: DimensionCode; diff: number }
  /** 两人在 atLeastDim 上 ≥ atLeastScore，且在 belowDim 上 < belowScore */
  | { kind: 'bothAtLeastAndBothBelow'; atLeastDim: DimensionCode; atLeastScore: number; belowDim: DimensionCode; belowScore: number }
  /** 两人在 diffDim 上差值 ≥ diff，且在 atLeastDim 上都 ≥ atLeastScore */
  | { kind: 'diffAtLeastAndBothAtLeast'; diffDim: DimensionCode; diff: number; atLeastDim: DimensionCode; atLeastScore: number }
  /** 六维平均差值 ≤ maxAvgDiff */
  | { kind: 'avgDiffAtMost'; maxAvgDiff: number }
  /** 互补分高于相似分 */
  | { kind: 'complementOverSimilarity' }

export interface RelationshipRule {
  id: string
  name: string
  verdict: string
  condition: RelationshipCondition
}

/**
 * 12 种双人关系结果，顺序即优先级，从上到下命中第一条。
 * 内容与内容规则文档第七部分完全一致。
 */
export const RELATIONSHIP_RULES: RelationshipRule[] = [
  {
    id: 'rehab-duo',
    name: '一拖一活人复健组',
    verdict: '一个负责提出计划，另一个负责在最后一刻决定出门。',
    condition: { kind: 'splitScore', highAtLeast: 70, lowBelow: 45 },
  },
  {
    id: 'both-offline',
    name: '双双掉线联盟',
    verdict: '你们非常理解彼此为什么不想动，但需要有人先打破静默。',
    condition: { kind: 'bothBelow', score: 45 },
  },
  {
    id: 'accident-crew',
    name: '说走就走事故组',
    verdict: '你们的计划不一定完整，但故事通常不少。',
    condition: { kind: 'bothAtLeast', dims: ['P', 'E'], score: 65 },
  },
  {
    id: 'online-close-offline-gone',
    name: '线上巨熟线下失踪',
    verdict: '聊天没有问题，真正见面需要一次明确邀请。',
    condition: { kind: 'bothBelowAndBothAtLeast', belowDim: 'S', belowScore: 35, atLeastDim: 'F', atLeastScore: 45 },
  },
  {
    id: 'golden-meal-duo',
    name: '饭搭子黄金配置',
    verdict: '约饭成本低，临时碰面也不会让人有压力。',
    condition: { kind: 'bothAtLeastWithDiffAtMost', atLeastDim: 'R', atLeastScore: 55, diffDim: 'S', maxDiff: 20 },
  },
  {
    id: 'propose-and-ignore',
    name: '我负责提议你负责不回',
    verdict: '一个人不断点火，另一个人长期保持已读状态。',
    condition: { kind: 'diffAtLeast', dim: 'S', diff: 40 },
  },
  {
    id: 'silent-not-awkward',
    name: '沉默但不尴尬组合',
    verdict: '不需要一直说话，也知道对方仍然在场。',
    condition: { kind: 'bothAtLeastAndBothBelow', atLeastDim: 'F', atLeastScore: 55, belowDim: 'S', belowScore: 55 },
  },
  {
    id: 'random-event-crew',
    name: '校园随机事件制造组',
    verdict: '只要同时出门，原计划通常只剩参考价值。',
    condition: { kind: 'bothAtLeast', dims: ['P'], score: 75 },
  },
  {
    id: 'planner-and-drifter',
    name: '计划派与偏航派',
    verdict: '一个负责落地，一个负责让事情不无聊。',
    condition: { kind: 'diffAtLeastAndBothAtLeast', diffDim: 'P', diff: 40, atLeastDim: 'A', atLeastScore: 50 },
  },
  {
    id: 'ground-action-duo',
    name: '地表行动搭子',
    verdict: '见面对你们来说不是口号，而是一件很容易发生的事。',
    condition: { kind: 'bothAtLeast', dims: ['R'], score: 70 },
  },
  {
    id: 'same-frequency',
    name: '同频生活体',
    verdict: '你们理解彼此的节奏，很少需要解释为什么想去或不想去。',
    condition: { kind: 'avgDiffAtMost', maxAvgDiff: 15 },
  },
  {
    id: 'complement-duo',
    name: '互补生存搭子',
    verdict: '你们不完全一样，但刚好能补上对方不想做的部分。',
    condition: { kind: 'complementOverSimilarity' },
  },
]

export function getRelationshipRule(id: string): RelationshipRule | undefined {
  return RELATIONSHIP_RULES.find((r) => r.id === id)
}

/** 好友玩法分展示区间 */
export const SCORE_MIN = 35
export const SCORE_MAX = 96

/** 相似度的权重 */
export const SIMILARITY_WEIGHT = 0.6
/** 互补度的权重 */
export const COMPLEMENT_WEIGHT = 0.4

/** 共同优势：两人在某维度都较高时使用的说明 */
export const SHARED_STRENGTH_TEXT: Record<DimensionCode, string> = {
  R: '都愿意真的离开固定位置，出门不需要太多铺垫',
  S: '都愿意先开口，关系不会因为没人起头而断掉',
  P: '都能接住计划外的变化，临时改行程也不太炸',
  E: '都对新东西有兴趣，能一起把生活半径往外推',
  F: '都记得住细节，普通的小事也能被你们留下',
  A: '都想自己决定，不会把选择全交给默认选项',
}

/** 共同短板：两人在某维度都较低时使用的说明 */
export const SHARED_GAP_TEXT: Record<DimensionCode, string> = {
  R: '都需要一个足够具体的理由才愿意出门',
  S: '都在等对方先开口，容易出现集体已读',
  P: '都更信任原计划，临时变化会让两个人同时犹豫',
  E: '都更愿意选熟悉的，新选项常常被自动跳过',
  F: '都不太把感受说出来，容易各忙各的',
  A: '都容易顺着默认选项走，需要有人先做决定',
}
