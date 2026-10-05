import { BackendError, completeInvite, createInvite, fetchRelationship, getInvite } from '../miniprogram/utils/backend'
import { getMyInviteTokens } from '../miniprogram/utils/storage'
import { ResultSnapshot, emptyDimensionScores } from '../miniprogram/utils/types'
import { assert, describe, equal, it } from './harness'

/** 用内存实现替换微信 storage，让邀请链路可以在 Node 里跑通 */
function installFakeWx(): void {
  const store: Record<string, unknown> = {}
  const fake = {
    getStorageSync: (key: string) => (key in store ? store[key] : ''),
    setStorageSync: (key: string, value: unknown) => {
      store[key] = value
    },
    removeStorageSync: (key: string) => {
      delete store[key]
    },
    cloud: undefined,
  }
  ;(globalThis as unknown as { wx: unknown }).wx = fake
}

installFakeWx()

function snapshot(resultId: string, humanScore: number, seedOffset = 0): ResultSnapshot {
  const scores = emptyDimensionScores()
  ;(['R', 'S', 'P', 'E', 'F', 'A'] as (keyof typeof scores)[]).forEach((d, i) => {
    scores[d] = Math.min(100, Math.max(0, humanScore + ((i + seedOffset) % 5) * 4 - 8))
  })
  return {
    contentVersion: 'content-v1.0',
    dimensionScores: scores,
    humanScore,
    band: humanScore < 50 ? 1 : 2,
    keyDimension: 'S',
    resultId,
    title: '测试物种',
  }
}

async function expectError(fn: () => Promise<unknown>, code: string): Promise<void> {
  let actual = ''
  try {
    await fn()
  } catch (err) {
    actual = (err as BackendError).code
  }
  equal(actual, code, `应抛出 ${code}`)
}

describe('邀请链路集成（本地后端）', () => {
  it('创建邀请 → 读取邀请 → 完成测试 → 关系报告 → 重复完成', async () => {
    const inviter = snapshot('B2-S', 62, 1)
    const invitee = snapshot('B3-P', 86, 2)

    const created = await createInvite({
      inviterAlias: '蛋蛋',
      inviterResultSnapshot: inviter,
      expectedPartnerResult: 'B3-P',
    })
    assert(created.token.length === 24, '应返回 24 位 token')
    assert(created.expiresAt > Date.now(), '应有未来过期时间')

    const invitation = await getInvite(created.token)
    equal(invitation.inviterAlias, '蛋蛋', '应保存邀请者称呼')
    equal(invitation.expectedPartnerResult, 'B3-P', '应保存怀疑的搭子类型')
    equal(invitation.status, 'pending', '新邀请应为待完成')

    const relationship = await completeInvite(created.token, invitee)
    equal(relationship.invitationToken, created.token, '关系记录应绑定 token')
    assert(
      relationship.compatibilityScore >= 35 && relationship.compatibilityScore <= 96,
      `好友玩法分越界：${relationship.compatibilityScore}`,
    )
    assert(!!relationship.relationshipType, '应命中一种关系')

    const fetched = await fetchRelationship(created.token)
    equal(fetched.compatibilityScore, relationship.compatibilityScore, '重复读取应得到同一分数')
    equal(fetched.relationshipType, relationship.relationshipType, '重复读取应得到同一关系')

    const again = await completeInvite(created.token, invitee)
    equal(again.compatibilityScore, relationship.compatibilityScore, '重复完成应返回已有报告')

    const tokens = getMyInviteTokens()
    equal(tokens.indexOf(created.token) >= 0, true, '我发出的邀请应被记录')
  })

  it('不存在的邀请与缺失编号都给出明确错误码', async () => {
    await expectError(() => getInvite('not-exist-token'), 'INVITE_NOT_FOUND')
    await expectError(() => getInvite(''), 'INVITE_NOT_FOUND')
    await expectError(() => completeInvite('', snapshot('B1-S', 40)), 'INVITE_NOT_FOUND')
    await expectError(() => fetchRelationship('nope'), 'INVITE_NOT_FOUND')
  })

  it('未完成的邀请读取关系报告会提示还没有生成', async () => {
    const created = await createInvite({
      inviterAlias: '阿元',
      inviterResultSnapshot: snapshot('B1-F', 41, 3),
      expectedPartnerResult: 'B2-F',
    })
    await expectError(() => fetchRelationship(created.token), 'INVITE_NOT_FOUND')
  })
})
