const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function fail(code, message) {
  return { ok: false, code, message }
}

/** 只返回邀请语境，不返回任何完整答题答案 */
exports.main = async (event = {}) => {
  const token = String(event.token || '')
  if (!token) return fail('INVITE_NOT_FOUND', '邀请不存在')

  const res = await db
    .collection('invitations')
    .where({ token })
    .limit(1)
    .get()

  const invitation = res.data && res.data[0]
  if (!invitation) return fail('INVITE_NOT_FOUND', '这个邀请不存在或已被清理')
  if (invitation.expiresAt < Date.now()) return fail('INVITE_EXPIRED', '这个邀请已经过期了')

  return {
    ok: true,
    invitation: {
      token: invitation.token,
      inviterAlias: invitation.inviterAlias,
      inviterResultSnapshot: invitation.inviterResultSnapshot,
      expectedPartnerResult: invitation.expectedPartnerResult,
      contentVersion: invitation.contentVersion || invitation.inviterResultSnapshot.contentVersion,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
      status: invitation.status,
    },
  }
}
