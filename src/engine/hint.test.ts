import { describe, expect, it } from 'vitest'
import { day1 } from '@/data/days/day1'
import type { DayScript } from '@/data/types'
import { hintOf } from './hint'
import { newStory, signal, startDay } from './story'

const script: DayScript = {
  info: { day: 1, week: 1, weekday: '월', title: '입사' },
  evidence: [],
  sentences: [],
  events: [
    { id: 'start', trigger: { type: 'dayStart' }, effects: [] },
    {
      id: 'laptop',
      trigger: { type: 'interact', objectId: 'interact_laptop', after: 'start' },
      hint: '책상 위 노트북을 눌러 보세요.',
      effects: [],
    },
    {
      id: 'wait',
      trigger: { type: 'afterEvent', eventId: 'laptop', delaySec: 5 },
      hint: '기다리면 일어나는 사건의 힌트는 쓰지 않는다',
      effects: [],
    },
    {
      id: 'quiet',
      trigger: { type: 'interact', objectId: 'btn_quiet', after: 'laptop' },
      effects: [],
    },
    {
      id: 'phone',
      trigger: { type: 'interact', objectId: 'interact_phone', after: 'laptop' },
      hint: '휴대폰을 확인해 보세요.',
      effects: [],
    },
    {
      id: 'last',
      trigger: { type: 'interact', objectId: 'btn_last', after: 'phone' },
      hint: '마지막 버튼을 눌러 보세요.',
      effects: [{ type: 'dayEnd' }],
    },
  ],
}

const press = (state: ReturnType<typeof newStory>, objectId: string) =>
  signal(state, script, { type: 'interact', objectId }).state

describe('막혔을 때의 힌트', () => {
  const started = startDay(newStory(), script).state

  it('지금 일어날 수 있는 사건의 힌트를 준다', () => {
    expect(hintOf(started, script)).toBe('책상 위 노트북을 눌러 보세요.')
  })

  it('사건이 실행되면 다음 사건의 힌트로 넘어간다. 힌트를 적지 않은 사건과 기다리는 사건은 건너뛴다', () => {
    const next = press(started, 'interact_laptop')
    expect(hintOf(next, script)).toBe('휴대폰을 확인해 보세요.')
  })

  it('앞선 사건이 끝나지 않은 사건의 힌트는 주지 않는다', () => {
    expect(hintOf(started, script)).not.toBe('휴대폰을 확인해 보세요.')
  })

  it('하루가 끝났거나 남은 사건이 없으면 힌트가 없다', () => {
    let state = press(started, 'interact_laptop')
    state = press(state, 'interact_phone')
    expect(hintOf(state, script)).toBe('마지막 버튼을 눌러 보세요.')
    state = press(state, 'btn_last')
    expect(hintOf(state, script)).toBeNull()
  })

  it('1일차 대본은 플레이어가 해야 하는 사건마다 힌트가 있다', () => {
    const missing = day1.events
      .filter((event) => event.trigger.type === 'interact' && !event.hint)
      // 면접 영상이 끝나는 것은 기다리면 오는 신호라 힌트가 없다
      .filter((event) => event.id !== 'd1_interview_end')
      .map((event) => event.id)
    expect(missing).toEqual([])
    expect(hintOf(startDay(newStory(), day1).state, day1)).toBeTruthy()
  })
})
