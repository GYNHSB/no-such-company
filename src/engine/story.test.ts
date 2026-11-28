import { describe, expect, it } from 'vitest'
import { BLANK_MAX_WRONG_IN_A_ROW, SUSPICION } from '@/data/rules'
import { day1 } from '@/data/days/day1'
import type { DayScript } from '@/data/types'
import {
  choose,
  closeDateCard,
  endScene,
  newStory,
  runLater,
  sentenceResult,
  signal,
  startDay,
  submitSentence,
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
  // 메일함 탭을 앞으로 가져온다(탭을 누르거나, 취업 사이트 탭을 닫아서)
  'laptop_tab:mail',
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

describe('빈칸 문장 판정', () => {
  /** 4일차의 빈칸 문장 둘. 첫 문장을 맞추면 혼잣말이 나온다 */
  const script: DayScript = {
    info: { day: 4, week: 6, weekday: '화', title: '추리' },
    evidence: [
      { id: 'my_sns', title: '내 SNS 게시물', detail: '' },
      { id: 'blabla_posts', title: '블라블라 게시글', detail: '' },
    ],
    sentences: [
      {
        id: 's_sns',
        day: 4,
        text: '면접에서 칭찬받은 내용은 포트폴리오가 아니라 [0]에 있었다',
        answers: ['my_sns'],
      },
      {
        id: 's_later',
        day: 5,
        text: '같은 칭찬을 들은 사람이 [0]에 여럿 있다',
        answers: ['blabla_posts'],
      },
    ],
    events: [
      {
        id: 'd4_solved',
        trigger: { type: 'sentenceSolved', sentenceId: 's_sns' },
        effects: [{ type: 'monologue', lines: ['내 SNS를 본 거다.'] }],
      },
    ],
  }
  const holding = { ...newStory(4), evidence: ['my_sns', 'blabla_posts'] }

  it('정답 카드를 놓으면 맞춘 문장이 되고 sentenceSolved 사건이 일어난다', () => {
    const { state } = submitSentence(holding, script, 's_sns', ['my_sns'])
    expect(sentenceResult(state, 's_sns')).toBe('solved')
    expect(state.fired).toContain('d4_solved')
    expect(state.said).toEqual(['내 SNS를 본 거다.'])
  })

  it('틀리면 wrong이고, 연달아 정해진 횟수만큼 틀리면 그날은 잠긴다', () => {
    let state = holding
    for (let i = 1; i < BLANK_MAX_WRONG_IN_A_ROW; i++) {
      state = submitSentence(state, script, 's_sns', ['blabla_posts']).state
      expect(sentenceResult(state, 's_sns')).toBe('wrong')
    }
    state = submitSentence(state, script, 's_sns', ['blabla_posts']).state
    expect(sentenceResult(state, 's_sns')).toBe('locked')
    // 잠긴 뒤에는 정답을 놓아도 받지 않는다
    state = submitSentence(state, script, 's_sns', ['my_sns']).state
    expect(sentenceResult(state, 's_sns')).toBe('locked')
    expect(state.fired).not.toContain('d4_solved')
  })

  it('날이 바뀌면 잠긴 문장이 풀리고, 맞춘 문장은 그대로다', () => {
    let state = submitSentence(holding, script, 's_sns', ['blabla_posts']).state
    state = submitSentence(state, script, 's_sns', ['blabla_posts']).state
    expect(sentenceResult(state, 's_sns')).toBe('locked')
    const next = startDay(state, { ...script, info: { ...script.info, day: 5 } }).state
    expect(sentenceResult(next, 's_sns')).toBeUndefined()
    const solved = submitSentence(next, script, 's_sns', ['my_sns']).state
    const after = startDay(solved, { ...script, info: { ...script.info, day: 5 } }).state
    expect(sentenceResult(after, 's_sns')).toBe('solved')
  })

  it('틀렸다가 맞추면 틀린 횟수가 지워진다', () => {
    let state = submitSentence(holding, script, 's_sns', ['blabla_posts']).state
    state = submitSentence(state, script, 's_sns', ['my_sns']).state
    expect(sentenceResult(state, 's_sns')).toBe('solved')
    expect(state.wrong).toEqual({})
  })

  it('가지고 있지 않은 카드, 아직 열리지 않은 문장, 이미 맞춘 문장은 받지 않는다', () => {
    const empty = newStory(4)
    expect(sentenceResult(submitSentence(empty, script, 's_sns', ['my_sns']).state, 's_sns')).toBe(
      'wrong',
    )
    expect(submitSentence(holding, script, 's_later', ['blabla_posts']).state).toBe(holding)
    expect(submitSentence(holding, script, 'no_such', ['my_sns']).state).toBe(holding)
    const solved = submitSentence(holding, script, 's_sns', ['my_sns']).state
    expect(submitSentence(solved, script, 's_sns', ['blabla_posts']).state).toBe(solved)
  })
})

describe('하루의 끝', () => {
  const script: DayScript = {
    info: { day: 1, week: 1, weekday: '월', title: '입사' },
    evidence: [],
    sentences: [],
    events: [
      {
        id: 'last',
        trigger: { type: 'interact', objectId: 'btn_last' },
        effects: [{ type: 'goal', text: '1일차가 끝났습니다.' }, { type: 'dayEnd' }],
      },
    ],
  }

  it('dayEnd 효과가 실행되면 하루가 끝난 것으로 적힌다', () => {
    const started = startDay(newStory(), script).state
    expect(started.dayOver).toBe(false)
    const ended = signal(started, script, { type: 'interact', objectId: 'btn_last' }).state
    expect(ended.dayOver).toBe(true)
  })

  it('다음 날을 시작하면 다시 끝나지 않은 날이 된다', () => {
    const ended = signal(startDay(newStory(), script).state, script, {
      type: 'interact',
      objectId: 'btn_last',
    }).state
    const next = startDay(ended, { ...script, info: { ...script.info, day: 2 } }).state
    expect(next.dayOver).toBe(false)
    expect(next.day).toBe(2)
  })

  it('1일차 대본은 마지막 사건에서 끝난다', () => {
    let state = startDay(newStory(), day1).state
    for (const objectId of DAY1_PRESSES) {
      state = flush(signal(state, day1, { type: 'interact', objectId }), day1).state
    }
    expect(state.dayOver).toBe(true)
  })
})

describe('노트북에 띄운 화면의 기록', () => {
  it('1일차는 취업 사이트와 메일함을 탭으로 띄우고 시작한다', () => {
    const { state } = startDay(newStory(), day1)
    expect(state.laptopLog).toEqual(['jobsite', 'mail', 'jobsite'])
    expect(state.laptop).toBe('jobsite')
  })

  it('메일함 탭을 앞으로 가져오면 불합격 메일 장면으로 넘어간다. 취업 사이트를 보기 전에는 넘어가지 않는다', () => {
    let state = startDay(newStory(), day1).state
    state = signal(state, day1, { type: 'interact', objectId: 'laptop_tab:mail' }).state
    expect(state.fired).not.toContain('d1_rejections')
    state = signal(state, day1, { type: 'interact', objectId: 'interact_laptop' }).state
    state = signal(state, day1, { type: 'interact', objectId: 'laptop_tab:mail' }).state
    expect(state.fired).toContain('d1_rejections')
  })

  it('날이 바뀌어도 띄운 기록이 이어져서 즐겨찾기가 남는다', () => {
    const first = startDay(newStory(), day1).state
    const next = startDay(first, { ...day1, info: { ...day1.info, day: 2 }, events: [] }).state
    expect(next.laptopLog).toEqual(['jobsite', 'mail', 'jobsite'])
  })
})

describe('여러 신호 가운데 하나로 일어나는 사건', () => {
  it('objectId를 여러 개 적으면 그 가운데 하나만 와도 일어나고, 한 번만 일어난다', () => {
    const script: DayScript = {
      info: { day: 1, week: 1, weekday: '월', title: '입사' },
      evidence: [],
      sentences: [],
      events: [
        {
          id: 'either',
          trigger: { type: 'interact', objectId: ['btn_a', 'btn_b'] },
          effects: [{ type: 'suspicion', delta: 5 }],
        },
      ],
    }
    const started = startDay(newStory(), script).state
    expect(signal(started, script, { type: 'interact', objectId: 'btn_c' }).state.fired).toEqual([])
    const second = signal(started, script, { type: 'interact', objectId: 'btn_b' }).state
    expect(second.fired).toEqual(['either'])
    const again = signal(second, script, { type: 'interact', objectId: 'btn_a' }).state
    expect(again.suspicion).toBe(second.suspicion)
  })

  it('1일차: 메일함을 본 뒤 탭을 닫거나 노트북에서 눈을 떼면 다음으로 넘어간다', () => {
    const until = (...presses: string[]) => {
      let state = startDay(newStory(), day1).state
      for (const objectId of presses) {
        state = signal(state, day1, { type: 'interact', objectId }).state
      }
      return state
    }
    const seen = ['interact_laptop', 'laptop_tab:mail']
    expect(until(...seen, 'btn_mail_close').fired).toContain('d1_close_mail')
    expect(until(...seen, 'laptop_leave').fired).toContain('d1_close_mail')
    // 메일함을 보기 전에 노트북에서 눈을 떼면 넘어가지 않는다
    expect(until('interact_laptop', 'laptop_leave').fired).not.toContain('d1_close_mail')
  })
})
