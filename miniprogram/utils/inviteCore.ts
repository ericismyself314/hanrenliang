import { INVITE_TTL } from '../config/env'
import { buildRelationship } from './matching'
import { Invitation, Relationship, ResultSnapshot } from './types'

const TOKEN_CHARS = 'abcdefghijkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

/**
 * 生成不可预测的邀请 token。
 * 云函数版本用 crypto.randomBytes，这里允许注入随机源以便测试。
 */
export function generateToken(rand: () => number = Math.random): string {
  let out = ''
  for (let i = 0; i < 24; i += 1) {
    out += TOKEN_CHARS[Math.floor(rand() * TOKEN_CHARS.length) % TOKEN_CHARS.length]
  }
  return out
}

export interface BuildInvitationInput {
  token: string
  inviterAlias: string
  inviterResultSnapshot: ResultSnapshot
  expectedPartnerResult: string
  now: number
}

export function buildInvitation(input: BuildInvitationInput): Invitation {
  return {
    token: input.token,
    inviterAlias: input.inviterAlias || '神秘大学生',
    inviterResultSnapshot: input.inviterResultSnapshot,
    expectedPartnerResult: input.expectedPartnerResult || '',
    contentVersion: input.inviterResultSnapshot.contentVersion,
    createdAt: input.now,
    expiresAt: input.now + INVITE_TTL,
    status: 'pending',
  }
}

export function isExpired(invitation: Invitation, now: number): boolean {
  return invitation.expiresAt < now
}

/** 以双方结果快照生成关系记录，交换双方顺序结果一致 */
export function buildRelationshipRecord(
  invitation: Invitation,
  inviteeResultSnapshot: ResultSnapshot,
  now: number,
): Relationship {
  const summary = buildRelationship(
    {
      humanScore: invitation.inviterResultSnapshot.humanScore,
      dimensionScores: invitation.inviterResultSnapshot.dimensionScores,
    },
    { humanScore: inviteeResultSnapshot.humanScore, dimensionScores: inviteeResultSnapshot.dimensionScores },
  )
  return {
    invitationToken: invitation.token,
    inviterResultSnapshot: invitation.inviterResultSnapshot,
    inviteeResultSnapshot,
    compatibilityScore: summary.compatibilityScore,
    relationshipType: summary.ruleId,
    createdAt: now,
  }
}
