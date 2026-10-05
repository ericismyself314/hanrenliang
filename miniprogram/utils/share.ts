import { PRODUCT_NAME } from '../config/content'
import { BANDS, ResultDefinition, SHARE_TEMPLATES } from '../config/results'

export function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => String(vars[key] ?? ''))
}

/** 个人分享文案：包含百分比、称号和一个未完成的问题 */
export function personalShareText(result: ResultDefinition, humanScore: number): string {
  return fillTemplate(SHARE_TEMPLATES[0], { score: humanScore, title: result.title })
}

export function partnerWantedText(result: ResultDefinition): string {
  return fillTemplate(SHARE_TEMPLATES[1], { partner: result.bestPartner })
}

export function provokeText(result: ResultDefinition): string {
  return fillTemplate(SHARE_TEMPLATES[2], { title: result.title })
}

/** 发给好友的邀请文案 */
export function inviteShareText(alias: string, result: ResultDefinition, expectedPartnerTitle: string): string {
  return `${alias || '我'}测出「${result.title}」，猜你是「${expectedPartnerTitle}」。来测一下，看看咱俩是什么组合？`
}

/** 朋友圈文案 */
export function timelineShareText(result: ResultDefinition, humanScore: number): string {
  return personalShareText(result, humanScore)
}

export function bandStatus(band: number): string {
  return BANDS[band] ? BANDS[band].status : ''
}

/* ---------- 页面路径 ---------- */

export const PAGE = {
  index: '/pages/index/index',
  test: '/pages/test/index',
  result: '/pages/result/index',
  invite: '/pages/invite/index',
  relationship: '/pages/relationship/index',
  about: '/pages/about/index',
}

/** 好友卡片与朋友圈缩略图使用的统一品牌封面。 */
export const SHARE_IMAGE_PATH = '/assets/share-card.png'

export function invitePath(token: string): string {
  return `${PAGE.index}?invite=${encodeURIComponent(token)}`
}

export function relationshipPath(token: string): string {
  return `${PAGE.relationship}?token=${encodeURIComponent(token)}`
}

/** 分享给朋友时的卡片内容 */
export function personalShareMessage(result: ResultDefinition, humanScore: number, inviteToken?: string) {
  return {
    title: `我测出${humanScore}%含人量：「${result.title}」`,
    path: inviteToken
      ? invitePath(inviteToken)
      : `${PAGE.index}?result=${encodeURIComponent(result.id)}&score=${humanScore}`,
    imageUrl: SHARE_IMAGE_PATH,
  }
}

export function relationshipShareMessage(relationshipType: string, score: number, token: string) {
  return {
    title: `我们是${relationshipType}，好友玩法分${score}`,
    path: relationshipPath(token),
    imageUrl: SHARE_IMAGE_PATH,
  }
}

export const PRODUCT_TITLE = PRODUCT_NAME
