const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function fail(code, message) {
  return { ok: false, code, message }
}

exports.main = async (event = {}) => {
  const token = String(event.token || '')
  if (!token) return fail('INVITE_NOT_FOUND', '邀请不存在')

  const res = await db
    .collection('relationships')
    .where({ invitationToken: token })
    .limit(1)
    .get()

  const relationship = res.data && res.data[0]
  if (!relationship) return fail('INVITE_NOT_FOUND', '还没有生成关系报告，等对方测完就有了')

  return { ok: true, relationship }
}
