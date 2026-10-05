#!/usr/bin/env node
/**
 * 静态一致性自检。
 * 微信开发者工具之外的补充检查，避免"能编译但点了没反应"的问题：
 *   1. app.json 里声明的每个页面都必须有 .ts / .wxml / .json
 *   2. wxml 里绑定的事件处理函数必须在对应 .ts 中存在
 *   3. ts 里 select('#xxx') 用到的节点 id 必须在 wxml 中存在
 *   4. 代码里出现的页面路径必须在 app.json 中注册
 *   5. pages/ 下不能有未注册的孤儿页面
 */

const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..', 'miniprogram')
const errors = []
const warnings = []

/* 24 个结果必须各自有一张透明底角色图，避免上线后出现空白头像。 */
const resultConfig = read(path.join(root, 'config', 'results.ts'))
const avatarRoot = path.join(root, 'assets', 'avatars')
const resultIds = resultConfig ? Array.from(resultConfig.matchAll(/id:\s*'([^']+)'/g), (match) => match[1]) : []
resultIds.forEach((resultId) => {
  if (!fs.existsSync(path.join(avatarRoot, `${resultId}.png`))) {
    errors.push(`物种 ${resultId} 缺少专属角色图 assets/avatars/${resultId}.png`)
  }
})

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
}

const appJsonText = read(path.join(root, 'app.json'))
if (!appJsonText) {
  console.error('缺少 miniprogram/app.json')
  process.exit(1)
}
const appJson = JSON.parse(appJsonText)
const pages = appJson.pages || []

pages.forEach((page) => {
  const base = path.join(root, page)
  ;['.ts', '.wxml', '.json'].forEach((ext) => {
    if (!fs.existsSync(base + ext)) errors.push(`页面 ${page} 缺少 ${ext}`)
  })

  const ts = read(base + '.ts')
  const wxml = read(base + '.wxml')
  if (!ts || !wxml) return

  const handlers = new Set()
  const bindRe = /b(?:ind|indcatch|catch):?([a-z]+)="([A-Za-z0-9_]+)"/g
  let match
  while ((match = bindRe.exec(wxml)) !== null) handlers.add(match[2])

  handlers.forEach((name) => {
    const methodRe = new RegExp(`(^|\\n)\\s{2}(?:async\\s+)?${name}\\s*[(:]`)
    if (!methodRe.test(ts)) errors.push(`页面 ${page} 的 wxml 绑定了 ${name}(), 但 ts 中没有定义`)
  })

  const idRe = /select\('#([A-Za-z0-9_-]+)'\)/g
  while ((match = idRe.exec(ts)) !== null) {
    const id = match[1]
    if (wxml.indexOf(`id="${id}"`) < 0) errors.push(`页面 ${page} 查询了 #${id}, 但 wxml 中没有该节点`)
  }

  /* wxml 里直接引用的数据字段必须在 data 中声明 */
  const dataMatch = ts.match(/data:\s*\{([\s\S]*?)\n  \}/)
  const declared = new Set()
  if (dataMatch) {
    const keyRe = /^\s{4}([A-Za-z_][A-Za-z0-9_]*)\s*:/gm
    let keyMatch
    while ((keyMatch = keyRe.exec(dataMatch[1])) !== null) declared.add(keyMatch[1])
  }
  const wxBuiltins = new Set(['item', 'index'])
  const mustacheRe = /\{\{([^}]*)\}\}/g
  const used2 = new Set()
  while ((match = mustacheRe.exec(wxml)) !== null) {
    const expr = match[1].trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(expr)) continue
    if (wxBuiltins.has(expr)) continue
    used2.add(expr)
  }
  used2.forEach((field) => {
    if (!declared.has(field)) {
      errors.push(`页面 ${page} 的 wxml 使用了 {{${field}}}，但 data 中没有声明该字段`)
    }
  })
})

/* 代码里出现的页面路径必须已注册 */
function collectTs(dir) {
  let out = ''
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out += collectTs(full)
    else if (entry.name.endsWith('.ts')) out += read(full) || ''
  })
  return out
}

const allTs = collectTs(root)
const pathRe = /pages\/[a-zA-Z0-9_-]+\/index/g
const used = new Set((allTs.match(pathRe) || []).map((p) => p))
used.forEach((p) => {
  if (pages.indexOf(p) < 0) errors.push(`代码中使用了未注册的页面路径 ${p}`)
})

/* 孤儿页面检查 */
const pageDir = path.join(root, 'pages')
fs.readdirSync(pageDir).forEach((name) => {
  const candidate = `pages/${name}/index`
  if (pages.indexOf(candidate) < 0) warnings.push(`pages/${name} 未在 app.json 中注册`)
})

console.log('页面静态自检')
console.log(`  已注册页面：${pages.length}`)
console.log(`  事件绑定检查：${pages.length} 个页面`)
if (warnings.length) {
  console.log('')
  warnings.forEach((w) => console.log(`  ! ${w}`))
}
if (errors.length) {
  console.log('')
  errors.forEach((e) => console.log(`  ✗ ${e}`))
  console.log('')
  console.log(`失败：${errors.length} 项`)
  process.exit(1)
}
console.log('')
console.log('全部通过')
