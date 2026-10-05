/* eslint-disable @typescript-eslint/no-var-requires */
import { calcComplement, calcFriendScore, calcSimilarity, pickRelationshipRule } from '../miniprogram/utils/matching'
import { DimensionScores, emptyDimensionScores } from '../miniprogram/utils/types'
import { assert, createRandom, describe, equal, it } from './harness'

/** 云函数内的 Node 版本关系计算，必须与小程序端 TS 版本结果完全一致 */
const cloudMatching = require('../../cloudfunctions/completeInvite/matching.js') as {
  calcSimilarity: (a: DimensionScores, b: DimensionScores) => number
  calcComplement: (a: DimensionScores, b: DimensionScores) => number
  calcFriendScore: (a: DimensionScores, b: DimensionScores) => number
  pickRelationship: (
    a: { humanScore: number; dimensionScores: DimensionScores },
    b: { humanScore: number; dimensionScores: DimensionScores },
  ) => { ruleId: string }
}

describe('云函数与小程序端关系计算一致性', () => {
  it('500 组随机输入得到完全相同的关系类型与分数', () => {
    const rand = createRandom(31415)
    const dims = ['R', 'S', 'P', 'E', 'F', 'A'] as (keyof DimensionScores)[]
    for (let i = 0; i < 500; i += 1) {
      const a = emptyDimensionScores()
      const b = emptyDimensionScores()
      dims.forEach((d) => {
        a[d] = Math.floor(rand() * 101)
        b[d] = Math.floor(rand() * 101)
      })
      const avg = (s: DimensionScores) => Math.round(dims.reduce((acc, d) => acc + s[d], 0) / dims.length)
      const ia = { humanScore: avg(a), dimensionScores: a }
      const ib = { humanScore: avg(b), dimensionScores: b }

      equal(cloudMatching.calcSimilarity(a, b), calcSimilarity(a, b), `第 ${i} 组相似度不一致`)
      equal(cloudMatching.calcComplement(a, b), calcComplement(a, b), `第 ${i} 组互补度不一致`)
      equal(cloudMatching.calcFriendScore(a, b), calcFriendScore(a, b), `第 ${i} 组好友玩法分不一致`)
      equal(
        cloudMatching.pickRelationship(ia, ib).ruleId,
        pickRelationshipRule(ia, ib).rule.id,
        `第 ${i} 组关系类型不一致`,
      )
    }
  })

  it('云函数版本同样把玩法分限制在 35-96', () => {
    const full = emptyDimensionScores()
    ;(['R', 'S', 'P', 'E', 'F', 'A'] as (keyof DimensionScores)[]).forEach((d) => {
      full[d] = 100
    })
    const zero = emptyDimensionScores()
    assert(cloudMatching.calcFriendScore(full, zero) >= 35, '玩法分不应低于 35')
    const half = emptyDimensionScores()
    ;(['R', 'S', 'P', 'E', 'F', 'A'] as (keyof DimensionScores)[]).forEach((d) => {
      half[d] = 50
    })
    equal(cloudMatching.calcFriendScore(half, half), 96, '玩法分不应高于 96')
  })
})
