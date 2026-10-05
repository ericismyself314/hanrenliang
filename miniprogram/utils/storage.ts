import { CONTENT_VERSION } from '../config/content'
import { Invitation, Relationship, TestResult } from './types'

const PREFIX = 'hanrenliang:'
const K_ANSWERS = `${PREFIX}answers`
const K_RESULT = `${PREFIX}result`
const K_ANON = `${PREFIX}anonymousId`
const K_INVITES = `${PREFIX}invites`
const K_RELATIONS = `${PREFIX}relationships`
const K_MY_TOKENS = `${PREFIX}myTokens`

export const PERSONAL_ANSWER_SCOPE = 'personal'

function answerKey(scope: string = PERSONAL_ANSWER_SCOPE): string {
  return scope === PERSONAL_ANSWER_SCOPE ? K_ANSWERS : `${K_ANSWERS}:${scope}`
}

function read<T>(key: string, fallback: T): T {
  try {
    const value = wx.getStorageSync(key)
    return value === '' || value === undefined || value === null ? fallback : (value as T)
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    wx.setStorageSync(key, value)
  } catch {
    // 存储失败不阻塞主流程
  }
}

/* ---------- 答题进度 ---------- */

export function getAnswers(scope: string = PERSONAL_ANSWER_SCOPE): string[] {
  return read<string[]>(answerKey(scope), [])
}

export function saveAnswers(answerIds: string[], scope: string = PERSONAL_ANSWER_SCOPE): void {
  write(answerKey(scope), answerIds)
}

export function clearAnswers(scope: string = PERSONAL_ANSWER_SCOPE): void {
  write(answerKey(scope), [])
}

/* ---------- 个人结果 ---------- */

export function getResult(): TestResult | null {
  const result = read<TestResult | null>(K_RESULT, null)
  if (result && result.contentVersion !== CONTENT_VERSION) return null
  return result
}

export function saveResult(result: TestResult): void {
  write(K_RESULT, result)
}

export function clearResult(): void {
  try {
    wx.removeStorageSync(K_RESULT)
    wx.removeStorageSync(answerKey(PERSONAL_ANSWER_SCOPE))
  } catch {
    // ignore
  }
}

/* ---------- 匿名分析 ID ---------- */

export function getAnonymousId(): string {
  let id = read<string>(K_ANON, '')
  if (!id) {
    id = `a${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`
    write(K_ANON, id)
  }
  return id
}

/* ---------- 本地降级后端 ---------- */

export function saveInvitation(invitation: Invitation): void {
  const all = read<Record<string, Invitation>>(K_INVITES, {})
  all[invitation.token] = invitation
  write(K_INVITES, all)
}

export function getInvitation(token: string): Invitation | undefined {
  return read<Record<string, Invitation>>(K_INVITES, {})[token]
}

export function saveRelationship(relationship: Relationship): void {
  const all = read<Record<string, Relationship>>(K_RELATIONS, {})
  all[relationship.invitationToken] = relationship
  write(K_RELATIONS, all)
}

export function getRelationshipRecord(token: string): Relationship | undefined {
  return read<Record<string, Relationship>>(K_RELATIONS, {})[token]
}

/* ---------- 我发出的邀请 ---------- */

export function addMyInviteToken(token: string): void {
  const list = read<string[]>(K_MY_TOKENS, [])
  if (list.indexOf(token) < 0) list.push(token)
  write(K_MY_TOKENS, list)
}

export function getMyInviteTokens(): string[] {
  return read<string[]>(K_MY_TOKENS, [])
}
