import { DISCLAIMER, CONTENT_VERSION, PRODUCT_DEFINITION, PRODUCT_NAME } from '../../config/content'
import { DIMENSIONS } from '../../config/dimensions'
import { PAGE } from '../../utils/share'

// 部署自己的小程序时填写自己的备案号。
const FILING_NUMBER = ''
const FILING_QUERY_URL = 'https://beian.miit.gov.cn/'

type AboutData = {
  productName: string
  definition: string
  disclaimer: string
  version: string
  filingNumber: string
  dimensions: { code: string; name: string; measure: string }[]
}

Page({
  data: {
    productName: PRODUCT_NAME,
    definition: PRODUCT_DEFINITION,
    disclaimer: DISCLAIMER,
    version: CONTENT_VERSION,
    filingNumber: FILING_NUMBER,
    dimensions: DIMENSIONS.map((d) => ({ code: d.code, name: d.name, measure: d.measure })),
  } as AboutData,

  copyFilingQueryUrl() {
    wx.setClipboardData({
      data: FILING_QUERY_URL,
      success: () => wx.showToast({ title: '查询网址已复制', icon: 'success' }),
    })
  },

  goHome() {
    wx.reLaunch({ url: PAGE.index })
  },
})
