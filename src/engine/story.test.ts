import { describe, expect, it } from 'vitest'
import { SUSPICION } from '@/data/rules'
import { day1 } from '@/data/days/day1'
import type { DayScript } from '@/data/types'
import {
  choose,
  closeDateCard,
  endScene,
  newStory,
  runLater,
  signal,
  startDay,
  type Step,
} from './story'

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

/** 1일차를 플레이어가 하는 순서대로 누른다. 타이머는 바로 끝난 셈 친다 */
const DAY1_PRESSES = [
  'interact_laptop',
  'btn_jobsite_close',
  'btn_mail_close',
  'interact_phone',
  'interact_laptop',
  'btn_install_interview_app',
  'btn_interview_join',
  'interview_end',
  'interact_laptop',
  'btn_work_send',
  'btn_work_video_send',
]
const press = (step: Step, objectId: string) =>
  flush(signal(step.state, day1, { type: 'interact', objectId }), day1)

describe('1일차', () => {
  it('처음부터 끝까지 이어진다', () => {
    let step = flush(startDay(newStory(), day1), day1)
    expect(step.state.goal).toBe('책상 위 노트북을 확인하세요.')
    expect(step.state.laptop).toBe('jobsite')
    for (const id of DAY1_PRESSES) step = press(step, id)

    const s = step.state
    expect(s.fired).toEqual(day1.events.map((e) => e.id))
    expect(s.evidence).toEqual(day1.evidence.map((c) => c.id))
    expect(s.messages.map((m) => m.id)).toEqual([
      'd1-sms-hr',
      'm_pass',
      'm_app',
      'm_final',
      'm_docs',
      'm_face',
      'm_first_work',
    ])
    expect(s.flags).toEqual({ submittedDocuments: true })
    expect(s.said[0]).toBe('나는 {name}.')
    expect(s.dateCard).toBe('그날 오후')
    expect(s.laptop).toBe('work')
    expect(s.goal).toBe('1일차가 끝났습니다.')
  })

  it('대본 순서보다 먼저 누른 것은 무시한다', () => {
    const early = press(flush(startDay(newStory(), day1), day1), 'interact_phone')
    expect(early.state.fired).toEqual(['d1_wake'])
  })

  it('같은 사건은 두 번 실행되지 않는다', () => {
    const once = press(flush(startDay(newStory(), day1), day1), 'interact_laptop')
    const twice = press(once, 'interact_laptop')
    expect(twice.state.said).toEqual(once.state.said)
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
  it('장면과 날짜 카드를 닫는다', () => {
    const s = { ...newStory(), scene: 'interview', dateCard: '그날 오후' }
    expect(endScene(s).scene).toBeNull()
    expect(closeDateCard(s).dateCard).toBeNull()
  })

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
