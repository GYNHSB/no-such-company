import { describe, expect, it } from 'vitest'
import { SUSPICION } from '@/data/rules'
import { day1 } from '@/data/days/day1'
import type { DayScript } from '@/data/types'
import { choose, endScene, newStory, runLater, signal, startDay, type Step } from './story'

/** 타이머를 기다린 셈 치고 later에 쌓인 사건을 모두 실행한다 */
function flush(step: Step, script: DayScript): Step {
  let { state } = step
  const queue = [...step.later]
  while (queue.length) {
    const next = runLater(state, script, queue.shift()!.eventId)
    state = next.state
    queue.push(...next.later)
  }
  return { state, later: [] }
}

describe('1일차', () => {
  it('처음부터 끝까지 이어진다', () => {
    let step = startDay(newStory(), day1)
    expect(step.state.goal).toBe('노트북 메일함을 확인하자')
    expect(step.later).toEqual([{ eventId: 'd1_app', delaySec: 2 }])

    step = flush(step, day1)
    expect(step.state.goal).toBe('면접 앱을 설치하고 접속하자')

    step = signal(step.state, day1, { type: 'interact', objectId: 'btn_install_interview_app' })
    expect(step.state.scene).toBe('interview')
    step = flush({ ...step, state: endScene(step.state) }, day1)

    const s = step.state
    expect(s.fired).toEqual(day1.events.map((e) => e.id))
    expect(s.evidence).toEqual(day1.evidence.map((c) => c.id))
    expect(s.messages.map((m) => m.id)).toEqual(['m_offer', 'm_app', 'm_docs', 'm_face'])
    expect(s.flags).toEqual({ submittedDocuments: true })
    expect(s.goal).toBe('첫 업무를 시작하자')
    expect(s.scene).toBeNull()
  })

  it('같은 사건은 두 번 실행되지 않는다', () => {
    const once = signal(startDay(newStory(), day1).state, day1, {
      type: 'interact',
      objectId: 'btn_install_interview_app',
    })
    const twice = signal(once.state, day1, {
      type: 'interact',
      objectId: 'btn_install_interview_app',
    })
    expect(twice.state.evidence).toEqual(once.state.evidence)
    expect(twice.later).toEqual([])
  })

  it('원래 상태를 바꾸지 않는다', () => {
    const start = newStory()
    startDay(start, day1)
    expect(start).toEqual(newStory())
  })
})

/** 엔진 규칙만 보는 작은 대본 */
const toy: DayScript = {
  info: { day: 2, week: 3, weekday: '화', title: '시험' },
  evidence: [],
  sentences: [],
  events: [
    {
      id: 'ask',
      trigger: { type: 'dayStart' },
      effects: [
        {
          type: 'choice',
          prompt: '맞장구칠까?',
          choices: [
            { id: 'yes', label: '네', effects: [{ type: 'suspicion', delta: -100 }] },
            { id: 'no', label: '아니요', effects: [{ type: 'evidence', cardId: 'card' }] },
          ],
        },
      ],
    },
    {
      id: 'right_after',
      trigger: { type: 'afterEvent', eventId: 'ask' },
      effects: [{ type: 'webcam', on: true }],
    },
    {
      id: 'on_card',
      trigger: { type: 'evidenceCollected', cardId: 'card' },
      effects: [{ type: 'suspicion', delta: 500 }],
    },
    {
      id: 'solved',
      trigger: { type: 'sentenceSolved', sentenceId: 's1' },
      effects: [{ type: 'goal', text: '끝' }],
    },
  ],
}

describe('엔진 규칙', () => {
  it('기다릴 시간이 없는 다음 사건은 바로 실행한다', () => {
    const { state, later } = startDay(newStory(), toy)
    expect(state.day).toBe(2)
    expect(state.webcamOn).toBe(true)
    expect(later).toEqual([])
  })

  it('선택지를 고르면 그 효과가 실행되고, 경계심은 0~최대 안에 머문다', () => {
    const asked = startDay(newStory(), toy).state
    expect(asked.choice?.prompt).toBe('맞장구칠까?')
    expect(choose(asked, toy, 'yes').state).toMatchObject({ suspicion: 0, choice: null })
    // 증거를 얻으면 evidenceCollected 사건도 이어서 실행된다
    expect(choose(asked, toy, 'no').state.suspicion).toBe(SUSPICION.max)
    expect(choose(asked, toy, 'nope').state).toBe(asked)
  })

  it('문장을 맞추면 sentenceSolved 사건이 실행된다', () => {
    const s = signal(newStory(2), toy, { type: 'sentenceSolved', sentenceId: 's1' }).state
    expect(s.goal).toBe('끝')
  })

  it('다음 날로 넘어가면 그날 기록은 비우고 경계심과 증거는 이어진다', () => {
    const d1 = flush(startDay(newStory(), day1), day1).state
    const d2 = startDay({ ...d1, suspicion: 42 }, toy).state
    expect(d2.fired).toEqual(['ask', 'right_after'])
    expect(d2.suspicion).toBe(42)
    expect(d2.evidence).toEqual(d1.evidence)
  })
})
