/** 六个隐藏维度的代码 */
export type DimensionCode = 'R' | 'S' | 'P' | 'E' | 'F' | 'A'

export interface DimensionMeta {
  code: DimensionCode
  name: string
  measure: string
  /** 结果页六维图上的短标签 */
  shortName: string
}

export const DIMENSIONS: DimensionMeta[] = [
  { code: 'R', name: '现实接触', shortName: '现实', measure: '是否真正离开屏幕和固定空间，进入校园、城市与具体场景' },
  { code: 'S', name: '社交发起', shortName: '社交', measure: '是否主动建立连接、提出邀请、回应他人和推动共同活动' },
  { code: 'P', name: '随机偏航', shortName: '偏航', measure: '是否允许计划外事件发生，并愿意接住临时变化' },
  { code: 'E', name: '好奇探索', shortName: '好奇', measure: '是否主动接触陌生地点、活动、兴趣与人' },
  { code: 'F', name: '感受回响', shortName: '感受', measure: '是否仍会对生活产生真实情绪、注意细节并留下记忆' },
  { code: 'A', name: '自主在场', shortName: '自主', measure: '生活中有多少判断、选择和行动真正由自己完成' },
]

export const DIMENSION_CODES: DimensionCode[] = ['R', 'S', 'P', 'E', 'F', 'A']

/**
 * 并列时的固定顺序，保证同一组答案在任何设备上得到同一结果。
 * 来自内容规则文档第四部分「并列处理规则」第 3 条。
 */
export const TIE_BREAK_ORDER: DimensionCode[] = ['A', 'F', 'S', 'E', 'P', 'R']

/** 每个维度出现的题目数，原始满分 = 8 × 3 */
export const QUESTIONS_PER_DIMENSION = 8
export const MAX_RAW_PER_DIMENSION = QUESTIONS_PER_DIMENSION * 3

/** 并列第二规则使用最后 6 题（第 19-24 题） */
export const TIE_BREAK_QUESTION_START_INDEX = 18
