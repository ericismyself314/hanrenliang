import { AnalyticsEventName } from './types'

export type EventPayload = {
  /** 事件来源页面或入口 */
  source?: string
  /** 关联邀请 token */
  inviteToken?: string
  /** 数值，例如含人量、题号 */
  value?: number
}

/**
 * 匿名漏斗埋点。
 * 只记录 anonymousId、事件名、来源、关联邀请 token、内容版本和时间戳，
 * 不采集微信昵称、头像、手机号等任何个人身份信息，也不伪造用户量统计。
 */
export function track(_eventName: AnalyticsEventName, _payload: EventPayload = {}): void {
  // 无云发布版：不生成统计标识，也不发送使用事件。
}
