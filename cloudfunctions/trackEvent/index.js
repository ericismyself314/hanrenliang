const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const ALLOWED = [
  'page_view',
  'test_start',
  'question_answer',
  'test_complete',
  'result_view',
  'share_personal',
  'invite_created',
  'invite_opened',
  'invite_test_complete',
  'relationship_view',
  'share_relationship',
  'poster_saved',
]

/**
 * 匿名漏斗事件。
 * 只写入 anonymousId / 事件名 / 来源 / 邀请 token / 数值 / 内容版本 / 时间戳，
 * 不采集昵称、头像、手机号等身份信息。
 */
exports.main = async (event = {}) => {
  const e = event.event || {}
  if (ALLOWED.indexOf(e.eventName) < 0) return { ok: false, code: 'INVALID_ARGUMENT' }

  await db.collection('analytics_events').add({
    data: {
      anonymousId: String(e.anonymousId || '').slice(0, 40),
      eventName: e.eventName,
      source: String(e.source || '').slice(0, 40),
      inviteToken: String(e.inviteToken || '').slice(0, 40),
      value: typeof e.value === 'number' ? e.value : null,
      contentVersion: String(e.contentVersion || '').slice(0, 40),
      timestamp: e.timestamp || Date.now(),
    },
  })
  return { ok: true }
}
