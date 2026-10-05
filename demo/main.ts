/**
 * 浏览器演示入口。
 * 直接复用 miniprogram 里的题目配置与计分逻辑，不另写一套，
 * 目的是在不开微信开发者工具的情况下验证完整答题体验与结果正确性。
 */
import { DISCLAIMER } from '../miniprogram/config/content'
import { QUESTIONS, TOTAL_QUESTIONS } from '../miniprogram/config/questions'
import { DIMENSIONS, DimensionCode } from '../miniprogram/config/dimensions'
import {
  BANDS,
  BRAND_STRIP,
  INDEX_LABEL,
  getResult,
} from '../miniprogram/config/results'
import { avatarStyleFor } from '../miniprogram/utils/avatar'
import { buildSnapshot } from '../miniprogram/utils/result'
import { scoreAnswers } from '../miniprogram/utils/scoring'
import { DimensionScores } from '../miniprogram/utils/types'

const app = document.getElementById('app') as HTMLDivElement
const answers: string[] = new Array(TOTAL_QUESTIONS).fill('')
let index = 0
let advancing = false
let screen: 'home' | 'test' | 'result' = 'home'
let sharedPreview: { title: string; score: number; resultId: string } | null = null

const BAND_STATUS = BANDS.map((b) => b.status)

function el(html: string): HTMLElement {
  const wrap = document.createElement('div')
  wrap.innerHTML = html.trim()
  return wrap.firstElementChild as HTMLElement
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** 顶部品牌条：每一屏都出现，用来反复强化「含人量」 */
function topbar(): string {
  return `<div class="topbar"><div class="mark">含人量</div><div class="sub">HUMAN INDEX</div></div>`
}

/** 底部品牌收束条 */
function brand(): string {
  const parts = BRAND_STRIP.split(' · ')
  return `<div class="brand"><div class="w">${parts[0]}</div><div class="e">${parts[1] || 'HUMAN INDEX'}</div></div>`
}

function eyebrow(text: string): string {
  return `<div class="eyebrow"><i></i>${text}</div>`
}

/** 24 个物种共用一套原创 AI 角色图，demo 与小程序资源同名。 */
function avatarImage(resultId: string, className = 'avatar-art'): string {
  const def = getResult(resultId)
  const title = def ? def.title : resultId
  // 角色图位于结果页首屏，直接加载比 lazy 更稳定，避免首次进入时出现空白。
  return `<img class="${className}" src="./assets/avatars/${resultId}.png" alt="${title} 专属小人" />`
}

function avatarSvg(resultId: string): string {
  const style = avatarStyleFor(resultId)
  const shift = style.pose === 1 ? -4 : style.pose === 2 ? 4 : 0
  const x = 100 + shift
  const accessories: Record<string, string> = {
    blanket: `<rect x="44" y="124" width="32" height="40" rx="9" fill="${style.accent}"/>`,
    ghost: `<path d="M143 69v-15a14 14 0 0 1 28 0v15l-7-5-7 5-7-5-7 5Z" fill="${style.accent}"/>`,
    planner: `<rect x="137" y="111" width="28" height="36" rx="5" fill="${style.accent}"/><path d="M143 121h15M143 129h11" stroke="#fff" stroke-width="3"/>`,
    route: `<path d="m140 117 24-6 2 34-24 6Z M151 114l2 34" fill="none" stroke="${style.accent}" stroke-width="3"/>`,
    mute: `<path d="M142 126h20M142 136h20" stroke="${style.accent}" stroke-width="4" stroke-linecap="round"/>`,
    robot: `<rect x="139" y="112" width="27" height="24" rx="5" fill="none" stroke="${style.accent}" stroke-width="3"/><circle cx="147" cy="123" r="2" fill="${style.accent}"/><circle cx="158" cy="123" r="2" fill="${style.accent}"/>`,
    barrier: `<path d="m137 145 30-30m-30 0 30 30" stroke="${style.accent}" stroke-width="4" stroke-linecap="round"/>`,
    phone: `<rect x="139" y="114" width="20" height="34" rx="5" fill="none" stroke="${style.accent}" stroke-width="3"/><circle cx="149" cy="142" r="2" fill="${style.accent}"/>`,
    dice: `<rect x="140" y="118" width="26" height="26" rx="6" fill="${style.accent}"/><circle cx="148" cy="126" r="2" fill="#fff"/><circle cx="158" cy="136" r="2" fill="#fff"/>`,
    map: `<path d="m140 117 24-6 2 34-24 6Z M151 114l2 34" fill="none" stroke="${style.accent}" stroke-width="3"/>`,
    spark: `<path d="m151 110 4 13 13 5-13 4-4 14-4-14-13-4 13-5Z" fill="${style.accent}"/>`,
    camera: `<rect x="137" y="120" width="31" height="21" rx="5" fill="none" stroke="${style.accent}" stroke-width="3"/><circle cx="153" cy="130" r="6" fill="none" stroke="${style.accent}" stroke-width="3"/>`,
    plant: `<path d="M151 145v-26m0 4c-9-8-13 1-6 7m6 1c8-8 13 0 6 6" fill="none" stroke="${style.accent}" stroke-width="3" stroke-linecap="round"/>`,
    coffee: `<rect x="139" y="120" width="23" height="22" rx="5" fill="none" stroke="${style.accent}" stroke-width="3"/><path d="M162 125h3a7 7 0 0 1 0 11h-3" fill="none" stroke="${style.accent}" stroke-width="3"/>`,
    compass: `<circle cx="151" cy="130" r="15" fill="none" stroke="${style.accent}" stroke-width="3"/><path d="m151 130 8-8m-8 8-5 7" stroke="${style.accent}" stroke-width="3" stroke-linecap="round"/>`,
    star: `<path d="m151 110 5 12 13 5-13 5-5 14-5-14-13-5 13-5Z" fill="${style.accent}"/>`,
    headphones: `<path d="M133 127a18 18 0 0 1 36 0" fill="none" stroke="${style.accent}" stroke-width="4"/><rect x="132" y="126" width="7" height="16" rx="3" fill="${style.accent}"/><rect x="163" y="126" width="7" height="16" rx="3" fill="${style.accent}"/>`,
    cap: `<path d="m135 117 17-9 15 9-15 6Z" fill="${style.accent}"/><path d="M149 117h20" stroke="${style.accent}" stroke-width="5"/>`,
    flag: `<path d="M145 148v-36m1 3 21 6-21 8" fill="none" stroke="${style.accent}" stroke-width="3"/>`,
    moon: `<path d="M158 112a16 16 0 1 0 1 29 14 14 0 0 1-1-29Z" fill="none" stroke="${style.accent}" stroke-width="3"/>`,
    paper: `<rect x="138" y="113" width="27" height="35" rx="4" fill="${style.accent}"/><path d="M144 122h15M144 130h11" stroke="#fff" stroke-width="3"/>`,
    rainbow: `<path d="M130 140a21 21 0 0 1 42 0m-33 0a12 12 0 0 1 24 0" fill="none" stroke="${style.accent}" stroke-width="3"/>`,
    clock: `<circle cx="151" cy="130" r="15" fill="none" stroke="${style.accent}" stroke-width="3"/><path d="M151 130v-9m0 9 7 5" stroke="${style.accent}" stroke-width="3" stroke-linecap="round"/>`,
    pin: `<path d="M151 111a10 10 0 0 0-10 10c0 8 10 25 10 25s10-17 10-25a10 10 0 0 0-10-10Z" fill="${style.accent}"/><circle cx="151" cy="121" r="3" fill="#fff"/>`,
  }
  return `<svg class="avatar-art" viewBox="0 0 200 200" role="img" aria-label="${resultId} 专属小人">
    <circle cx="100" cy="100" r="94" fill="${style.background}"/>
    <ellipse cx="100" cy="170" rx="48" ry="9" fill="rgba(22,35,61,.12)"/>
    <g transform="translate(${shift} 0)">
      <rect x="64" y="104" width="72" height="62" rx="22" fill="${style.shirt}"/>
      <path d="M78 158v25m30-25v25" stroke="${style.skin}" stroke-width="14" stroke-linecap="square"/>
      <path d="M75 182h20m10 0h20" stroke="${style.shirt}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="100" cy="78" r="33" fill="${style.skin}"/>
      <path d="M69 78c3-20 14-30 31-30 17 0 28 10 31 30l-10-1-6-16c-8 7-18 10-33 9l-5 9Z" fill="${style.hair}"/>
      <circle cx="89" cy="82" r="3" fill="#16233d"/><circle cx="111" cy="82" r="3" fill="#16233d"/>
      <path d="M92 89a10 10 0 0 0 16 0" fill="none" stroke="#16233d" stroke-width="2.5" stroke-linecap="round"/>
    </g>
    ${accessories[style.accessory] || ''}
  </svg>`
}

function radarSvg(scores: DimensionScores, keyDimension: DimensionCode): string {
  const center = 120
  const radius = 78
  const pointAt = (index: number, ratio: number) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / DIMENSIONS.length
    return [center + Math.cos(angle) * radius * ratio, center + Math.sin(angle) * radius * ratio]
  }
  const points = (ratio: number) => DIMENSIONS.map((_d, i) => pointAt(i, ratio).join(',')).join(' ')
  const dataPoints = DIMENSIONS.map((d, i) => pointAt(i, Math.max(scores[d.code], 3) / 100).join(',')).join(' ')
  const labels = DIMENSIONS.map((d, i) => {
    const [x, y] = pointAt(i, 1.32)
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${d.shortName}<tspan x="${x}" dy="13" font-weight="700">${scores[d.code]}</tspan></text>`
  }).join('')
  const dots = DIMENSIONS.map((d, i) => {
    const [x, y] = pointAt(i, Math.max(scores[d.code], 3) / 100)
    return `<circle cx="${x}" cy="${y}" r="3" class="${d.code === keyDimension ? 'key-dot' : ''}"/>`
  }).join('')
  return `<svg class="radar-svg" viewBox="0 0 240 240" role="img" aria-label="六维状态六边形雷达图">
    <polygon points="${points(1)}" class="radar-grid"/>
    <polygon points="${points(.75)}" class="radar-grid"/>
    <polygon points="${points(.5)}" class="radar-grid"/>
    <polygon points="${points(.25)}" class="radar-grid"/>
    ${DIMENSIONS.map((_d, i) => { const [x, y] = pointAt(i, 1); return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" class="radar-axis"/>` }).join('')}
    <polygon points="${dataPoints}" class="radar-data"/>${dots}${labels}
  </svg>`
}

/** 任何渲染异常都要显示在页面上，不许只进控制台 */
function render(): void {
  try {
    app.innerHTML = ''
    if (screen === 'home') app.appendChild(homeView())
    else if (screen === 'test') app.appendChild(testView())
    else if (screen === 'result') app.appendChild(resultView())

  } catch (err) {
    app.innerHTML = ''
    const node = el(`
      <div>
        ${topbar()}
        ${eyebrow('ERROR')}
        <h2 class="h2">这一步没渲染出来</h2>
        <p class="prose" style="margin-top:14px">${(err as Error).message}</p>
        <button class="btn" id="restartAll">重新开始</button>
      </div>
    `)
    app.appendChild(node)
    const restart = node.querySelector('#restartAll') as HTMLButtonElement | null
    if (restart) {
      restart.addEventListener('click', () => {
        answers.fill('')
        index = 0
        advancing = false
        screen = 'home'
        render()
      })
    }
  }
  try {
    window.scrollTo({ top: 0 })
  } catch {
    // 个别环境不支持滚动，忽略
  }
}

function homeView(): HTMLElement {
  const node = el(`
    <div class="home-page">
      <div class="home-kicker">一场关于你的生活小测试</div>
      <h1 class="h1">看看你<br /><u>有多像人</u></h1>
      <p class="home-slogan">测测你的含人量，看看你现在有多像人。</p>
      <div class="ai-hero" aria-label="正在接受人类状态鉴定">
        <img src="./assets/home-human-v5.png" alt="正在接受人类状态鉴定的校园小人" fetchpriority="high" />
      </div>
${sharedPreview ? `<div class="card-flat shared-preview"><div class="card-title">朋友的检测结果</div>${avatarImage(sharedPreview.resultId)}<div class="shared-score">${sharedPreview.score}% · ${sharedPreview.title}</div><p>TA已经测完了，看看你还有多少含人量。</p></div>` : ''}
      <button class="btn" id="start">测测你的含人量 →</button>
    </div>
  `)
  node.querySelector('#start')!.addEventListener('click', () => {
    screen = 'test'
    index = 0
    render()
  })
  return node
}

function testView(): HTMLElement {
  const question = QUESTIONS[index]
  const node = el(`
    <div>
      ${topbar()}
      <div class="qhead">
        <div class="q-no">${pad2(index + 1)}</div>
      </div>
      <div class="qprogress"><i style="width:${(((index + 1) / TOTAL_QUESTIONS) * 100).toFixed(2)}%"></i></div>
      <p class="q-text">${question.text}</p>
      <div class="opts">
        ${question.options
          .map(
          (o, i) =>
              `<button class="opt${answers[index] === o.id ? ' on' : ''}" data-id="${o.id}"><span class="t">${o.text}</span></button>`,
          )
          .join('')}
      </div>
      <div class="qfoot">
        <button class="link" id="prev" ${index === 0 ? 'disabled' : ''}>上一题</button>
        <button class="link" id="restart">重新开始</button>
      </div>
    </div>
  `)

  node.querySelectorAll<HTMLButtonElement>('.opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (advancing) return
      const optionId = btn.dataset.id as string
      // 只接受当前题目的选项，避免连点把别的题答案写进来
      if (!QUESTIONS[index].options.some((o) => o.id === optionId)) return
      answers[index] = optionId
      advancing = true
      setTimeout(() => {
        advancing = false
        if (index < TOTAL_QUESTIONS - 1) {
          index += 1
          render()
          return
        }
        // 收尾前先确认 24 题都答了，缺哪题就回到哪题，不硬算
        const missing = answers.findIndex((a) => !a)
        if (missing >= 0) {
          index = missing
          render()
          return
        }
        try {
          buildSnapshot(scoreAnswers(answers))
          screen = 'result'
        } catch {
          const bad = answers.findIndex((a, i) => !QUESTIONS[i].options.some((o) => o.id === a))
          index = bad >= 0 ? bad : 0
          screen = 'test'
        }
        render()
      }, 160)
    })
  })

  const prev = node.querySelector<HTMLButtonElement>('#prev')!
  prev.addEventListener('click', () => {
    if (advancing || index <= 0) return
    index -= 1
    render()
  })
  node.querySelector<HTMLButtonElement>('#restart')!.addEventListener('click', () => {
    if (!window.confirm('重新开始？当前作答会被清空。')) return
    answers.fill('')
    index = 0
    advancing = false
    render()
  })
  return node
}

function resultView(): HTMLElement {
  // 只展示当前用户实际作答后的个人结果。
  const snapshot = buildSnapshot(scoreAnswers(answers))
  const def = getResult(snapshot.resultId)!
  const score = {
    humanScore: snapshot.humanScore,
    band: snapshot.band,
    keyDimension: snapshot.keyDimension,
    resultId: snapshot.resultId,
  }

  const analysisMarkup = `
    <div class="block hexagon-card">
      <div class="block-head"><div class="block-no">02</div><div class="block-title">六维状态</div></div>
      <div class="radar-demo">${radarSvg(snapshot.dimensionScores, score.keyDimension)}</div>
    </div>

    <div class="block insight-block">
      <div class="block-head"><div class="block-no">03</div><div class="block-title">你的状态拆解</div></div>
      <div class="insight-card insight-positive">
        <div class="cell-t">你仍然像人的地方</div>
        <p>${def.humanSide}</p>
      </div>
      <div class="insight-card insight-watch">
        <div class="cell-t warn">正在掉线的部分</div>
        <p>${def.offlineSignal}</p>
      </div>
    </div>

    <div class="block">
      <div class="block-head"><div class="block-no">04</div><div class="block-title">最佳搭子</div></div>
      <div class="panel">
        <div class="big">${def.bestPartner}</div>
        <p>想到谁了？把结果发给TA，看看TA是不是真长这样。</p>
      </div>
    </div>`

  const node = el(`
    <div>
      ${topbar()}
      <div class="result-hero">
        <div class="avatar-wrap">${avatarImage(snapshot.resultId)}</div>
        <div class="species">
          <div class="species-label">鉴定完毕，你是</div>
          <div class="species-name">${def.title}</div>
        </div>

        <div class="hero">
          <div class="hero-label">${INDEX_LABEL}</div>
          <div class="hero-num">${score.humanScore}<span>%</span></div>
          <div class="hero-bar"><i style="width:${score.humanScore}%"></i></div>
          <div class="hero-scale">
            <span>0</span><span class="mid">${BAND_STATUS[score.band]}</span><span>100</span>
          </div>
          <p class="portrait-verdict hero-verdict">${def.verdict}</p>
        </div>

      </div>

      <div class="block">
        <div class="block-head"><div class="block-no">01</div><div class="block-title">含人量画像</div></div>
        <p class="prose">${def.portrait}</p>
      </div>

      ${analysisMarkup}

      <div class="result-actions">
        <div class="result-bridge">
          <div class="bridge-title">看看你的朋友还有人类吗？</div>
          <p>我已经测完了，现在轮到你。</p>
        </div>
        <div class="timeline-demo-preview">
          ${avatarImage(snapshot.resultId, 'timeline-demo-avatar')}
          <div class="timeline-demo-title">${def.title}</div>
          <div class="timeline-demo-label">我的含人量</div>
          <div class="timeline-demo-score">${score.humanScore}%</div>
          <p>${def.verdict}</p>
          <div class="timeline-demo-footer">看看你有多像人</div>
        </div>
        <button class="btn signal" id="shareFriend">一键分享给好友</button>
        <button class="btn quiet" id="shareTimeline">晒我的含人量</button>
        <button class="link" id="shareTimelineLink">想让朋友点开就测？分享小程序页面 →</button>
        <p class="share-hint">分享卡片会带上你的含人量和结果称号。</p>
        <div class="share-status" id="shareStatus"></div>
      </div>

      <button class="btn ghost" id="again">不服，再测一次</button>

      <p class="foot">${DISCLAIMER}</p>
      ${brand()}
    </div>
  `)

  node.querySelector<HTMLButtonElement>('#shareTimeline')!.addEventListener('click', () => {
    const status = node.querySelector('#shareStatus')
    if (status) status.textContent = '微信小程序中会直接打开结果图片分享面板，在面板里选择朋友圈。浏览器试玩不能调起微信分享。'
  })
  node.querySelector<HTMLButtonElement>('#shareTimelineLink')!.addEventListener('click', () => {
    const status = node.querySelector('#shareStatus')
    if (status) status.textContent = '在微信小程序右上角 ··· 中选择“分享到朋友圈”，朋友可以点开页面测试。'
  })
  node.querySelector<HTMLButtonElement>('#shareFriend')!.addEventListener('click', () => {
    const status = node.querySelector('#shareStatus')
    if (status) status.textContent = '小程序中会直接调起好友分享卡片。'
  })
  node.querySelector<HTMLButtonElement>('#again')!.addEventListener('click', () => {
    answers.fill('')
    index = 0
    screen = 'home'
    render()
  })
  return node
}

/**
 * 体验版也支持从结果分享链接直接进入结果预览，方便在浏览器里验收传播链路。
 * 小程序端对应的是 index?result=...&score=...。
 */
function loadSharedPreview(): void {
  if (typeof window === 'undefined') return
  const location = window.location
  if (!location || typeof URLSearchParams === 'undefined') return

  const params = new URLSearchParams(location.search)
  const resultId = params.get('result') || ''
  const score = Number(params.get('score'))
  const def = getResult(resultId)
  if (!def || params.get('score') === null || !Number.isInteger(score) || score < 0 || score > 100 || Math.min(3, Math.floor(score / 25)) !== def.band) return

  sharedPreview = { title: def.title, score, resultId: def.id }
  screen = 'home'
}

loadSharedPreview()
render()
