#!/usr/bin/env node
/**
 * 把 demo/main.ts 连同 miniprogram 里的真实题目与计分逻辑打包成单文件 demo/index.html。
 * 目的：不开微信开发者工具也能完整点完 24 题，验证流程与结果。
 * 依赖 esbuild，按需通过 npx 获取，不作为项目运行时依赖。
 */
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const bundlePath = path.join(root, 'demo', '.bundle.js')
const shellPath = path.join(root, 'demo', 'shell.html')
const outPath = path.join(root, 'demo', 'index.html')

function run(cmd, args) {
  return execFileSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
}

try {
  run('npx', [
    '--yes',
    'esbuild@0.24.0',
    'demo/main.ts',
    '--bundle',
    '--format=iife',
    '--target=es2018',
    '--charset=utf8',
    `--outfile=${path.relative(root, bundlePath).replace(/\\/g, '/')}`,
  ])
} catch (err) {
  console.error('打包失败，请确认可以运行 npx（需要一次联网下载 esbuild）')
  process.exit(1)
}

const bundle = fs.readFileSync(bundlePath, 'utf8')
const shell = fs.readFileSync(shellPath, 'utf8')
const html = shell.replace('/* BUNDLE */', bundle)
fs.writeFileSync(outPath, html)
fs.unlinkSync(bundlePath)

console.log(`已生成 ${path.relative(root, outPath)}（${(html.length / 1024).toFixed(0)} KB）`)
