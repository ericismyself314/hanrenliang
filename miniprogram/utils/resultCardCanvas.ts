import { avatarAssetPath } from '../config/avatarAssets'
import { ResultDefinition } from '../config/results'
import { MINIPROGRAM_SEARCH_NAME } from '../config/sharing'

function canvasNode(id: string, page: WechatMiniprogram.Page.TrivialInstance): Promise<WechatMiniprogram.Canvas> {
  return new Promise((resolve, reject) => {
    wx.createSelectorQuery().in(page).select(`#${id}`).fields({ node: true, size: true }).exec((results) => {
      const node = results[0]?.node as WechatMiniprogram.Canvas | undefined
      if (node) resolve(node)
      else reject(new Error('结果画布尚未就绪'))
    })
  })
}

function imageFor(canvas: WechatMiniprogram.Canvas, src: string): Promise<WechatMiniprogram.Image> {
  return new Promise((resolve, reject) => {
    const image = canvas.createImage()
    const timer = setTimeout(() => reject(new Error('人物图片加载超时')), 8000)
    image.onload = () => { clearTimeout(timer); resolve(image) }
    image.onerror = () => { clearTimeout(timer); reject(new Error('人物图片加载失败')) }
    image.src = src
  })
}

/** 直接使用 Canvas 2D 的图片解码与节点导出，避免旧版原生画布层影响 iPhone 布局。 */
export async function buildResultCard(def: ResultDefinition, score: number, page: WechatMiniprogram.Page.TrivialInstance, portrait: boolean): Promise<string> {
  try {
    const canvas = await canvasNode(portrait ? 'timelineCard' : 'shareCard', page)
    const width = portrait ? 640 : 500
    const height = portrait ? 960 : 400
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const image = await imageFor(canvas, avatarAssetPath(def.id))
    ctx.fillStyle = '#f7f6f2'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#16233d'
    ctx.textAlign = portrait ? 'center' : 'left'
    const text = (value: string, size: number, x: number, y: number) => {
      ctx.font = `${size}px sans-serif`
      ctx.fillText(value, x, y)
    }
    const drawAvatar = (x: number, y: number, w: number, h: number) => {
      const scale = Math.min(w / image.width, h / image.height)
      const iw = image.width * scale
      const ih = image.height * scale
      ctx.drawImage(image as unknown as CanvasImageSource, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih)
    }
    if (portrait) {
      drawAvatar(110, 30, 420, 440)
      text('鉴定完毕，我是', 20, 320, 506)
      text(def.title, 42, 320, 558)
      text('含人量', 22, 320, 602)
      text(`${score}%`, 110, 320, 716)
      const verdict = Array.from(def.verdict)
      for (let i = 0; i < Math.min(3, Math.ceil(verdict.length / 22)); i++) {
        text(verdict.slice(i * 22, (i + 1) * 22).join(''), 23, 320, 765 + i * 29)
      }
      ctx.fillStyle = '#263e36'
      ctx.fillRect(0, 850, 640, 110)
      ctx.fillStyle = '#fffdf4'
      text('看看你有多像人', 28, 320, 897)
      text(`微信搜「${MINIPROGRAM_SEARCH_NAME}」`, 19, 320, 932)
    } else {
      text('我的含人量鉴定', 18, 30, 42)
      text(def.title, 28, 30, 90)
      text(`${score}%`, 74, 30, 192)
      text('含人量', 20, 34, 229)
      drawAvatar(260, 112, 220, 220)
      ctx.fillStyle = '#263e36'
      ctx.fillRect(0, 340, 500, 60)
      ctx.fillStyle = '#fffdf4'
      text('看看你有多像人 →', 22, 30, 379)
    }
    return await new Promise<string>((resolve) => {
      const timer = setTimeout(() => resolve(''), 8000)
      wx.canvasToTempFilePath({
        canvas, width, height, destWidth: width, destHeight: height, fileType: 'png',
        success: (res) => { clearTimeout(timer); resolve(res.tempFilePath) },
        fail: () => { clearTimeout(timer); resolve('') },
      }, page)
    })
  } catch { return '' }
}
