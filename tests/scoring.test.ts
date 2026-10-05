import { DIMENSION_CODES } from '../miniprogram/config/dimensions'
import { getAvatarStyle } from '../miniprogram/config/avatars'
import { QUESTIONS, TOTAL_QUESTIONS } from '../miniprogram/config/questions'
import { RESULTS, getResult } from '../miniprogram/config/results'
import { bandOf, pickKeyDimension, scoreAnswers, standardize } from '../miniprogram/utils/scoring'
import { emptyDimensionScores } from '../miniprogram/utils/types'
import { assert, createRandom, describe, equal, it } from './harness'

function answersByLetter(letter: 'A' | 'B' | 'C' | 'D'): string[] {
  return QUESTIONS.map((q) => `${q.id}-${letter}`)
}

describe('内容配置校验', () => {
  it('共 24 道题，每题恰好 4 个选项', () => {
    equal(QUESTIONS.length, 24, '题目数量应为 24')
    equal(TOTAL_QUESTIONS, 24, 'TOTAL_QUESTIONS 应为 24')
    QUESTIONS.forEach((q) => equal(q.options.length, 4, `${q.id} 应有 4 个选项`))
  })

  it('每个维度恰好出现 8 次，原始满分均为 24', () => {
    DIMENSION_CODES.forEach((dim) => {
      const count = QUESTIONS.filter((q) => q.dimensions.indexOf(dim) >= 0).length
      equal(count, 8, `${dim} 应出现 8 次`)
    })
  })

  it('每题只给自己声明的两个维度计分，且分数在 0-3 之间', () => {
    QUESTIONS.forEach((q) => {
      q.options.forEach((o) => {
        Object.keys(o.scores).forEach((dim) => {
          assert(q.dimensions.indexOf(dim as 'R') >= 0, `${q.id} 的 ${o.id} 给未声明维度 ${dim} 计分`)
          const value = o.scores[dim as 'R'] as number
          assert(value >= 0 && value <= 3, `${o.id} 在 ${dim} 上分数越界：${value}`)
        })
      })
    })
  })

  it('每个结果推荐的最佳搭子都必须是 24 个物种之一', () => {
    const titles = new Set(RESULTS.map((r) => r.title))
    RESULTS.forEach((r) => {
      assert(titles.has(r.bestPartner), `${r.id} 的最佳搭子「${r.bestPartner}」不是有效的物种称号`)
      assert(r.bestPartner !== r.title, `${r.id} 的最佳搭子不应是自己`)
    })
  })

  it('选项 id 全表唯一', () => {
    const seen = new Set<string>()
    QUESTIONS.forEach((q) => q.options.forEach((o) => {
      assert(!seen.has(o.id), `重复的选项 id：${o.id}`)
      seen.add(o.id)
    }))
    equal(seen.size, 96, '选项总数应为 96')
  })

  it('24 种结果都有完整文案，且不含羞辱性词语', () => {
    equal(RESULTS.length, 24, '结果数量应为 24')
    const banned = ['废物', '失败者', '无聊的人', '没救', '垃圾']
    RESULTS.forEach((r) => {
      assert(
        !!r.title && !!r.verdict && !!r.portrait && !!r.humanSide && !!r.offlineSignal && !!r.bestPartner,
        `${r.id} 文案不完整`,
      )
      assert(r.verdict.length <= 45, `${r.id} 判词超过 45 字：${r.verdict.length}`)
      assert(r.portrait.length >= 200 && r.portrait.length <= 400, `${r.id} 人物分析应在 200-400 字：${r.portrait.length}`)
      assert(r.portrait.indexOf('含人量') >= 0, `${r.id} 的人物分析必须点出含人量`)
      const text = `${r.title}${r.verdict}${r.portrait}${r.humanSide}${r.offlineSignal}`
      banned.forEach((word) => assert(text.indexOf(word) < 0, `${r.id} 出现羞辱性词语：${word}`))
    })
  })

  it('24 种结果都有各自的小人配件', () => {
    const accessories = RESULTS.map((result) => getAvatarStyle(result.id).accessory)
    equal(new Set(accessories).size, 24, '24 种物种的小人配件不应重复')
  })
})

describe('计分函数', () => {
  it('标准化分数按四舍五入（原始分 ÷ 24 × 100）', () => {
    equal(standardize(9), 38, '9 分应标准化为 38')
    equal(standardize(7), 29, '7 分应标准化为 29')
    equal(standardize(11), 46, '11 分应标准化为 46')
    equal(standardize(13), 54, '13 分应标准化为 54')
    equal(standardize(12), 50, '12 分应标准化为 50')
    equal(standardize(10), 42, '10 分应标准化为 42')
  })

  it('档位边界正确：24/25、49/50、74/75', () => {
    equal(bandOf(0), 0, '0 分应在 0-24 档')
    equal(bandOf(24), 0, '24 分应在 0-24 档')
    equal(bandOf(25), 1, '25 分应在 25-49 档')
    equal(bandOf(49), 1, '49 分应在 25-49 档')
    equal(bandOf(50), 2, '50 分应在 50-74 档')
    equal(bandOf(74), 2, '74 分应在 50-74 档')
    equal(bandOf(75), 3, '75 分应在 75-100 档')
    equal(bandOf(100), 3, '100 分应在 75-100 档')
  })

  it('文档计算示例：43 分、25-49 档、关键维度 S、结果 B1-S', () => {
    const scores = emptyDimensionScores()
    scores.R = 38
    scores.S = 29
    scores.P = 46
    scores.E = 54
    scores.F = 50
    scores.A = 42
    const humanScore = Math.round((38 + 29 + 46 + 54 + 50 + 42) / 6)
    equal(humanScore, 43, '示例综合含人量应为 43')
    equal(bandOf(humanScore), 1, '示例应落在 25-49 档')
    const key = pickKeyDimension(scores, emptyDimensionScores(), emptyDimensionScores(), emptyDimensionScores(), true)
    equal(key, 'S', '示例关键维度应为 S')
    equal(getResult('B1-S')!.title, '朋友圈观察员', 'B1-S 应为朋友圈观察员')
  })

  it('同一组答案重复计算结果完全一致', () => {
    const rand = createRandom(20260916)
    for (let n = 0; n < 50; n += 1) {
      const answers = QUESTIONS.map((q) => q.options[Math.floor(rand() * 4)].id)
      const a = scoreAnswers(answers)
      const b = scoreAnswers(answers)
      equal(a.humanScore, b.humanScore, '含人量应一致')
      equal(a.resultId, b.resultId, '结果 ID 应一致')
    }
  })

  it('答案数量或内容非法时抛出错误', () => {
    let threw = false
    try {
      scoreAnswers(answersByLetter('A').slice(0, 23))
    } catch {
      threw = true
    }
    assert(threw, '答案数量不足时应抛出错误')

    threw = false
    try {
      const bad = answersByLetter('A')
      bad[3] = 'Q04-Z'
      scoreAnswers(bad)
    } catch {
      threw = true
    }
    assert(threw, '答案非法时应抛出错误')
  })

  it('全选同一选项也能得到合法结果', () => {
    const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D']
    letters.forEach((letter) => {
      const out = scoreAnswers(answersByLetter(letter))
      assert(out.humanScore >= 0 && out.humanScore <= 100, '含人量应在 0-100 之间')
      assert(!!getResult(out.resultId), `结果 ${out.resultId} 应有对应文案`)
      DIMENSION_CODES.forEach((dim) => {
        assert(out.dimensionScores[dim] >= 0 && out.dimensionScores[dim] <= 100, '维度分应在 0-100 之间')
      })
    })
  })

  it('计分不修改传入的答案数组', () => {
    const answers = answersByLetter('B')
    const copy = [...answers]
    scoreAnswers(answers)
    equal(answers.join(','), copy.join(','), '计分不应修改输入')
  })
})
