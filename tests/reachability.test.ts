import { DIMENSION_CODES } from '../miniprogram/config/dimensions'
import { QUESTIONS } from '../miniprogram/config/questions'
import { RESULTS, getResult } from '../miniprogram/config/results'
import { ScoreOutput } from '../miniprogram/utils/types'
import { scoreAnswers } from '../miniprogram/utils/scoring'
import { assert, createRandom, describe, equal, it } from './harness'

const BAND_CENTER = [12, 37, 62, 87]

// V2.0 的 B0-F 需要一组较窄的均衡组合；保留经过完整评分验证的见证答案，
// 避免启发式爬山搜索因为随机路径而把实际可达结果误报为死结果。
const KNOWN_WITNESSES: Record<string, string[]> = {
  'B0-F': [
    'Q01-B', 'Q02-B', 'Q03-C', 'Q04-B', 'Q05-B', 'Q06-D',
    'Q07-C', 'Q08-D', 'Q09-B', 'Q10-D', 'Q11-B', 'Q12-C',
    'Q13-D', 'Q14-D', 'Q15-B', 'Q16-B', 'Q17-A', 'Q18-A',
    'Q19-D', 'Q20-C', 'Q21-B', 'Q22-B', 'Q23-B', 'Q24-A',
  ],
}

function penalty(out: ScoreOutput, band: number, dim: string): number {
  if (out.resultId === `B${band}-${dim}`) return -1
  const distance = Math.abs(out.humanScore - BAND_CENTER[band])
  return distance + (out.keyDimension === dim ? 0 : 45)
}

/** 用爬山搜索找到能触达指定结果的答案组合，保证每个结果都不是死结果 */
function searchAnswers(band: number, dim: string, seed: number): string[] | null {
  const rand = createRandom(seed)
  for (let restart = 0; restart < 12; restart += 1) {
    const current = QUESTIONS.map((q) => q.options[Math.floor(rand() * 4)].id)
    let currentPenalty = penalty(scoreAnswers(current), band, dim)
    if (currentPenalty < 0) return current

    for (let iter = 0; iter < 2000; iter += 1) {
      const pos = Math.floor(rand() * QUESTIONS.length)
      const previous = current[pos]
      const next = QUESTIONS[pos].options[Math.floor(rand() * 4)].id
      if (next === previous) continue
      current[pos] = next
      const out = scoreAnswers(current)
      const nextPenalty = penalty(out, band, dim)
      if (nextPenalty < 0) return current
      if (nextPenalty <= currentPenalty) {
        currentPenalty = nextPenalty
      } else {
        current[pos] = previous
      }
    }
  }

  const witness = KNOWN_WITNESSES[`B${band}-${dim}`]
  if (witness && scoreAnswers(witness).resultId === `B${band}-${dim}`) return witness
  return null
}

describe('24 种结果可达性', () => {
  it('每个结果都能被至少一组答案触达', () => {
    const missing: string[] = []
    const samples: string[] = []
    RESULTS.forEach((result, index) => {
      const answers = searchAnswers(result.band, result.dimension, 1000 + index * 37)
      if (!answers) {
        missing.push(`${result.id} ${result.title}`)
        return
      }
      const out = scoreAnswers(answers)
      equal(out.resultId, result.id, `${result.id} 搜索到的答案应命中该结果`)
      assert(!!getResult(out.resultId), `${result.id} 应有对应文案`)
      samples.push(`${result.id} ${result.title}｜含人量 ${out.humanScore}｜关键维度 ${out.keyDimension}`)
    })
    equal(missing.length, 0, `以下结果无法触达：${missing.join('、')}`)
    console.log('    样例：')
    samples.forEach((s) => console.log(`      ${s}`))
  })

  it('24 种结果恰好覆盖 4 档 × 6 维，没有重复', () => {
    const keys = new Set(RESULTS.map((r) => `${r.band}-${r.dimension}`))
    equal(keys.size, 24, '结果组合应互不重复')
    DIMENSION_CODES.forEach((dim) => {
      ;[0, 1, 2, 3].forEach((band) => {
        assert(keys.has(`${band}-${dim}`), `缺少 ${dim} 在第 ${band} 档的结果`)
      })
    })
  })
})
