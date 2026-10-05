import { AvatarAccessory, AvatarStyle, getAvatarStyle } from '../config/avatars'

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner: number): void {
  ctx.beginPath()
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
}

function drawAccessory(ctx: CanvasRenderingContext2D, accessory: AvatarAccessory, accent: string): void {
  ctx.strokeStyle = accent
  ctx.fillStyle = accent
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  switch (accessory) {
    case 'blanket':
      ctx.fillStyle = accent
      roundedRect(ctx, 45, 123, 32, 42, 8)
      ctx.fill()
      break
    case 'ghost':
      ctx.beginPath(); ctx.arc(157, 52, 14, Math.PI, 0); ctx.lineTo(171, 70); ctx.lineTo(157, 65); ctx.lineTo(143, 70); ctx.closePath(); ctx.fill(); break
    case 'planner':
    case 'paper':
      roundedRect(ctx, 137, 112, 27, 35, 4); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(143, 120, 15, 2); ctx.fillRect(143, 127, 11, 2); break
    case 'route':
    case 'map':
      ctx.beginPath(); ctx.moveTo(140, 117); ctx.lineTo(164, 111); ctx.lineTo(166, 145); ctx.lineTo(142, 151); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(151, 114); ctx.lineTo(153, 148); ctx.stroke(); break
    case 'mute':
      ctx.beginPath(); ctx.moveTo(142, 126); ctx.lineTo(162, 126); ctx.moveTo(142, 136); ctx.lineTo(162, 136); ctx.stroke(); break
    case 'robot':
      roundedRect(ctx, 139, 112, 26, 24, 5); ctx.stroke(); ctx.beginPath(); ctx.arc(147, 123, 2, 0, Math.PI * 2); ctx.arc(157, 123, 2, 0, Math.PI * 2); ctx.fill(); break
    case 'barrier':
      ctx.beginPath(); ctx.moveTo(136, 145); ctx.lineTo(166, 115); ctx.stroke(); ctx.beginPath(); ctx.moveTo(136, 115); ctx.lineTo(166, 145); ctx.stroke(); break
    case 'phone':
      roundedRect(ctx, 139, 114, 20, 34, 5); ctx.stroke(); ctx.beginPath(); ctx.arc(149, 142, 1.5, 0, Math.PI * 2); ctx.fill(); break
    case 'dice':
      roundedRect(ctx, 140, 118, 26, 26, 6); ctx.fillStyle = '#ffffff'; ctx.fillRect(147, 125, 4, 4); ctx.fillRect(155, 133, 4, 4); break
    case 'spark':
      drawStar(ctx, 151, 128, 17, 7); break
    case 'camera':
      roundedRect(ctx, 137, 120, 31, 21, 5); ctx.stroke(); ctx.beginPath(); ctx.arc(153, 130, 6, 0, Math.PI * 2); ctx.stroke(); break
    case 'plant':
      ctx.beginPath(); ctx.moveTo(151, 145); ctx.lineTo(151, 119); ctx.stroke(); ctx.beginPath(); ctx.arc(145, 119, 8, 0.2, Math.PI); ctx.arc(158, 125, 8, Math.PI, 5.8); ctx.stroke(); break
    case 'coffee':
      roundedRect(ctx, 139, 120, 23, 22, 5); ctx.stroke(); ctx.beginPath(); ctx.arc(164, 130, 7, -Math.PI / 2, Math.PI / 2); ctx.stroke(); break
    case 'compass':
    case 'clock':
      ctx.beginPath(); ctx.arc(151, 130, 15, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(151, 130); ctx.lineTo(159, 122); ctx.moveTo(151, 130); ctx.lineTo(146, 137); ctx.stroke(); break
    case 'star':
      drawStar(ctx, 151, 128, 16, 7); break
    case 'headphones':
      ctx.beginPath(); ctx.arc(151, 126, 18, Math.PI, 0); ctx.stroke(); ctx.fillRect(132, 126, 7, 16); ctx.fillRect(163, 126, 7, 16); break
    case 'cap':
      ctx.beginPath(); ctx.moveTo(135, 117); ctx.lineTo(166, 117); ctx.lineTo(152, 108); ctx.closePath(); ctx.fill(); ctx.fillRect(149, 117, 20, 5); break
    case 'flag':
      ctx.beginPath(); ctx.moveTo(145, 148); ctx.lineTo(145, 112); ctx.stroke(); ctx.beginPath(); ctx.moveTo(146, 114); ctx.lineTo(167, 120); ctx.lineTo(146, 128); ctx.closePath(); ctx.fill(); break
    case 'moon':
      ctx.beginPath(); ctx.arc(151, 127, 16, 0.6, Math.PI * 1.75); ctx.stroke(); break
    case 'rainbow':
      ctx.beginPath(); ctx.arc(151, 139, 22, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(151, 139, 14, Math.PI, 0); ctx.stroke(); break
    case 'pin':
      ctx.beginPath(); ctx.arc(151, 123, 10, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(143, 129); ctx.lineTo(151, 147); ctx.lineTo(159, 129); ctx.closePath(); ctx.fill(); break
  }
}

/** 绘制统一风格的物种专属小人，供结果页、关系页和海报复用。 */
export function drawAvatarOn(ctx: CanvasRenderingContext2D, size: number, style: AvatarStyle): void {
  const scale = size / 200
  ctx.save()
  ctx.clearRect(0, 0, size, size)
  ctx.scale(scale, scale)
  ctx.lineJoin = 'round'

  ctx.fillStyle = style.background
  ctx.beginPath(); ctx.arc(100, 100, 94, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(22,35,61,0.12)'
  ctx.beginPath(); ctx.ellipse(100, 170, 48, 9, 0, 0, Math.PI * 2); ctx.fill()

  const shift = style.pose === 1 ? -4 : style.pose === 2 ? 4 : 0
  ctx.fillStyle = style.shirt
  roundedRect(ctx, 64 + shift, 104, 72, 62, 22); ctx.fill()
  ctx.fillStyle = style.skin
  ctx.fillRect(78 + shift, 158, 14, 25); ctx.fillRect(108 + shift, 158, 14, 25)
  ctx.fillStyle = style.shirt
  ctx.fillRect(75 + shift, 179, 20, 5); ctx.fillRect(105 + shift, 179, 20, 5)

  ctx.fillStyle = style.skin
  ctx.beginPath(); ctx.arc(100 + shift, 78, 33, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = style.hair
  ctx.beginPath(); ctx.arc(100 + shift, 73, 34, Math.PI, Math.PI * 2); ctx.lineTo(129 + shift, 78); ctx.quadraticCurveTo(121 + shift, 54, 100 + shift, 48); ctx.quadraticCurveTo(77 + shift, 53, 70 + shift, 77); ctx.closePath(); ctx.fill()
  ctx.fillStyle = '#16233d'
  ctx.beginPath(); ctx.arc(89 + shift, 82, 2.7, 0, Math.PI * 2); ctx.arc(111 + shift, 82, 2.7, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = '#16233d'; ctx.lineWidth = 2.5
  ctx.beginPath(); ctx.arc(100 + shift, 88, 8, 0.15, Math.PI - 0.15); ctx.stroke()

  drawAccessory(ctx, style.accessory, style.accent)
  ctx.restore()
}

export function avatarStyleFor(resultId: string): AvatarStyle {
  return getAvatarStyle(resultId)
}
