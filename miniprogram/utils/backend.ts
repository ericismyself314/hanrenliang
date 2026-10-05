import { CLOUD_ENV } from '../config/env'
import { CONTENT_VERSION } from '../config/content'
import { Invitation, Relationship, ResultSnapshot } from './types'
import { buildInvitation, buildRelationshipRecord, generateToken, isExpired } from './inviteCore'
import {
  addMyInviteToken,
  getInvitation,
  getRelationshipRecord,
  saveInvitation,
  saveRelationship,
} from './storage'

export type BackendErrorCode =
  | 'INVITE_NOT_FOUND'
  | 'INVITE_EXPIRED'
  | 'INVITE_ALREADY_COMPLETED'
  | 'CLOUD_ERROR'
  | 'INVALID_ARGUMENT'

export class BackendError extends Error {
  code: BackendErrorCode
  constructor(code: BackendErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = 'BackendError'
  }
}

function cloudAvailable(): boolean {
  return (
    Boolean(CLOUD_ENV) &&
    typeof wx !== 'undefined' &&
    Boolean(wx.cloud) &&
    typeof wx.cloud.callFunction === 'function'
  )
}

async function callCloud<T>(name: string, data: Record<string, unknown>): Promise<T> {
  const res = await wx.cloud.callFunction({ name, data })
  const result = (res as unknown as { result?: T & { ok?: boolean; code?: string; message?: string } }).result
  if (!result) throw new BackendError('CLOUD_ERROR', '云函数没有返回结果')
  if (result.ok === false) {
    throw new BackendError((result.code as BackendErrorCode) || 'CLOUD_ERROR', result.message || '云函数调用失败')
  }
  return result as T
}

export interface CreateInviteInput {
  inviterAlias: string
  inviterResultSnapshot: ResultSnapshot
  expectedPartnerResult: string
}

export interface CreateInviteResult {
  token: string
  expiresAt: number
}

/** 创建邀请：有云环境走云函数，否则用本地降级实现，保证链路可跑通 */
export async function createInvite(input: CreateInviteInput): Promise<CreateInviteResult> {
  if (!input.inviterResultSnapshot) throw new BackendError('INVALID_ARGUMENT', '缺少邀请者结果快照')
  if (cloudAvailable()) {
    const res = await callCloud<CreateInviteResult>('createInvite', {
      ...input,
      contentVersion: CONTENT_VERSION,
    })
    addMyInviteToken(res.token)
    return { token: res.token, expiresAt: res.expiresAt }
  }
  const token = generateToken()
  const invitation = buildInvitation({
    token,
    inviterAlias: input.inviterAlias,
    inviterResultSnapshot: input.inviterResultSnapshot,
    expectedPartnerResult: input.expectedPartnerResult,
    now: Date.now(),
  })
  saveInvitation(invitation)
  addMyInviteToken(token)
  return { token, expiresAt: invitation.expiresAt }
}

export async function getInvite(token: string): Promise<Invitation> {
  if (!token) throw new BackendError('INVITE_NOT_FOUND', '邀请不存在')
  if (cloudAvailable()) {
    const res = await callCloud<{ invitation: Invitation }>('getInvite', { token })
    return res.invitation
  }
  const invitation = getInvitation(token)
  if (!invitation) throw new BackendError('INVITE_NOT_FOUND', '这个邀请不存在或已被清理')
  if (isExpired(invitation, Date.now())) throw new BackendError('INVITE_EXPIRED', '这个邀请已经过期了')
  return invitation
}

export async function completeInvite(token: string, inviteeSnapshot: ResultSnapshot): Promise<Relationship> {
  if (!token) throw new BackendError('INVITE_NOT_FOUND', '邀请不存在')
  if (cloudAvailable()) {
    const res = await callCloud<{ relationship: Relationship }>('completeInvite', {
      token,
      inviteeResultSnapshot: inviteeSnapshot,
    })
    addMyInviteToken(token)
    return res.relationship
  }
  const invitation = getInvitation(token)
  if (!invitation) throw new BackendError('INVITE_NOT_FOUND', '这个邀请不存在或已被清理')
  if (isExpired(invitation, Date.now())) throw new BackendError('INVITE_EXPIRED', '这个邀请已经过期了')
  if (invitation.status === 'completed') {
    const existing = getRelationshipRecord(token)
    if (existing) return existing
    throw new BackendError('INVITE_ALREADY_COMPLETED', '这个邀请已经完成过了')
  }

  const relationship = buildRelationshipRecord(invitation, inviteeSnapshot, Date.now())
  saveInvitation({ ...invitation, status: 'completed' })
  saveRelationship(relationship)
  addMyInviteToken(token)
  return relationship
}

export async function fetchRelationship(token: string): Promise<Relationship> {
  if (!token) throw new BackendError('INVITE_NOT_FOUND', '邀请不存在')
  if (cloudAvailable()) {
    const res = await callCloud<{ relationship: Relationship }>('getRelationship', { token })
    return res.relationship
  }
  const relationship = getRelationshipRecord(token)
  if (!relationship) throw new BackendError('INVITE_NOT_FOUND', '还没有生成关系报告')
  return relationship
}
