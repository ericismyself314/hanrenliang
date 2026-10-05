import { DISCLAIMER } from '../../config/content'
import { DIMENSIONS, DimensionCode } from '../../config/dimensions'
import {
  BRAND_STRIP,
  INDEX_LABEL,
  RESULT_PROMPT,
  ResultDefinition,
  getResult,
} from '../../config/results'
import { avatarAssetPath } from '../../config/avatarAssets'
import { track } from '../../utils/analytics'
import { dimensionViews } from '../../utils/result'
import { DimensionScores } from '../../utils/types'
import { PAGE, fillTemplate, personalShareMessage, SHARE_IMAGE_PATH, timelineShareText } from '../../utils/share'
import { clearAnswers, getResult as getLocalResult } from '../../utils/storage'
import { buildTimelineCard } from '../../utils/timelineCard'
import { buildResultCard } from '../../utils/resultCardCanvas'

type DimensionView = {
  code: DimensionCode
  name: string
  shortName: string
  score: number
}

type ResultPageData = {
  ready: boolean
  score: number
  bandStatus: string
  title: string
  verdict: string
  /** 完整人物分析，结算页正文 */
  portrait: string
  humanSide: string
  offlineSignal: string
  bestPartner: string
  dimensions: DimensionView[]
  keyDimension: string
  indexLabel: string
  brandWord: string
  brandEn: string
  promptText: string
  timelineText: string
  disclaimer: string
  myToken: string
  shareStatus: string
  avatarPath: string
}

Page({
  data: {
    ready: false,
    sharedMode: false,
    score: 0,
    bandStatus: '',
    title: '',
    verdict: '',
    portrait: '',
    humanSide: '',
    offlineSignal: '',
    bestPartner: '',
    dimensions: [] as DimensionView[],
    keyDimension: '',
    indexLabel: INDEX_LABEL,
    brandWord: BRAND_STRIP.split(' · ')[0],
    brandEn: BRAND_STRIP.split(' · ')[1] || 'HUMAN INDEX',
    promptText: '',
    timelineText: '',
    disclaimer: DISCLAIMER,
    myToken: '',
    shareStatus: '',
    avatarPath: '',
    avatarFailed: false,
    previewAvatarFailed: false,
    showTimelineGuide: false,
    sharingImage: false,
    timelinePreviewPath: '',
    timelinePreviewState: 'preparing',
  },

  definition: undefined as ResultDefinition | undefined,

  pendingScores: undefined as DimensionScores | undefined,
  shareCardPath: '',
  shareCardJob: undefined as Promise<string> | undefined,
  timelineCardPath: '',
  timelineCardJob: undefined as Promise<string> | undefined,
  disposed: false,

  onLoad(options: Record<string, string | undefined>) {
    const sharedResultId = options.result || ''
    const sharedScore = Number(options.score)
    const sharedDef = getResult(sharedResultId)
    if (sharedDef && options.score !== undefined && Number.isInteger(sharedScore) && sharedScore >= 0 && sharedScore <= 100 && Math.min(3, Math.floor(sharedScore / 25)) === sharedDef.band) {
      // 朋友圈单页直接展示公开结果，不依赖跳转权限或接收者的本机存档。
      this.definition = sharedDef
      this.setData({ ready: true, sharedMode: true, score: sharedScore, title: sharedDef.title, avatarPath: avatarAssetPath(sharedDef.id), timelineText: timelineShareText(sharedDef, sharedScore) })
      return
    }
    if (typeof wx.showShareMenu === 'function') {
      wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })
    }
    const result = getLocalResult()
    if (!result) {
      this.setData({ ready: false })
      return
    }
    const def = getResult(result.resultId)
    if (!def) {
      this.setData({ ready: false })
      return
    }
    this.definition = def
    this.setData({
      ready: true,
      score: result.humanScore,
      bandStatus: this.bandStatusOf(result.band),
      title: def.title,
      verdict: def.verdict,
      portrait: def.portrait,
      humanSide: def.humanSide,
      offlineSignal: def.offlineSignal,
      bestPartner: def.bestPartner,
      dimensions: dimensionViews(result.dimensionScores),
      keyDimension: result.keyDimension,
      promptText: fillTemplate(RESULT_PROMPT, { partner: def.bestPartner }),
      timelineText: timelineShareText(def, result.humanScore),
      shareStatus: '',
      avatarPath: avatarAssetPath(result.resultId),
    })
    track('result_view', { source: 'result', value: result.humanScore })
    // 六维图始终属于结果正文，在页面完成首屏布局后绘制。
    this.pendingScores = result.dimensionScores
  },

  onReady() {
    if (this.pendingScores) this.drawRadar(this.pendingScores)
    wx.nextTick(() => {
      if (!this.definition || this.disposed) return
      void this.prepareShareCard()
      void this.prepareTimelineCard()
    })
  },

  prepareShareCard(): Promise<string> {
    if (this.shareCardJob) return this.shareCardJob
    const def = this.definition
    if (!def) return Promise.resolve(SHARE_IMAGE_PATH)
    this.shareCardJob = buildResultCard(def, this.data.score, this, false).then((path) => {
      this.shareCardPath = path || SHARE_IMAGE_PATH
      return this.shareCardPath
    })
    return this.shareCardJob
  },

  prepareTimelineCard(): Promise<string> {
    if (this.timelineCardPath) return Promise.resolve(this.timelineCardPath)
    if (this.timelineCardJob) return this.timelineCardJob
    const def = this.definition
    if (!def) return Promise.resolve('')
    this.timelineCardJob = buildTimelineCard(def, this.data.score, this).then((path: string) => {
      this.timelineCardPath = path
      this.timelineCardJob = undefined
      if (!this.disposed) {
        this.setData({
          timelinePreviewPath: path,
          timelinePreviewState: path ? 'ready' : 'failed',
        })
      }
      return path
    })
    return this.timelineCardJob
  },

  shareTimeline() {
    if (this.data.sharingImage || !this.definition || this.disposed) return
    // 3.8.2 起图片面板支持朋友圈；旧版保留可点击的页面分享入口。
    let version = ''
    try {
      const api = wx as typeof wx & { getAppBaseInfo?: () => { SDKVersion: string } }
      version = typeof api.getAppBaseInfo === 'function' ? api.getAppBaseInfo().SDKVersion : wx.getSystemInfoSync().SDKVersion
    } catch { /* 无法确认版本时使用页面分享引导 */ }
    const [major, minor, patch] = version.split('.').map(Number)
    const supported = major > 3 || (major === 3 && (minor > 8 || (minor === 8 && patch >= 2)))
    if (typeof wx.showShareImageMenu !== 'function' || !supported) {
      this.showTimelineFallback('当前微信请用右上角 ··· 分享，或更新微信后再试。')
      return
    }

    // 图片应在页面展示期间预先生成。若用户点得太快，先完成绘制并提示再次点击；
    // 图片已就绪时则在这次点击回调中同步调起微信面板，保留系统手势上下文。
    const imagePath = this.timelineCardPath
    if (!imagePath) {
      this.setData({ sharingImage: true, shareStatus: '', timelinePreviewState: 'preparing' })
      return this.prepareTimelineCard().then((path: string) => {
        if (this.disposed) return
        this.setData({
          sharingImage: false,
          shareStatus: path ? '图片已准备好，再点一次即可分享。' : '图片生成失败，请稍后重试。',
        })
      })
    }

    this.setData({ sharingImage: true, shareStatus: '', showTimelineGuide: false })
    try {
      wx.showShareImageMenu({
        path: imagePath,
        needShowEntrance: true,
        entrancePath: personalShareMessage(this.definition, this.data.score).path,
        success: () => { if (!this.disposed) this.setData({ shareStatus: '' }) },
        fail: (error) => {
          if (this.disposed || /cancel/i.test(error.errMsg || '')) return
          this.showTimelineFallback('图片分享暂时不可用，可以从右上角分享测试页面。')
        },
        complete: () => { if (!this.disposed) this.setData({ sharingImage: false }) },
      })
    } catch {
      this.setData({ sharingImage: false })
      this.showTimelineFallback('请从右上角 ··· 分享测试页面。')
    }
  },

  showTimelineFallback(message: string) {
    this.setData({ shareStatus: message })
    this.shareTimelineLink()
  },

  shareTimelineLink() {
    this.setData({ showTimelineGuide: true })
    if (typeof wx.showShareMenu !== 'function') {
      this.setData({ shareStatus: '请在微信中使用右上角分享功能' })
      return
    }
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
      success: () => {},
      fail: () => this.setData({ shareStatus: '请点击右上角 ···，选择“分享到朋友圈”。' }),
    })
  },

  closeTimelineGuide() { this.setData({ showTimelineGuide: false }) },
  onUnload() { this.disposed = true },

  onTimelinePreviewError() {
    this.timelineCardPath = ''
    this.setData({ timelinePreviewPath: '', timelinePreviewState: 'failed' })
  },

  onAvatarError() {
    this.setData({ avatarFailed: true })
  },

  onPreviewAvatarError() { this.setData({ previewAvatarFailed: true }) },

  retryAvatar() {
    const def = this.definition
    if (!def) return
    this.setData({ avatarPath: '', avatarFailed: false, previewAvatarFailed: false }, () => this.setData({ avatarPath: avatarAssetPath(def.id) }))
  },

  bandStatusOf(band: number): string {
    return ['人类信号微弱', '低功耗运行', '本人基本在线', '高浓度活人'][band] || ''
  },

  /** 六维图：轻量线框雷达，150-250ms 内完成，无长时间动画 */
  drawRadar(scores: Record<DimensionCode, number>) {
    const query = wx.createSelectorQuery()
    query
      .select('#radar')
      .fields({ node: true, size: true })
      .exec((res: unknown) => {
        const info = (res as Array<{ node: { width: number; height: number; getContext: (t: string) => CanvasRenderingContext2D | null } | null; width: number; height: number }>)[0]
        if (!info || !info.node) return
        const canvas = info.node
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const dpr = wx.getSystemInfoSync().pixelRatio || 2
        const size = Math.min(info.width, info.height) || 260
        canvas.width = size * dpr
        canvas.height = size * dpr
        ctx.scale(dpr, dpr)
        ctx.clearRect(0, 0, size, size)

        const cx = size / 2
        const cy = size / 2
        const radius = size / 2 - 44
        const count = DIMENSIONS.length

        const pointAt = (i: number, ratio: number) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / count
          return { x: cx + Math.cos(angle) * radius * ratio, y: cy + Math.sin(angle) * radius * ratio }
        }

        ctx.lineWidth = 1
        ;[0.25, 0.5, 0.75, 1].forEach((ratio) => {
          ctx.beginPath()
          for (let i = 0; i < count; i += 1) {
            const p = pointAt(i, ratio)
            if (i === 0) ctx.moveTo(p.x, p.y)
            else ctx.lineTo(p.x, p.y)
          }
          ctx.closePath()
          ctx.strokeStyle = 'rgba(22,35,61,0.16)'
          ctx.stroke()
        })

        for (let i = 0; i < count; i += 1) {
          const p = pointAt(i, 1)
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.lineTo(p.x, p.y)
          ctx.strokeStyle = 'rgba(22,35,61,0.16)'
          ctx.stroke()
        }

        ctx.beginPath()
        DIMENSIONS.forEach((dim, i) => {
          const p = pointAt(i, Math.max(scores[dim.code], 2) / 100)
          if (i === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        })
        ctx.closePath()
        ctx.fillStyle = 'rgba(98,230,210,0.42)'
        ctx.fill()
        ctx.strokeStyle = '#16233d'
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.fillStyle = '#16233d'
        ctx.font = '11px -apple-system, "PingFang SC", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        DIMENSIONS.forEach((dim, i) => {
          const p = pointAt(i, 1.22)
          ctx.fillText(dim.shortName, p.x, p.y - 6)
          ctx.fillText(String(scores[dim.code]), p.x, p.y + 9)
        })
      })
  },

  goTest() {
    if (!this.data.sharedMode) clearAnswers()
    wx.navigateTo({ url: PAGE.test, fail: () => wx.showToast({ title: '点击下方“前往小程序”开始测试', icon: 'none' }) })
  },

  onShareAppMessage() {
    const def = this.definition
    track('share_personal', { source: 'result', value: this.data.score })
    return def
      ? {
          ...personalShareMessage(def, this.data.score),
          imageUrl: this.shareCardPath || SHARE_IMAGE_PATH,
          promise: this.prepareShareCard().then((imageUrl: string) => ({ ...personalShareMessage(def, this.data.score), imageUrl })),
        }
      : { title: '测测你的含人量', path: PAGE.index, imageUrl: SHARE_IMAGE_PATH }
  },

  onShareTimeline() {
    const def = this.definition
    return {
      title: this.data.timelineText,
      query: def ? `result=${encodeURIComponent(def.id)}&score=${this.data.score}` : '',
      imageUrl: this.shareCardPath || SHARE_IMAGE_PATH,
    }
  },
})
