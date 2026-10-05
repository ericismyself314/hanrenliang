type TestFn = () => void | Promise<void>

const suites: { name: string; fn: TestFn }[] = []
let current = ''

export function describe(name: string, fn: () => void): void {
  current = name
  fn()
  current = ''
}

export function it(name: string, fn: TestFn): void {
  suites.push({ name: current ? `${current} › ${name}` : name, fn })
}

export function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

export function equal<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}（期望 ${String(expected)}，实际 ${String(actual)}）`)
  }
}

export function closeTo(actual: number, expected: number, tolerance: number, message: string): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}（期望 ${expected}±${tolerance}，实际 ${actual}）`)
  }
}

/** 可重复的伪随机数，保证随机化测试每次结果一致 */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

export async function run(): Promise<number> {
  let passed = 0
  const failures: string[] = []
  for (const suite of suites) {
    try {
      await suite.fn()
      passed += 1
      console.log(`  ✓ ${suite.name}`)
    } catch (err) {
      failures.push(`${suite.name}\n      ${(err as Error).message}`)
      console.log(`  ✗ ${suite.name}`)
    }
  }

  console.log('')
  console.log(`通过 ${passed}/${suites.length}`)
  if (failures.length > 0) {
    console.log('')
    console.log('失败用例：')
    failures.forEach((f) => console.log(`  - ${f}`))
    return 1
  }
  return 0
}
