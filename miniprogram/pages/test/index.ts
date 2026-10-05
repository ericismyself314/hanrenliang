import { QUESTIONS, TOTAL_QUESTIONS } from '../../config/questions'
import { track } from '../../utils/analytics'
import { buildTestResult } from '../../utils/result'
import { scoreAnswers } from '../../utils/scoring'
import { PAGE } from '../../utils/share'
import { clearAnswers, getAnswers, saveAnswers, saveResult } from '../../utils/storage'

type OptionView = {
  id: string
  text: string
}

type TestData = {
  index: number
  /** 题号，排版用 */
  no: string
  progressWidth: string
  text: string
  options: OptionView[]
  selected: string
  hasPrev: boolean
  submitting: boolean
  errorMessage: string
  inviteToken: string
}

Page({
  data: {
    index: 0,
    no: '01',
    progressWidth: `${(100 / TOTAL_QUESTIONS).toFixed(2)}%`,
    text: '',
    options: [] as OptionView[],
    selected: '',
    hasPrev: false,
    submitting: false,
    errorMessage: '',
    inviteToken: '',
  } as TestData,

  answers: [] as string[],

  advancing: false,

  answerScope: 'personal',

  finished: false,

  onLoad(options: Record<string, string | undefined>) {
    const token = ''
    this.answerScope = 'personal'
    this.finished = false
    const saved = getAnswers(this.answerScope)
    this.answers = saved.length === TOTAL_QUESTIONS ? [...saved] : new Array(TOTAL_QUESTIONS).fill('')
    const firstUnanswered = this.answers.findIndex((a) => !a)
    const startIndex = firstUnanswered < 0 ? TOTAL_QUESTIONS - 1 : firstUnanswered
    this.setData({ inviteToken: token })
    this.render(startIndex)
    track('page_view', { source: 'test', inviteToken: token })
  },

  render(index: number) {
    const question = QUESTIONS[index]
    this.setData({
      index,
      no: index + 1 < 10 ? `0${index + 1}` : String(index + 1),
      progressWidth: `${(((index + 1) / TOTAL_QUESTIONS) * 100).toFixed(2)}%`,
      text: question.text,
      options: question.options.map((o) => ({ id: o.id, text: o.text })),
      selected: this.answers[index] || '',
      hasPrev: index > 0,
    })
  },

  choose(e: WechatMiniprogram.TouchEvent) {
    const optionId = e.currentTarget.dataset.id as string
    if (this.data.submitting || this.advancing) return
    // 只接受当前题目的选项，防止连点把答案写错位
    if (!QUESTIONS[this.data.index].options.some((o) => o.id === optionId)) return

    this.advancing = true
    this.answers[this.data.index] = optionId
    saveAnswers(this.answers, this.answerScope)
    this.setData({ selected: optionId })
    track('question_answer', { source: 'test', value: this.data.index + 1, inviteToken: this.data.inviteToken })

    setTimeout(() => {
      this.advancing = false
      if (this.data.index < TOTAL_QUESTIONS - 1) {
        this.render(this.data.index + 1)
      } else {
        this.finish()
      }
    }, 180)
  },

  prev() {
    if (this.data.index <= 0 || this.advancing) return
    this.render(this.data.index - 1)
  },

  restart() {
    wx.showModal({
      title: '重新开始？',
      content: '当前进度会被清空，已答过的题需要重新选一次。',
      confirmText: '重新开始',
      cancelText: '继续答题',
      success: (res) => {
        if (!res.confirm) return
        clearAnswers(this.answerScope)
        this.answers = new Array(TOTAL_QUESTIONS).fill('')
        this.render(0)
      },
    })
  },

  finish() {
    if (this.data.submitting) return
    const missing = this.answers.findIndex((a) => !a)
    if (missing >= 0) {
      this.render(missing)
      wx.showToast({ title: `还有第 ${missing + 1} 题没选`, icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    let score
    try {
      score = scoreAnswers(this.answers)
    } catch {
      this.setData({ submitting: false, errorMessage: '计分失败，请重新开始一次' })
      return
    }

    saveResult(buildTestResult(score, [...this.answers]))
    track('test_complete', { source: 'test', value: score.humanScore, inviteToken: this.data.inviteToken })

    clearAnswers(this.answerScope)
    this.finished = true
    this.setData({ submitting: false })
    wx.redirectTo({ url: PAGE.result })
  },

  onUnload() {
    if (!this.finished) saveAnswers(this.answers, this.answerScope)
  },

  onHide() {
    if (!this.finished) saveAnswers(this.answers, this.answerScope)
  },
})
