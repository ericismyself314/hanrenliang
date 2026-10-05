import { ALL_SPECIES, getResult } from '../../config/results'
import { track } from '../../utils/analytics'
import { BackendError, createInvite } from '../../utils/backend'
import { snapshotFromTestResult } from '../../utils/result'
import { PAGE, SHARE_IMAGE_PATH, invitePath, inviteShareText, timelineShareText } from '../../utils/share'
import { getResult as getLocalResult } from '../../utils/storage'

type InviteData = {
  ready: boolean
  alias: string
  speciesNames: string[]
  speciesIndex: number
  expectedResultId: string
  myTitle: string
  myScore: number
  token: string
  shareTitle: string
  shareText: string
  sharePath: string
  timelineText: string
  creating: boolean
  errorMessage: string
  shareStatus: string
}

Page({
  data: {
    ready: false,
    alias: '',
    speciesNames: ALL_SPECIES.map((s) => s.title),
    speciesIndex: 0,
    expectedResultId: ALL_SPECIES[0].id,
    myTitle: '',
    myScore: 0,
    token: '',
    shareTitle: '',
    shareText: '',
    sharePath: '',
    timelineText: '',
    creating: false,
    errorMessage: '',
    shareStatus: '',
  } as InviteData,

  onLoad(options: Record<string, string | undefined> = {}) {
    // 朋友圈分享会回到当前邀请页，先把邀请编号转交给首页统一加载邀请语境。
    const sharedToken = options.invite || ''
    if (sharedToken) {
      wx.redirectTo({ url: `${PAGE.index}?invite=${encodeURIComponent(sharedToken)}` })
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
    const defaultIndex = def ? Math.max(0, ALL_SPECIES.findIndex((s) => s.title === def.bestPartner)) : 0
    this.setData({
      ready: true,
      myTitle: def ? def.title : '',
      myScore: result.humanScore,
      speciesIndex: defaultIndex,
      expectedResultId: ALL_SPECIES[defaultIndex].id,
    })
    track('page_view', { source: 'invite' })
  },

  onAliasInput(e: WechatMiniprogram.Input) {
    this.setData({ alias: e.detail.value })
  },

  onSpeciesChange(e: WechatMiniprogram.PickerChange) {
    const index = Number(e.detail.value) || 0
    this.setData({ speciesIndex: index, expectedResultId: ALL_SPECIES[index].id })
  },

  create() {
    if (this.data.creating) return
    const result = getLocalResult()
    if (!result) {
      this.setData({ errorMessage: '还没有你的检测结果，先去测一次' })
      return
    }
    this.setData({ creating: true, errorMessage: '' })
    const alias = this.data.alias.trim() || '我'
    const expectedTitle = ALL_SPECIES[this.data.speciesIndex].title

    createInvite({
      inviterAlias: alias,
      inviterResultSnapshot: snapshotFromTestResult(result),
      expectedPartnerResult: this.data.expectedResultId,
    })
      .then((res) => {
        const def = getResult(result.resultId)
        const shareText = def ? inviteShareText(alias, def, expectedTitle) : `${alias}邀请你测一测含人量`
        this.setData({
          creating: false,
          token: res.token,
          shareTitle: `${alias}怀疑你是${expectedTitle}`,
          shareText,
          sharePath: invitePath(res.token),
          timelineText: def ? timelineShareText(def, result.humanScore) : '',
          shareStatus: '',
        })
        track('invite_created', { source: 'invite', inviteToken: res.token })
      })
      .catch((err: BackendError) => {
        this.setData({ creating: false, errorMessage: err.message || '邀请创建失败，请重试' })
      })
  },

  createAnother() {
    this.setData({ token: '', errorMessage: '' })
  },

  copyText() {
    wx.setClipboardData({
      data: this.data.shareText,
      success: () => {
        this.setData({ shareStatus: '邀请文案已复制' })
        wx.showToast({ title: '已复制', icon: 'success' })
      },
    })
  },

  copyTimeline() {
    wx.setClipboardData({
      data: this.data.timelineText,
      success: () => {
        this.setData({ shareStatus: '朋友圈文案已复制，打开朋友圈粘贴即可' })
        wx.showToast({ title: '已复制', icon: 'success' })
      },
    })
  },

  goRelationship() {
    wx.navigateTo({ url: `${PAGE.relationship}?token=${this.data.token}` })
  },

  goTest() {
    wx.navigateTo({ url: PAGE.test })
  },

  onShareAppMessage() {
    track('share_personal', { source: 'invite', inviteToken: this.data.token })
    return {
      title: this.data.shareTitle || '测测你的含人量',
      path: this.data.sharePath || PAGE.index,
      imageUrl: SHARE_IMAGE_PATH,
    }
  },

  onShareTimeline() {
    return {
      title: this.data.timelineText || '测测你的大学生活还剩多少含人量',
      query: this.data.token ? `invite=${this.data.token}` : '',
      imageUrl: SHARE_IMAGE_PATH,
    }
  },
})
