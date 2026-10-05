const cloud = require('wx-server-sdk')
const { pickRelationship, calcFriendScore } = require('./matching')
const { validateSnapshot } = require('./resultValidation')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function fail(code, message) {
  return { ok: false, code, message }
}

/**
 * 被邀请人完成测试后调用。
 * 只接收结果快照，不接收完整答题答案；关系以双方快照计算，结果对两人一致。
 */
exports.main = async (event = {}) => {
  const token = String(event.token || '')
  const inviteeSnapshot = event.inviteeResultSnapshot
  if (!token) return fail('INVITE_NOT_FOUND', '邀请不存在')
  if (!inviteeSnapshot || !inviteeSnapshot.resultId) return fail('INVALID_ARGUMENT', '缺少被邀请人结果快照')
  const inviteeError = validateSnapshot(inviteeSnapshot, '被邀请人结果快照')
  if (inviteeError) return fail('INVALID_ARGUMENT', inviteeError)

  const res = await db
    .collection('invitations')
    .where({ token })
    .limit(1)
    .get()
  const invitation = res.data && res.data[0]
  if (!invitation) return fail('INVITE_NOT_FOUND', '这个邀请不存在或已被清理')
  if (invitation.expiresAt < Date.now()) return fail('INVITE_EXPIRED', '这个邀请已经过期了')

  const inviterError = validateSnapshot(invitation.inviterResultSnapshot, '邀请者结果快照')
  if (inviterError) return fail('INVALID_ARGUMENT', inviterError)
  const invitationVersion = invitation.contentVersion || invitation.inviterResultSnapshot.contentVersion
  if (invitationVersion !== invitation.inviterResultSnapshot.contentVersion || inviteeSnapshot.contentVersion !== invitationVersion) {
    return fail('INVALID_ARGUMENT', '邀请内容版本不一致，请重新生成邀请')
  }

  const existing = await db
    .collection('relationships')
    .where({ invitationToken: token })
    .limit(1)
    .get()
  if (existing.data && existing.data[0]) {
    return { ok: true, relationship: existing.data[0], duplicated: true }
  }

  if (invitation.status !== 'pending') {
    return fail('INVITE_ALREADY_COMPLETED', '这个邀请正在生成或已经完成，可以直接查看双人报告')
  }

  // 先用带状态条件的更新占位，保证并发请求只有一个能进入生成区段。
  const claim = await db
    .collection('invitations')
    .where({ token, status: 'pending' })
    .update({ data: { status: 'processing' } })
  if (!claim.stats || claim.stats.updated !== 1) {
    return fail('INVITE_ALREADY_COMPLETED', '这个邀请正在生成或已经完成，可以直接查看双人报告')
  }

  const inviter = { humanScore: invitation.inviterResultSnapshot.humanScore, dimensionScores: invitation.inviterResultSnapshot.dimensionScores }
  const invitee = { humanScore: inviteeSnapshot.humanScore, dimensionScores: inviteeSnapshot.dimensionScores }
  const picked = pickRelationship(inviter, invitee)

  const relationship = {
    invitationToken: token,
    inviterResultSnapshot: invitation.inviterResultSnapshot,
    inviteeResultSnapshot: inviteeSnapshot,
    compatibilityScore: calcFriendScore(inviter.dimensionScores, invitee.dimensionScores),
    relationshipType: picked.ruleId,
    createdAt: Date.now(),
  }

  try {
    await db.collection('relationships').add({ data: relationship })
    await db
      .collection('invitations')
      .where({ token, status: 'processing' })
      .update({ data: { status: 'completed' } })
  } catch (error) {
    // 关系写入失败时释放占位，允许用户重试。
    await db.collection('invitations').where({ token, status: 'processing' }).update({ data: { status: 'pending' } }).catch(() => {})
    throw error
  }

  return { ok: true, relationship }
}
