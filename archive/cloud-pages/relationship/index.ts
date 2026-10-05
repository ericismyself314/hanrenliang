import { DISCLAIMER } from '../../config/content'
import { avatarAssetPath } from '../../config/avatarAssets'
import { getRelationshipRule } from '../../config/relationships'
import { getResult } from '../../config/results'
import { track } from '../../utils/analytics'
import { BackendError, fetchRelationship } from '../../utils/backend'
import { RelationshipSummary, buildRelationship } from '../../utils/matching'
import { PAGE, relationshipShareMessage, SHARE_IMAGE_PATH } from '../../utils/share'

type RelationshipData = {
  loading: boolean
  errorMessage: string
  token: string
  inviterTitle: string
  inviterScore: number
  inviteeTitle: string
  inviteeScore: number
  relationshipName: string
  verdict: string
  compatibilityScore: number
  sharedStrengths: string[]
  sharedGaps: string[]
  disclaimer: string
  timelineText: string
  shareStatus: string
  inviterAvatarPath: string
  inviteeAvatarPath: string
}

Page({
  data: {
    loading: true,
    errorMessage: '',
    token: '',
    inviterTitle: '',
    inviterScore: 0,
    inviteeTitle: '',
    inviteeScore: 0,
    relationshipName: '',
    verdict: '',
    compatibilityScore: 0,
    sharedStrengths: [] as string[],
    sharedGaps: [] as string[],
    disclaimer: DISCLAIMER,
    timelineText: '',
    shareStatus: '',
    inviterAvatarPath: '',
    inviteeAvatarPath: '',
  } as RelationshipData,

  onLoad(options: Record<string, string | undefined>) {
    const token = options.token || ''
    if (typeof wx.showShareMenu === 'function') {
      wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })
    }
    this.setData({ token })
    track('page_view', { source: 'relationship', inviteToken: token })
    this.load(token)
  },

  load(token: string) {
    if (!token) {
      this.setData({ loading: false, errorMessage: '缺少邀请编号，无法找到这份关系报告' })
      return
    }
    this.setData({ loading: true, errorMessage: '' })
    fetchRelationship(token)
      .then((relationship) => {
        const inviter = relationship.inviterResultSnapshot
        const invitee = relationship.inviteeResultSnapshot
        const summary: RelationshipSummary = buildRelationship(
          { humanScore: inviter.humanScore, dimensionScores: inviter.dimensionScores },
          { humanScore: invitee.humanScore, dimensionScores: invitee.dimensionScores },
        )
        const rule = getRelationshipRule(relationship.relationshipType)
        const inviterDef = getResult(inviter.resultId)
        const inviteeDef = getResult(invitee.resultId)
        this.setData({
          loading: false,
          inviterTitle: inviterDef ? inviterDef.title : inviter.title,
          inviterScore: inviter.humanScore,
          inviteeTitle: inviteeDef ? inviteeDef.title : invitee.title,
          inviteeScore: invitee.humanScore,
          relationshipName: rule ? rule.name : summary.relationshipType,
          verdict: rule ? rule.verdict : summary.verdict,
          compatibilityScore: relationship.compatibilityScore,
          sharedStrengths: summary.sharedStrengths,
          sharedGaps: summary.sharedGaps,
          timelineText: `我们是${rule ? rule.name : summary.relationshipType}，好友玩法分${relationship.compatibilityScore}`,
          shareStatus: '',
          inviterAvatarPath: avatarAssetPath(inviter.resultId),
          inviteeAvatarPath: avatarAssetPath(invitee.resultId),
        })
        track('relationship_view', { source: 'relationship', inviteToken: token })
      })
      .catch((err: BackendError) => {
        this.setData({ loading: false, errorMessage: err.message || '关系报告加载失败' })
      })
  },

  retry() {
    this.load(this.data.token)
  },

  goInvite() {
    wx.navigateTo({ url: PAGE.invite })
  },

  copyTimeline() {
    if (!this.data.timelineText) return
    wx.setClipboardData({
      data: this.data.timelineText,
      success: () => {
        this.setData({ shareStatus: '朋友圈文案已复制，打开朋友圈粘贴即可' })
        wx.showToast({ title: '已复制', icon: 'success' })
      },
    })
  },

  onShareAppMessage() {
    track('share_relationship', { source: 'relationship', inviteToken: this.data.token })
    return relationshipShareMessage(this.data.relationshipName, this.data.compatibilityScore, this.data.token)
  },

  onShareTimeline() {
    return {
      title: `我们是${this.data.relationshipName}，好友玩法分${this.data.compatibilityScore}`,
      query: `token=${encodeURIComponent(this.data.token)}`,
      imageUrl: SHARE_IMAGE_PATH,
    }
  },
})
