import { PAGE, SHARE_IMAGE_PATH } from '../../utils/share'

// 兼容旧版本分享路径，直接进入独立测试。
Page({
  data: {},
  onLoad() { wx.reLaunch({ url: PAGE.index }) },
  goHome() { wx.reLaunch({ url: PAGE.index }) },
  onShareAppMessage() { return { title: '看看你有多像人，测测你的含人量', path: PAGE.index, imageUrl: SHARE_IMAGE_PATH } },
})
