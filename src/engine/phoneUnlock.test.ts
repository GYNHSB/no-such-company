import { describe, expect, it } from 'vitest'
import type { DayScript } from '@/data/types'
import { phoneUnlock, unlockedIn } from './phoneUnlock'
import { newStory, signal } from './story'

describe('휴대폰에 생기는 것', () => {
  it('처음에는 아무것도 없다', () => {
    expect(unlockedIn(newStory().flags)).toEqual([])
  })

  it('대본의 사건이 기록을 남기면 생기고, false로 바꾸면 다시 없어진다', () => {
    const script: DayScript = {
      info: { day: 5, week: 7, weekday: '목', title: '결단' },
      evidence: [],
      sentences: [],
      events: [
        {
          id: 'd5_install',
          trigger: { type: 'interact', objectId: 'interact_phone' },
          effects: [{ type: 'flag', key: phoneUnlock('remote_admin'), value: true }],
        },
        {
          id: 'd5_remove',
          trigger: { type: 'interact', objectId: 'btn_remove' },
          effects: [{ type: 'flag', key: phoneUnlock('remote_admin'), value: false }],
        },
      ],
    }
    const { state } = signal(newStory(5), script, { type: 'interact', objectId: 'interact_phone' })
    expect(unlockedIn(state.flags)).toEqual(['remote_admin'])
    const removed = signal(state, script, { type: 'interact', objectId: 'btn_remove' }).state
    expect(unlockedIn(removed.flags)).toEqual([])
  })

  it('엔딩용 기록 같은 다른 기록은 섞이지 않고, 순서는 늘 같다', () => {
    const flags = {
      reported: true,
      [phoneUnlock('remote_admin')]: true,
      [phoneUnlock('blabla')]: true,
    }
    expect(unlockedIn(flags)).toEqual(['blabla', 'remote_admin'])
  })
})
