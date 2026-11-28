import { beforeEach, describe, expect, it } from 'vitest'
import type { DayScript } from '@/data/types'
import { sentenceResult } from '@/engine/story'
import { useGameStore } from './gameStore'
import { goalOf, nextDayOf, scriptOf, useStoryStore } from './storyStore'

/** 이틀 치 대본. 첫날은 증거 하나와 문장 하나를 주고 끝나고, 둘째 날은 시작하면서 안내를 바꾼다 */
const first: DayScript = {
  info: { day: 1, week: 1, weekday: '월', title: '입사' },
  evidence: [{ id: 'card_one', title: '첫날 증거', detail: '' }],
  sentences: [{ id: 's_one', day: 1, text: '첫날에 얻은 것은 [0]이다', answers: ['card_one'] }],
  events: [
    {
      id: 'd1_start',
      trigger: { type: 'dayStart' },
      effects: [{ type: 'evidence', cardId: 'card_one' }],
    },
    {
      id: 'd1_last',
      trigger: { type: 'interact', objectId: 'btn_last' },
      effects: [{ type: 'goal', text: '1일차가 끝났습니다.' }, { type: 'dayEnd' }],
    },
    {
      id: 'd1_never',
      trigger: { type: 'interact', objectId: 'interact_laptop' },
      effects: [{ type: 'flag', key: 'day1_laptop', value: true }],
    },
  ],
}
const second: DayScript = {
  info: { day: 2, week: 3, weekday: '월', title: '흔적' },
  evidence: [{ id: 'card_two', title: '둘째 날 증거', detail: '' }],
  sentences: [{ id: 's_two', day: 2, text: '둘째 날에 얻은 것은 [0]이다', answers: ['card_two'] }],
  events: [
    {
      id: 'd2_start',
      trigger: { type: 'dayStart' },
      effects: [{ type: 'goal', text: '현관의 우편물을 확인하세요.' }],
    },
    {
      id: 'd2_laptop',
      trigger: { type: 'interact', objectId: 'interact_laptop' },
      effects: [{ type: 'flag', key: 'day2_laptop', value: true }],
    },
  ],
}

const store = () => useStoryStore.getState()
const press = (objectId: string) => store().send({ type: 'interact', objectId })

/** 새 게임을 시작해 첫날의 날짜 카드까지 넘긴다 */
function startWith(days: DayScript[]) {
  useGameStore.setState({ view: 'room', seated: false })
  useStoryStore.setState({ days })
  store().begin()
  store().dateCardDone()
}

describe('여러 날 진행', () => {
  beforeEach(() => startWith([first, second]))

  it('새 게임은 첫날부터 시작한다', () => {
    expect(store().story.day).toBe(1)
    expect(store().story.fired).toEqual(['d1_start'])
    expect(store().script.info.day).toBe(1)
  })

  it('하루가 끝나기 전에는 침대에 누워도 날이 넘어가지 않는다', () => {
    useGameStore.getState().openView('bed')
    expect(store().story.dateCard).toBeNull()
    expect(store().script.info.day).toBe(1)
  })

  it('하루가 끝나면 안내에 침대에 누우라는 말이 덧붙는다', () => {
    expect(goalOf(store())).toBeNull()
    press('btn_last')
    expect(goalOf(store())).toBe('1일차가 끝났습니다. 침대에 누워 하루를 마치세요.')
  })

  it('하루가 끝난 뒤 침대에 누우면 다음 날의 날짜 카드가 뜨고, 카드가 끝나면 그날이 시작된다', () => {
    press('btn_last')
    useGameStore.getState().openView('bed')
    expect(store().story.dateCard).toBe('2일차 · 입사 3주 차')
    expect(store().story.day).toBe(1)

    store().dateCardDone()
    expect(store().story.day).toBe(2)
    expect(store().story.fired).toEqual(['d2_start'])
    expect(store().story.dayOver).toBe(false)
    expect(goalOf(store())).toBe('현관의 우편물을 확인하세요.')
  })

  it('날짜 카드가 떠 있는 동안에 들어온 신호는 무시한다', () => {
    press('btn_last')
    useGameStore.getState().openView('bed')
    // 아직 2일차가 시작되지 않았다. 노트북을 눌러도 어느 날의 사건도 일어나지 않는다
    press('interact_laptop')
    expect(store().story.flags).toEqual({})
    store().dateCardDone()
    press('interact_laptop')
    expect(store().story.flags).toEqual({ day2_laptop: true })
  })

  it('날이 넘어가도 증거와 맞춘 문장이 이어지고, 앞날의 카드와 문장이 대본에 남는다', () => {
    store().submit('s_one', ['card_one'])
    press('btn_last')
    useGameStore.getState().openView('bed')
    store().dateCardDone()

    expect(store().story.evidence).toEqual(['card_one'])
    expect(sentenceResult(store().story, 's_one')).toBe('solved')
    expect(store().script.evidence.map((c) => c.id)).toEqual(['card_one', 'card_two'])
    expect(store().script.sentences.map((s) => s.id)).toEqual(['s_one', 's_two'])
  })

  it('둘째 날에도 첫날의 문장을 맞춰 볼 수 있다', () => {
    press('btn_last')
    useGameStore.getState().openView('bed')
    store().dateCardDone()
    store().submit('s_one', ['card_one'])
    expect(sentenceResult(store().story, 's_one')).toBe('solved')
  })
})

describe('마지막 날', () => {
  beforeEach(() => startWith([first]))

  it('다음 날이 없으면 하루가 끝나도 안내를 바꾸지 않고, 침대에 누워도 그대로다', () => {
    press('btn_last')
    expect(nextDayOf(store())).toBeNull()
    expect(goalOf(store())).toBe('1일차가 끝났습니다.')
    useGameStore.getState().openView('bed')
    expect(store().story.dateCard).toBeNull()
    expect(store().story.day).toBe(1)
  })
})

describe('scriptOf', () => {
  it('사건은 그 날 것만, 증거 카드와 문장은 첫날부터 그 날까지를 합친다', () => {
    const merged = scriptOf([first, second], 1)
    expect(merged.info.day).toBe(2)
    expect(merged.events.map((e) => e.id)).toEqual(['d2_start', 'd2_laptop'])
    expect(merged.evidence).toHaveLength(2)
    expect(merged.sentences).toHaveLength(2)
    expect(scriptOf([first, second], 0).evidence).toHaveLength(1)
  })
})
