import { getResult as getDefinition } from '../../config/results'
import { avatarAssetPath } from '../../config/avatarAssets'
import { PAGE, personalShareMessage, SHARE_IMAGE_PATH } from '../../utils/share'
import { getResult } from '../../utils/storage'

Page({
  data: {
    sharedMode: false,
    sharedScore: 0,
    sharedTitle: '',
    sharedAvatar: '',
    hasLocalResult: false,
    localScore: 0,
    localTitle: '',
  },
  onLoad(options: Record<string, string | undefined>) {
    const def = options.result ? getDefinition(options.result) : undefined
    const score = Number(options.score)
    if (def && options.score !== undefined && Number.isInteger(score) && score >= 0 && score <= 100 && Math.min(3, Math.floor(score / 25)) === def.band) {
      this.setData({ sharedMode: true, sharedScore: score, sharedTitle: def.title, sharedAvatar: avatarAssetPath(def.id) })
    }
    if (typeof wx.showShareMenu === 'function') wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })
    this.refreshLocalResult()
  },
  onShow() { this.refreshLocalResult() },
  refreshLocalResult() {
    const result = getResult()
    const def = result ? getDefinition(result.resultId) : undefined
    this.setData({ hasLocalResult: Boolean(result && def), localScore: result ? result.humanScore : 0, localTitle: def ? def.title : '' })
  },
  startTest() { wx.navigateTo({ url: PAGE.test, fail: () => wx.showToast({ title: '点击下方“前往小程序”开始测试', icon: 'none' }) }) },
  goMyResult() { wx.navigateTo({ url: PAGE.result }) },
  goAbout() { wx.navigateTo({ url: PAGE.about }) },
  onShareAppMessage() {
    const result = getResult()
    const def = result ? getDefinition(result.resultId) : undefined
    return def && result ? personalShareMessage(def, result.humanScore) : { title: '看看你有多像人，测测你的含人量', path: PAGE.index, imageUrl: SHARE_IMAGE_PATH }
  },
  onShareTimeline() {
    const result = getResult()
    const def = result ? getDefinition(result.resultId) : undefined
    return {
      title: def && result ? `我测出${result.humanScore}%含人量：「${def.title}」` : '看看你有多像人，测测你的含人量',
      query: def && result ? `result=${encodeURIComponent(def.id)}&score=${result.humanScore}` : '',
      imageUrl: SHARE_IMAGE_PATH,
    }
  },
})
