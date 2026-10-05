const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const { validateSnapshot, validateExpectedResult } = require('./resultValidation')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const TOKEN_CHARS = 'abcdefghijkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const TTL = 7 * 24 * 60 * 60 * 1000

/** 使用 crypto 生成不可预测的邀请 token */
function generateToken() {
  const bytes = crypto.randomBytes(24)
  let out = ''
  for (let i = 0; i < 24; i += 1) {
    out += TOKEN_CHARS[bytes[i] % TOKEN_CHARS.length]
  }
  return out
}

function fail(code, message) {
  return { ok: false, code, message }
}

exports.main = async (event = {}) => {
  const { inviterAlias, inviterResultSnapshot, expectedPartnerResult, contentVersion } = event
  if (!inviterResultSnapshot || !inviterResultSnapshot.resultId) {
    return fail('INVALID_ARGUMENT', '缺少邀请者结果快照')
  }
  const snapshotError = validateSnapshot(inviterResultSnapshot, '邀请者结果快照')
  if (snapshotError) return fail('INVALID_ARGUMENT', snapshotError)
  if (!validateExpectedResult(expectedPartnerResult || '')) {
    return fail('INVALID_ARGUMENT', '目标物种编号不正确')
  }
  if (typeof contentVersion !== 'string' || !contentVersion || contentVersion !== inviterResultSnapshot.contentVersion) {
    return fail('INVALID_ARGUMENT', '内容版本不一致，请刷新后重试')
  }
  if (typeof inviterAlias !== 'string' || inviterAlias.length > 20) {
    return fail('INVALID_ARGUMENT', '称呼不合法')
  }

  const now = Date.now()
  const token = generateToken()
  const invitation = {
    token,
    inviterAlias: inviterAlias || '神秘大学生',
    inviterResultSnapshot,
    expectedPartnerResult: expectedPartnerResult || '',
    contentVersion: contentVersion || '',
    createdAt: now,
    expiresAt: now + TTL,
    status: 'pending',
  }

  await db.collection('invitations').add({ data: invitation })
  return { ok: true, token, expiresAt: invitation.expiresAt }
}
