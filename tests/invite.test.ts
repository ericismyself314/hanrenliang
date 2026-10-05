import { INVITE_TTL } from '../miniprogram/config/env'
import { getResult } from '../miniprogram/config/results'
import {
  buildInvitation,
  buildRelationshipRecord,
  generateToken,
  isExpired,
} from '../miniprogram/utils/inviteCore'
import { emptyDimensionScores } from '../miniprogram/utils/types'
import { ResultSnapshot } from '../miniprogram/utils/types'
import { invitePath, relationshipPath } from '../miniprogram/utils/share'
import { assert, createRandom, describe, equal, it } from './harness'

function snapshot(resultId: string, humanScore: number, seed: number): ResultSnapshot {
  const def = getResult(resultId)!
  const scores = emptyDimensionScores()
  const rand = createRandom(seed)
  ;(['R', 'S', 'P', 'E', 'F', 'A'] as (keyof typeof scores)[]).forEach((d) => {
    scores[d] = Math.round(humanScore + (rand() * 20 - 10))
  })
  return {
    contentVersion: 'content-v1.0',
    dimensionScores: scores,
    humanScore,
    band: def.band,
    keyDimension: def.dimension,
    resultId,
    title: def.title,
  }
}

describe('邀请链路', () => {
  it('token 长度固定且不重复', () => {
    const rand = createRandom(9)
    const tokens = new Set<string>()
    for (let i = 0; i < 2000; i += 1) {
      const token = generateToken(rand)
      equal(token.length, 24, 'token 长度应为 24')
      tokens.add(token)
    }
    equal(tokens.size, 2000, '2000 次生成不应出现重复 token')
  })

  it('邀请记录带 7 天有效期，过期可被识别', () => {
    const now = 1760000000000
    const invitation = buildInvitation({
      token: 'abc',
      inviterAlias: '',
      inviterResultSnapshot: snapshot('B2-S', 60, 1),
      expectedPartnerResult: 'B3-S',
      now,
    })
    equal(invitation.inviterAlias, '神秘大学生', '未填称呼时默认神秘大学生')
    equal(invitation.contentVersion, 'content-v1.0', '邀请应保存结果内容版本')
    equal(invitation.expiresAt - invitation.createdAt, INVITE_TTL, '有效期应为 7 天')
    equal(isExpired(invitation, now + 1000), false, '刚创建不应过期')
    equal(isExpired(invitation, now + INVITE_TTL + 1), true, '超过 7 天应过期')
  })

  it('快照里不含完整答题答案', () => {
    const snap = snapshot('B1-S', 43, 3)
    const keys = Object.keys(snap)
    equal(keys.indexOf('answerIds') < 0, true, '快照不应包含 answerIds')
    keys.forEach((k) => assert(k !== 'answers', `快照不应包含 ${k}`))
  })

  it('被邀请人完成后生成关系记录，且双方看到同一份', () => {
    const now = 1760000000000
    const inviter = snapshot('B2-S', 60, 11)
    const invitee = snapshot('B3-P', 88, 22)
    const invitation = buildInvitation({
      token: 'tok-1',
      inviterAlias: '蛋蛋',
      inviterResultSnapshot: inviter,
      expectedPartnerResult: 'B3-P',
      now,
    })
    const relationship = buildRelationshipRecord(invitation, invitee, now + 5000)

    equal(relationship.invitationToken, 'tok-1', '关系记录应关联邀请 token')
    equal(relationship.inviterResultSnapshot.resultId, 'B2-S', '应保存邀请者快照')
    equal(relationship.inviteeResultSnapshot.resultId, 'B3-P', '应保存被邀请人快照')
    assert(relationship.compatibilityScore >= 35 && relationship.compatibilityScore <= 96, '好友玩法分应在 35-96 之间')
    assert(!!relationship.relationshipType, '应命中一种关系')

    const reversed = buildRelationshipRecord(
      { ...invitation, inviterResultSnapshot: invitee },
      inviter,
      now + 5000,
    )
    equal(reversed.relationshipType, relationship.relationshipType, '交换顺序关系类型应一致')
    equal(reversed.compatibilityScore, relationship.compatibilityScore, '交换顺序玩法分应一致')
  })

  it('重复完成同一邀请得到相同关系记录', () => {
    const now = 1760000000000
    const invitation = buildInvitation({
      token: 'tok-2',
      inviterAlias: '阿元',
      inviterResultSnapshot: snapshot('B1-F', 40, 5),
      expectedPartnerResult: 'B2-F',
      now,
    })
    const invitee = snapshot('B2-F', 53, 6)
    const first = buildRelationshipRecord(invitation, invitee, now + 1000)
    const second = buildRelationshipRecord({ ...invitation, status: 'completed' }, invitee, now + 2000)
    equal(second.relationshipType, first.relationshipType, '重复完成关系类型应一致')
    equal(second.compatibilityScore, first.compatibilityScore, '重复完成玩法分应一致')
  })

  it('好友分享路径使用正确的页面参数', () => {
    equal(invitePath('a+b'), '/pages/index/index?invite=a%2Bb', '邀请分享应落到首页并携带 invite 参数')
    equal(relationshipPath('a+b'), '/pages/relationship/index?token=a%2Bb', '关系分享应携带 token 参数')
  })
})
