#!/usr/bin/env node
// 在隔离的微信替身中运行实际页面；任何云端或网络请求都会令检查失败。
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const ts = require('typescript')
const assert = require('node:assert/strict')
const root = path.resolve(__dirname, '..', 'miniprogram')

function device(imageFailure = false, exportFailure = false, sharing = {}) {
  const store = new Map()
  const routes = []
  const labels = []
  const images = []
  const imageMenus = []
  const loaded = new Map()
  let captured
  let cloudTouched = false
  const wx = {
    getStorageSync: (key) => store.get(key) || '',
    setStorageSync: (key, value) => store.set(key, value),
    removeStorageSync: (key) => store.delete(key),
    navigateTo: ({ url }) => routes.push(url),
    redirectTo: ({ url }) => routes.push(url),
    reLaunch: ({ url }) => routes.push(url),
    showShareMenu: (options) => options.success && options.success({}),
    showToast: () => {},
    nextTick: (callback) => callback(),
    createSelectorQuery: () => {
      let canvasId = ''
      const query = {
        in: () => query,
        select: (selector) => { canvasId = selector.slice(1); return query },
        fields: () => query,
        exec: (callback) => callback([{ node: {
          canvasId,
          getContext: () => ({
            fillRect: () => {},
            fillText: (text) => labels.push(text),
            drawImage: (image, x, y, width, height) => images.push({ src: image.source, width, height }),
          }),
          createImage: () => {
            const image = { width: 400, height: 600 }
            Object.defineProperty(image, 'src', { set(src) {
              assert(fs.existsSync(path.join(root, src)), '2D 画布的角色资源必须存在')
              image.source = src
              if (imageFailure) image.onerror({})
              else image.onload({})
            } })
            return image
          },
        } }]),
      }
      return query
    },
    getAppBaseInfo: () => ({ SDKVersion: sharing.version || '3.17.3' }),
    showShareImageMenu: (options) => {
      imageMenus.push(options)
      if (sharing.behavior === 'pending') return
      if (sharing.behavior === 'throw') throw Error('unsupported')
      if (sharing.behavior === 'cancel') options.fail({ errMsg: 'showShareImageMenu:fail cancel' })
      else if (sharing.behavior === 'fail') options.fail({ errMsg: 'showShareImageMenu:fail forbidden' })
      else options.success({})
      options.complete({})
    },
    getImageInfo: ({ src, success, fail }) => {
      assert(fs.existsSync(path.join(root, src)), '分享角色图片必须存在')
      if (imageFailure) fail({})
      else success({ path: src, width: 400, height: 600 })
    },
    createCanvasContext: () => ({
      setFillStyle: () => {}, fillRect: () => {}, setFontSize: () => {}, setTextAlign: () => {},
      fillText: (text) => labels.push(text),
      drawImage: (src, x, y, width, height) => images.push({ src, width, height }),
      draw: (_reserve, callback) => callback(),
    }),
    canvasToTempFilePath: ({ canvas, success, fail }) => exportFailure ? fail({}) : success({ tempFilePath: canvas.canvasId === 'timelineCard' ? '/tmp/timeline-card.png' : '/tmp/result-card.png' }),
    request: () => { throw Error('无云发布版不应发送网络请求') },
  }
  if (sharing.behavior === 'missing') delete wx.showShareImageMenu
  Object.defineProperty(wx, 'cloud', { get() { cloudTouched = true; throw Error('无云发布版不应访问 wx.cloud') } })
  const sandbox = vm.createContext({ wx, Page: (page) => { captured = page }, App: () => {}, setTimeout, clearTimeout, console })
  function load(file) {
    const absolute = path.isAbsolute(file) ? file : path.join(root, file)
    const resolved = absolute.endsWith('.ts') ? absolute : absolute + '.ts'
    if (loaded.has(resolved)) return loaded.get(resolved).exports
    const module = { exports: {} }
    loaded.set(resolved, module)
    const source = fs.readFileSync(resolved, 'utf8')
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
    const execute = vm.runInContext('(function(require,module,exports){' + code + '\n})', sandbox, { filename: resolved })
    execute((name) => load(path.resolve(path.dirname(resolved), name)), module, module.exports)
    return module.exports
  }
  function page(name) {
    captured = undefined
    load('pages/' + name + '/index.ts')
    const instance = { ...captured, data: { ...captured.data } }
    instance.setData = (data, callback) => { Object.assign(instance.data, data); if (callback) callback() }
    return instance
  }
  return { load, page, routes, store, labels, images, imageMenus, cloudTouched: () => cloudTouched }
}

async function main() {
  const sender = device()
  sender.load('app.ts')
  const { QUESTIONS } = sender.load('config/questions.ts')
  const test = sender.page('test')
  test.onLoad({ invite: 'obsolete-link' })
  test.answers = QUESTIONS.map((q) => q.options[0].id)
  test.finish()
  assert.equal(sender.routes.at(-1), '/pages/result/index', '即使携带旧邀请参数也应获得个人结果')
  const ownResult = sender.store.get('hanrenliang:result')
  assert(ownResult && Number.isInteger(ownResult.humanScore))
  const result = sender.page('result')
  result.onLoad({})
  assert(result.data.ready)
  assert(result.data.avatarPath.endsWith('.png'), '手机人物图使用兼容的 PNG')
  result.onAvatarError()
  assert(result.data.avatarFailed, '人物加载失败时显示可重试状态')
  result.retryAvatar()
  assert(!result.data.avatarFailed && result.data.avatarPath.endsWith('.png'), '人物图可以重试')
  await result.prepareTimelineCard()
  result.onTimelinePreviewError()
  assert.equal(result.data.timelinePreviewPath, '', '临时图片显示失败时应切回原生 IP 结果预览')
  assert.equal(result.timelineCardPath, '', '不能继续分享已无法加载的临时图片')
  await result.prepareTimelineCard()
  await result.shareTimeline()
  assert.equal(sender.imageMenus.length, 1, '新版微信从页面按钮直接调起图片分享面板')
  assert.equal(sender.imageMenus[0].path, '/tmp/timeline-card.png', '分享面板收到生成的竖版结果图')
  assert(sender.imageMenus[0].entrancePath.includes('result='), '图片发送好友时携带实际结果入口')
  assert(!result.data.showTimelineGuide && !result.data.sharingImage, '正常图片分享不强制显示右上角引导')
  assert.equal(result.data.shareStatus, '', '面板打开不能报告已发布朋友圈')
  result.shareTimelineLink()
  assert(result.data.showTimelineGuide, '仍可主动选择带链接的页面分享')
  result.closeTimelineGuide()
  assert(!result.data.showTimelineGuide, '朋友圈引导可以关闭')
  const message = result.onShareAppMessage()
  const card = await message.promise
  assert.equal(card.imageUrl, '/tmp/result-card.png')
  assert(sender.labels.includes(ownResult.humanScore + '%'), '卡片绘图必须包含实际含人量')
  assert(sender.labels.includes(result.data.title), '卡片绘图必须包含实际称号')
  assert(sender.images[0].src.includes(ownResult.resultId), '卡片必须使用对应人物')
  assert(Math.abs(sender.images[0].width / sender.images[0].height - 400 / 600) < 1e-8, '人物应保持原图比例')
  assert(!message.path.includes('invite='), '新分享不依赖邀请 token')
  const timeline = result.onShareTimeline()
  assert(timeline.query.includes('result='))
  assert.equal(timeline.imageUrl, card.imageUrl)

  const receiver = device()
  const home = receiver.page('index')
  const params = Object.fromEntries(new URLSearchParams(message.path.split('?')[1]))
  home.onLoad(params)
  assert(home.data.sharedMode && home.data.sharedScore === ownResult.humanScore)
  assert.equal(receiver.store.size, 0, '分享结果不得写成接收者的个人结果')
  const timelineDevice = device()
  const timelinePage = timelineDevice.page('result')
  timelinePage.onLoad(Object.fromEntries(new URLSearchParams(timeline.query)))
  assert(timelinePage.data.ready && timelinePage.data.sharedMode, '朋友圈直接进入结果页也能显示公开结果')
  assert.equal(timelineDevice.routes.length, 0, '朋友圈落地页不能依赖页面跳转才能显示结果')
  assert.equal(timelineDevice.store.size, 0, '朋友圈公开结果不写成本机存档')
  assert.equal(timelinePage.data.dimensions.length, 0, '不根据公开参数伪造朋友的六维')
  home.startTest()
  assert.equal(receiver.routes.at(-1), '/pages/test/index')
  const receiverTest = receiver.page('test')
  receiverTest.onLoad({})
  receiverTest.answers = QUESTIONS.map((q) => q.options[3].id)
  receiverTest.finish()
  assert.equal(receiver.routes.at(-1), '/pages/result/index')
  assert(receiver.store.has('hanrenliang:result'), '接收者能独立保存自己的结果')
  assert(!sender.cloudTouched() && !receiver.cloudTouched())

  for (const invalid of [{ result: 'B0-R', score: '100' }, { result: 'B2-F', score: '' }, { result: 'B2-F' }, { result: 'unknown', score: '60' }]) {
    const fresh = device().page('index')
    fresh.onLoad(invalid)
    assert(!fresh.data.sharedMode, '非法分享参数不应展示为朋友结果')
  }
  for (const route of ['invite', 'relationship']) {
    const legacy = device()
    legacy.page(route).onLoad({ token: 'old-token' })
    assert.equal(legacy.routes.at(-1), '/pages/index/index', '旧路径应可回到正常首页')
    assert(!legacy.cloudTouched())
  }
  for (const [imageFailure, exportFailure] of [[true, false], [false, true]]) {
    const failed = device(imageFailure, exportFailure)
    failed.store.set('hanrenliang:result', ownResult)
    const page = failed.page('result')
    page.onLoad({})
    const fallback = await page.onShareAppMessage().promise
    assert.equal(fallback.imageUrl, '/assets/share-card.png', '绘图失败应提供微信支持的 PNG 封面')
    assert(fallback.title.includes(ownResult.humanScore + '%'), '绘图失败仍保留实际含人量标题')
    await page.prepareTimelineCard()
    await page.shareTimeline()
    if (exportFailure || imageFailure) {
      assert.equal(failed.imageMenus.length, 0, '结果图导出失败不能假装有图片可分享')
      assert(page.data.timelinePreviewState === 'failed' && !page.data.sharingImage, '导出失败保留原生结果预览且允许重试')
    }
  }
  for (const behavior of ['cancel', 'fail', 'throw', 'missing']) {
    const mock = device(false, false, { behavior })
    mock.store.set('hanrenliang:result', ownResult)
    const page = mock.page('result')
    page.onLoad({})
    await page.prepareTimelineCard()
    await page.shareTimeline()
    assert(!page.data.sharingImage, '分享取消或异常后解除按钮锁定')
    assert.equal(page.data.showTimelineGuide, behavior !== 'cancel', '取消操作不弹失败引导，其余异常提供备用分享')
    assert(!mock.cloudTouched())
  }
  const old = device(false, false, { version: '3.8.1' })
  old.store.set('hanrenliang:result', ownResult)
  const oldPage = old.page('result')
  oldPage.onLoad({})
  await oldPage.shareTimeline()
  assert(!old.imageMenus.length && oldPage.data.showTimelineGuide, '旧版本不调起没有朋友圈选项的图片面板')
  const busy = device(false, false, { behavior: 'pending' })
  busy.store.set('hanrenliang:result', ownResult)
  const busyPage = busy.page('result')
  busyPage.onLoad({})
  await busyPage.prepareTimelineCard()
  await busyPage.shareTimeline()
  await busyPage.shareTimeline()
  assert.equal(busy.imageMenus.length, 1, '连续点击只打开一个分享面板')
  busy.imageMenus[0].complete({})
  const leaving = device()
  leaving.store.set('hanrenliang:result', ownResult)
  const leavingPage = leaving.page('result')
  leavingPage.onLoad({})
  const pendingShare = leavingPage.shareTimeline()
  leavingPage.onUnload()
  await pendingShare
  assert.equal(leaving.imageMenus.length, 0, '退出页面后不能突然打开分享面板')
  const { RESULTS } = sender.load('config/results.ts')
  for (const def of RESULTS) {
    const sample = device()
    const draw = sample.load('utils/timelineCard.ts').buildTimelineCard
    const imagePath = await draw(def, [12, 37, 62, 87][def.band], {})
    assert.equal(imagePath, '/tmp/timeline-card.png', '每个物种均能生成结果图片')
    assert(sample.labels.includes(def.title), '每种结果图使用自身称号')
    assert(sample.images[0].src.includes(def.id), '每种结果图使用自身角色')
    assert(!sample.labels.some((line) => line.includes('长按')), '没有真实小程序码时不能承诺长按识别')
  }
  for (const file of ['pages/index/index.wxml', 'pages/result/index.wxml', 'pages/test/index.wxml']) {
    assert(!/双人|关系报告|goInvite|共\s*24|24\s*种/.test(fs.readFileSync(path.join(root, file), 'utf8')), '用户页面不得遗留双人功能或结果总数')
  }
  const resultWxml = fs.readFileSync(path.join(root, 'pages/result/index.wxml'), 'utf8')
  assert(!resultWxml.includes('-9999'), '分享画布不得放到屏幕外造成横向溢出')
  const project = JSON.parse(fs.readFileSync(path.join(root, '..', 'project.config.json'), 'utf8'))
  assert(project.packOptions.ignore.some((entry) => entry.type === 'suffix' && entry.value === '.webp'), '原 WebP 不应重复打进上传包')
  console.log('无云发布检查通过：单人结果、跨设备分享回流、卡片绘图、绘图失败退回、旧路径兼容；无云调用')
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
