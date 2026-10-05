import { DimensionScores } from '../miniprogram/utils/types'
import { emptyDimensionScores } from '../miniprogram/utils/types'
import {
  buildRelationship,
  calcComplement,
  calcFriendScore,
  calcSimilarity,
  pickRelationshipRule,
} from '../miniprogram/utils/matching'
import { assert, createRandom, describe, equal, it } from './harness'

function makeScores(partial: Partial<DimensionScores>): DimensionScores {
  const scores = emptyDimensionScores()
  Object.keys(partial).forEach((key) => {
    scores[key as keyof DimensionScores] = partial[key as keyof DimensionScores] as number
  })
  return scores
}

function pair(a: Partial<DimensionScores>, b: Partial<DimensionScores>) {
  const sa = makeScores(a)
  const sb = makeScores(b)
  const dims = ['R', 'S', 'P', 'E', 'F', 'A'] as (keyof DimensionScores)[]
  const avg = (s: DimensionScores) => Math.round(dims.reduce((acc, d) => acc + s[d], 0) / dims.length)
  return [
    { humanScore: avg(sa), dimensionScores: sa },
    { humanScore: avg(sb), dimensionScores: sb },
  ] as [{ humanScore: number; dimensionScores: DimensionScores }, { humanScore: number; dimensionScores: DimensionScores }]
}

describe('好友玩法分', () => {
  it('相似度与互补度公式正确', () => {
    const full = makeScores({ R: 100, S: 100, P: 100, E: 100, F: 100, A: 100 })
    const zero = emptyDimensionScores()
    const half = makeScores({ R: 50, S: 50, P: 50, E: 50, F: 50, A: 50 })

    equal(calcSimilarity(full, full), 100, '完全相同相似度应为 100')
    equal(calcComplement(full, full), 0, '两人均满分时互补度应为 0')
    equal(calcSimilarity(full, zero), 0, '完全相反相似度应为 0')
    equal(calcComplement(full, zero), 100, '满分与零分互补度应为 100')
    equal(calcFriendScore(half, half), 96, '相同中分应被限制在 96')
  })

  it('好友玩法分始终落在 35-96 之间', () => {
    const rand = createRandom(77)
    for (let i = 0; i < 500; i += 1) {
      const a = emptyDimensionScores()
      const b = emptyDimensionScores()
      ;(['R', 'S', 'P', 'E', 'F', 'A'] as (keyof DimensionScores)[]).forEach((d) => {
        a[d] = Math.floor(rand() * 101)
        b[d] = Math.floor(rand() * 101)
      })
      const score = calcFriendScore(a, b)
      assert(score >= 35 && score <= 96, `好友玩法分越界：${score}`)
    }
  })
})

describe('12 种关系规则按优先级命中', () => {
  const cases: { ruleId: string; name: string; a: Partial<DimensionScores>; b: Partial<DimensionScores> }[] = [
    { ruleId: 'rehab-duo', name: '一拖一活人复健组', a: { R: 90, S: 90, P: 90, E: 90, F: 90, A: 90 }, b: { R: 30, S: 30, P: 30, E: 30, F: 30, A: 30 } },
    { ruleId: 'both-offline', name: '双双掉线联盟', a: { R: 30, S: 30, P: 30, E: 30, F: 30, A: 30 }, b: { R: 44, S: 44, P: 44, E: 44, F: 44, A: 44 } },
    { ruleId: 'accident-crew', name: '说走就走事故组', a: { R: 70, S: 70, P: 70, E: 70, F: 70, A: 70 }, b: { R: 70, S: 70, P: 70, E: 70, F: 70, A: 70 } },
    { ruleId: 'online-close-offline-gone', name: '线上巨熟线下失踪', a: { R: 50, S: 30, P: 50, E: 50, F: 50, A: 50 }, b: { R: 50, S: 30, P: 50, E: 50, F: 50, A: 50 } },
    { ruleId: 'golden-meal-duo', name: '饭搭子黄金配置', a: { R: 60, S: 50, P: 50, E: 50, F: 50, A: 50 }, b: { R: 60, S: 50, P: 50, E: 50, F: 50, A: 50 } },
    { ruleId: 'propose-and-ignore', name: '我负责提议你负责不回', a: { R: 50, S: 90, P: 50, E: 50, F: 50, A: 80 }, b: { R: 50, S: 40, P: 50, E: 50, F: 50, A: 80 } },
    { ruleId: 'silent-not-awkward', name: '沉默但不尴尬组合', a: { R: 50, S: 40, P: 50, E: 50, F: 60, A: 50 }, b: { R: 50, S: 40, P: 50, E: 50, F: 60, A: 50 } },
    { ruleId: 'random-event-crew', name: '校园随机事件制造组', a: { R: 50, S: 50, P: 80, E: 50, F: 50, A: 50 }, b: { R: 50, S: 50, P: 80, E: 50, F: 50, A: 50 } },
    { ruleId: 'planner-and-drifter', name: '计划派与偏航派', a: { R: 50, S: 50, P: 90, E: 50, F: 50, A: 60 }, b: { R: 50, S: 50, P: 40, E: 50, F: 50, A: 60 } },
    { ruleId: 'ground-action-duo', name: '地表行动搭子', a: { R: 80, S: 70, P: 50, E: 50, F: 50, A: 50 }, b: { R: 80, S: 40, P: 50, E: 50, F: 50, A: 50 } },
    { ruleId: 'same-frequency', name: '同频生活体', a: { R: 50, S: 50, P: 50, E: 50, F: 50, A: 50 }, b: { R: 60, S: 60, P: 60, E: 60, F: 60, A: 60 } },
    { ruleId: 'complement-duo', name: '互补生存搭子', a: { R: 90, S: 60, P: 90, E: 20, F: 20, A: 20 }, b: { R: 20, S: 50, P: 20, E: 80, F: 80, A: 80 } },
  ]

  cases.forEach((item) => {
    it(`${item.name}`, () => {
      const [a, b] = pair(item.a, item.b)
      const picked = pickRelationshipRule(a, b)
      equal(picked.rule.id, item.ruleId, `${item.name} 应命中 ${item.ruleId}`)
    })
  })
})

describe('双人关系摘要', () => {
  it('输出关系称号、判词、玩法分与共同项', () => {
    const [a, b] = pair({ R: 50, S: 50, P: 50, E: 50, F: 50, A: 50 }, { R: 60, S: 60, P: 60, E: 60, F: 60, A: 60 })
    const summary = buildRelationship(a, b)
    equal(summary.relationshipType, '同频生活体', '关系称号应为同频生活体')
    assert(summary.verdict.length > 0, '应返回关系判词')
    assert(summary.compatibilityScore >= 35 && summary.compatibilityScore <= 96, '好友玩法分应在 35-96 之间')
    equal(summary.sharedStrengths.length, 2, '应给出两条共同优势')
    equal(summary.sharedGaps.length, 2, '应给出两条共同短板')
  })

  it('交换双方顺序得到同一关系与同一分数', () => {
    const [a, b] = pair({ R: 90, S: 60, P: 90, E: 20, F: 20, A: 20 }, { R: 20, S: 50, P: 20, E: 80, F: 80, A: 80 })
    const s1 = buildRelationship(a, b)
    const s2 = buildRelationship(b, a)
    equal(s1.relationshipType, s2.relationshipType, '关系称号应与顺序无关')
    equal(s1.compatibilityScore, s2.compatibilityScore, '好友玩法分应与顺序无关')
  })
})
