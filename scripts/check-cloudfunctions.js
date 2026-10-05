const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.resolve(__dirname, '../cloudfunctions')
const names = fs.readdirSync(root).filter((name) =>
  fs.existsSync(path.join(root, name, 'package.json')),
)

for (const name of names) {
  const dir = path.join(root, name)
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.js'))
  if (!files.includes('index.js')) throw new Error(`${name}: 缺少 index.js`)

  for (const file of files) {
    const filename = path.join(dir, file)
    const source = fs.readFileSync(filename, 'utf8')
    const syntax = spawnSync(process.execPath, ['--check', filename], { encoding: 'utf8' })
    if (syntax.status !== 0) throw new Error(`${name}/${file}: ${syntax.stderr}`)

    for (const [, requested] of source.matchAll(/\brequire\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
      const target = path.resolve(dir, requested)
      if (!target.startsWith(dir + path.sep)) {
        throw new Error(`${name}/${file}: 相对依赖超出云函数目录：${requested}`)
      }
      if (!fs.existsSync(target) && !fs.existsSync(`${target}.js`)) {
        throw new Error(`${name}/${file}: 找不到本目录依赖：${requested}`)
      }
    }
  }
}

const createValidation = fs.readFileSync(path.join(root, 'createInvite/resultValidation.js'), 'utf8')
const completeValidation = fs.readFileSync(path.join(root, 'completeInvite/resultValidation.js'), 'utf8')
if (createValidation !== completeValidation) {
  throw new Error('两个邀请云函数的结果快照校验代码不一致')
}

console.log(`云函数打包检查通过：${names.length} 个函数可独立上传`)
