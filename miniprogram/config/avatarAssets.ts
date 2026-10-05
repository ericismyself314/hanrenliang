/**
 * 每个物种对应的原创透明底角色图。
 * 资源在小程序和 demo 中保持同名，页面只根据 resultId 取图，避免维护两套路由。
 */
export function avatarAssetPath(resultId: string): string {
  return `/assets/avatars/${resultId}.png`
}
