#!/usr/bin/env node
/**
 * 体验版冒烟测试：用最小 DOM 替身在 Node 里把 demo 的两条路径都点一遍。
 * 目的不是替代浏览器，而是提前发现"打包成功但一打开就白屏/点不动"这类问题。
 *   场景 A：自己想测 → 答题 → 个人结果 → 邀请朋友 → 双人报告
 *   场景 B：好友从邀请链接进来 → 接受鉴定 → 答题 → 直接看双人报告
 */
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'demo', 'index.html'), 'utf8')
const match = html.match(/<script>([\s\S]*?)<\/script>/)
if (!match) {
  console.error('demo/index.html 中没有找到打包脚本，请先执行 npm run build:demo')
  process.exit(1)
}
const bundle = match[1]

function makeEl(tag) {
  const handlers = {}
  const el = {
    tagName: tag || 'div',
    innerHTML: '',
    children: [],
    dataset: {},
    style: {},
    handlers,
    stubs: [],
    appendChild(child) {
      this.children.push(child)
      return child
    },
    addEventListener(type, fn) {
      handlers[type] = fn
    },
    querySelector() {
      const stub = makeEl('button')
      this.stubs.push(stub)
      return stub
    },
    /**
     * 从 innerHTML 解析出真实选项 id，并缓存结果，
     * 这样测试代码再次查询时拿到的是同一批节点（绑定了 click 的那批）。
     */
    querySelectorAll(selector) {
      this.qsaCache = this.qsaCache || {}
      if (this.qsaCache[selector]) return this.qsaCache[selector]
      const ids = [...String(this.innerHTML).matchAll(/data-id="([^"]+)"/g)].map((m) => m[1])
      const stubs = ids.map((id) => {
        const stub = makeEl('button')
        stub.dataset.id = id
        this.stubs.push(stub)
        return stub
      })
      this.qsaCache[selector] = stubs
      return stubs
    },
  }
  Object.defineProperty(el, 'firstElementChild', {
    get() {
      const child = makeEl('section')
      child.innerHTML = el.innerHTML
      child.handlers = handlers
      child.stubs = el.stubs
      return child
    },
  })
  return el
}

let failed = false
function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`)
  } else {
    failed = true
    console.log(`  ✗ ${message}`)
  }
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** 每次都开一个全新的沙盒，避免场景之间互相污染 */
function boot(search = '') {
  const app = makeEl('div')
  const sandbox = {
    document: { getElementById: () => app, createElement: (tag) => makeEl(tag) },
    window: { scrollTo: () => undefined, confirm: () => false, location: { search } },
    URLSearchParams,
    setTimeout,
    console,
    Math,
    Date,
    JSON,
  }
  vm.createContext(sandbox)
  vm.runInContext(bundle, sandbox, { timeout: 5000 })
  return {
    screen: () => app.children[app.children.length - 1],
    text: () => String(app.children[app.children.length - 1].innerHTML),
  }
}

async function answerAll(ctx) {
  for (let q = 0; q < 24; q += 1) {
    const screen = ctx.screen()
    const options = screen.querySelectorAll('.opt')
    if (options.length !== 4) return `第 ${q + 1} 题没有渲染出 4 个选项`
    options[0].handlers.click()
    await sleep(200)
  }
  return ''
}

async function scenarioOwn() {
  console.log('场景 A：自己想测')
  const ctx = boot()
  assert(ctx.text().indexOf('看看你') >= 0 && ctx.text().indexOf('有多像人') >= 0, '首页渲染出主标题')
  assert(ctx.text().indexOf('有多像人') >= 0, '首页点出人类状态主题')
  assert(ctx.text().indexOf('测测你的含人量') >= 0, '首页显示含人量宣传语')
  assert(ctx.text().indexOf('测测你的含人量') >= 0, '首页显示单一主按钮')
  assert(ctx.text().indexOf('不用准备答案，凭第一感觉就好') < 0, '首页不显示作答提示')
  ctx.screen().stubs[0].handlers.click()
  await sleep(20)
  assert(ctx.text().indexOf('q-no') >= 0, '答题页渲染出题号')
  assert(ctx.text().indexOf('qprogress') >= 0, '答题页显示进度条')
  assert(ctx.text().indexOf('/ 24') < 0, '答题页不透露总题数')
  assert(ctx.text().indexOf('class="k"') < 0, '答题选项不再显示 ABCD 字母')

  const problem = await answerAll(ctx)
  assert(!problem, `24 题可以连续答完${problem ? '（' + problem + '）' : ''}`)

  const result = ctx.text()
  assert(result.indexOf('鉴定完毕，你是') >= 0, '答完后进入个人结算页')
  assert(/\d+%/.test(result.replace(/\s/g, '')), '结算页显示含人量百分比')
  assert((result.match(/含人量/g) || []).length >= 2, '结算页反复强调含人量')
  assert(result.indexOf('画像') >= 0, '结算页给出人物分析长文案')
  assert(result.indexOf('avatar-art') >= 0, '结算页显示物种专属小人')
  assert(result.indexOf('晒我的含人量') >= 0, '结果页显示图片分享主入口')
  assert(result.indexOf('分享小程序页面') >= 0, '保留可点击测试的页面分享入口')
  assert(result.indexOf('radar-svg') >= 0, '结算页直接显示六边形状态图')
  assert(result.indexOf('六维状态') >= 0, '结算页直接显示六维')
  assert(result.indexOf('最佳搭子') >= 0, '结算页直接显示最佳搭子')
  assert(result.indexOf('展开详细分析') < 0, '结算页不再隐藏详细分析')
  assert(result.indexOf('可以直接发出去') < 0, '结算页不重复展示分享文案区')

  assert(result.indexOf('双人') < 0, '结果页不承诺双人功能')
  assert(result.indexOf('看看你的朋友还有人类吗') >= 0, '结果页保留邀请朋友测试的文案')
  ctx.screen().stubs[3].handlers.click()
  await sleep(20)
  assert(ctx.text().indexOf('有多像人') >= 0, '再测入口能返回首页')
}

async function scenarioShared() {
  console.log('场景 B：新设备打开朋友分享')
  const ctx = boot('?result=B2-F&score=60')
  assert(ctx.text().includes('朋友的检测结果') && ctx.text().includes('60%'), '没有本机结果也能看到朋友的公开结果')
  assert(ctx.text().includes('B2-F.png'), '分享落地页显示朋友的兼容格式角色')
  assert(!ctx.text().includes('六维状态'), '分享参数不伪造朋友的六维分数')
  ctx.screen().stubs[0].handlers.click()
  const problem = await answerAll(ctx)
  assert(!problem && ctx.text().includes('鉴定完毕，你是'), '朋友可独立答完并获得自己的结果')
  const invalid = boot('?result=B0-R&score=100')
  assert(!invalid.text().includes('朋友的检测结果'), '矛盾的分数与称号不展示为朋友结果')
  const legacy = boot('?invite=old-token')
  assert(legacy.text().includes('测测你的含人量') && !legacy.text().includes('邀请读取失败'), '旧邀请参数仍能进入单人首页')
}

async function main() {
  console.log('体验版冒烟测试')
  console.log('')
  await scenarioOwn()
  await scenarioShared()
  console.log('')
  if (failed) {
    console.log('冒烟测试失败')
    process.exit(1)
  }
  console.log('冒烟测试通过')
}

main()
