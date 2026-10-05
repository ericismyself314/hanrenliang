import { PAGE, SHARE_IMAGE_PATH } from '../../utils/share'

// 保留旧链接的落地页，不再读取关系数据。
Page({
  data: {},
  onLoad() { wx.reLaunch({ url: PAGE.index }) },
  goHome() { wx.reLaunch({ url: PAGE.index }) },
  onShareAppMessage() { return { title: '看看你有多像人，测测你的含人量', path: PAGE.index, imageUrl: SHARE_IMAGE_PATH } },
})
