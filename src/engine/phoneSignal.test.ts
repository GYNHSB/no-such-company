import { describe, expect, it } from 'vitest'
import type { DayScript, Message } from '@/data/types'
import { phoneSignal, phoneSignalsOf } from './phoneSignal'
import { newStory, signal } from './story'

const sms: Message = {
  id: 'd4-sms-1',
  channel: 'sms',
  from: '010-0000-0000',
  time: '14:02',
  body: '전화 좀 받으세요.',
}

describe('휴대폰에서 한 일의 신호 이름', () => {
  it('한 일마다 phone_으로 시작하는 이름이 된다', () => {
    expect(phoneSignalsOf({ type: 'openNotification', message: sms })).toEqual([
      'phone_notification:d4-sms-1',
    ])
    expect(phoneSignalsOf({ type: 'call', number: '112' })).toEqual(['phone_call:112'])
    expect(phoneSignalsOf({ type: 'callConnected', number: '112' })).toEqual([
      'phone_call_connected:112',
    ])
    expect(phoneSignalsOf({ type: 'hangUp', number: '112' })).toEqual(['phone_hang_up:112'])
    expect(phoneSignalsOf({ type: 'playVideo', id: 'interview_recording' })).toEqual([
      'phone_video_play:interview_recording',
    ])
    expect(phoneSignalsOf({ type: 'endVideo', id: 'interview_recording' })).toEqual([
      'phone_video_end:interview_recording',
    ])
    expect(phoneSignalsOf({ type: 'seePhoto', postId: 'p1', index: 2 })).toEqual([
      'phone_photo:p1:2',
    ])
    expect(phoneSignalsOf({ type: 'readPost', id: 'daon' })).toEqual(['phone_post:daon'])
    expect(phoneSignalsOf({ type: 'seeRemoteAdmin' })).toEqual(['phone_remote_admin'])
  })

  it('문자 여러 통을 한 번에 읽으면 한 통마다 이름이 하나씩 나온다', () => {
    expect(phoneSignalsOf({ type: 'read', ids: ['d2-bank-open-1', 'd2-bank-open-2'] })).toEqual([
      'phone_read:d2-bank-open-1',
      'phone_read:d2-bank-open-2',
    ])
    expect(phoneSignalsOf({ type: 'read', ids: [] })).toEqual([])
  })

  it('검색어는 앞뒤 빈칸을 떼고 사이의 빈칸을 하나로 줄인다', () => {
    expect(phoneSignalsOf({ type: 'search', app: 'blabla', query: '  모레온 ' })).toEqual([
      'phone_search:blabla:모레온',
    ])
    expect(phoneSignal.search('browser', '세움  파트너스')).toBe(
      'phone_search:browser:세움 파트너스',
    )
  })

  it('대본이 그 이름을 interact 트리거로 받으면 사건이 일어난다', () => {
    const script: DayScript = {
      info: { day: 2, week: 3, weekday: '월', title: '흔적' },
      evidence: [{ id: 'bank_notice', title: '계좌 개설 알림', detail: '' }],
      sentences: [],
      events: [
        {
          id: 'd2_bank_read',
          trigger: { type: 'interact', objectId: phoneSignal.read('d2-bank-open-1') },
          effects: [{ type: 'evidence', cardId: 'bank_notice' }],
        },
      ],
    }
    let state = newStory(2)
    for (const objectId of phoneSignalsOf({ type: 'read', ids: ['d2-bank-open-1'] })) {
      state = signal(state, script, { type: 'interact', objectId }).state
    }
    expect(state.evidence).toEqual(['bank_notice'])
  })
})
