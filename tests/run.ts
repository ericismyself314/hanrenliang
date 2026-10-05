import './scoring.test'
import './reachability.test'
import './matching.test'
import './invite.test'
import './backend.test'
import './cloudMatching.test'
import { run } from './harness'

console.log('含人量 · 计分与结果可达性测试')
console.log('')

run().then((code) => {
  if (typeof process !== 'undefined' && process.exit) {
    process.exit(code)
  }
})
