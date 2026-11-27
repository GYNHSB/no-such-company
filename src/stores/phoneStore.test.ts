import { beforeEach, describe, expect, it } from 'vitest'
import type { DayInfo, Message } from '@/data/types'
import { dateOfDay, lockNotifications, messagesOf, mondayOf, usePhoneStore } from './phoneStore'

const DAY1: DayInfo = { day: 1, week: 1, weekday: '월', title: '입사' }
const DAY2: DayInfo = { day: 2, week: 3, weekday: '수', title: '흔적' }

const sms = (id: string, from = '모레온 인사팀'): Message => ({
  id,
  channel: 'sms',
  from,
  time: '10:11',
  body: '문자',
})
const bank = (id: string): Message => ({ ...sms(id, '하나로은행'), channel: 'bank' })

const phone = () => usePhoneStore.getState()

describe('phoneStore', () => {
  beforeEach(() => {
    // 2026-11-27은 금요일이다. 그 주의 월요일은 11월 23일
    phone().reset(new Date(2026, 10, 27, 14, 30))
  })

  it('받은 메시지를 도착한 순서대로 쌓는다', () => {
    phone().receive(sms('a'), DAY1)
    phone().receive(bank('b'), DAY1)
    expect(phone().received.map((r) => r.message.id)).toEqual(['a', 'b'])
  })

  it('같은 id가 다시 오면 무시한다', () => {
    phone().receive(sms('a'), DAY1)
    phone().receive(sms('a'), DAY2)
    expect(phone().received).toHaveLength(1)
  })

  it('휴대폰 채널이 아닌 메시지는 받지 않는다', () => {
    phone().receive({ ...sms('mail'), channel: 'mail' }, DAY1)
    phone().receive({ ...sms('talk'), channel: 'messenger' }, DAY1)
    expect(phone().received).toHaveLength(0)
  })

  it('날이 바뀌어도 앞 날에 받은 메시지가 남는다', () => {
    phone().receive(sms('a'), DAY1)
    phone().receive(sms('b'), DAY2)
    expect(phone().received.map((r) => r.day.day)).toEqual([1, 2])
  })

  it('읽은 id를 한 번씩만 적는다', () => {
    phone().markRead(['a', 'b'])
    phone().markRead(['b', 'c', 'c'])
    expect(phone().readIds).toEqual(['a', 'b', 'c'])
  })

  it('이미 읽은 것만 다시 읽으면 상태가 그대로다', () => {
    phone().markRead(['a'])
    const before = phone().readIds
    phone().markRead(['a'])
    expect(phone().readIds).toBe(before)
  })

  it('문자 앱을 열 때 바로 보여 줄 대화를 함께 적는다', () => {
    phone().openApp('messages', '황보미진')
    expect(phone()).toMatchObject({ app: 'messages', thread: '황보미진' })
    phone().openApp('lock')
    expect(phone()).toMatchObject({ app: 'lock', thread: null })
  })

  it('새 게임을 시작하면 받은 메시지와 읽음을 비우고 그 주의 월요일을 기준으로 잡는다', () => {
    phone().receive(sms('a'), DAY1)
    phone().markRead(['a'])
    phone().openApp('messages', '모레온 인사팀')
    phone().reset(new Date(2026, 11, 6, 23, 59)) // 일요일 밤
    expect(phone()).toMatchObject({ received: [], readIds: [], app: 'lock', thread: null })
    expect(phone().weekOne).toEqual(new Date(2026, 10, 30))
  })
})

describe('mondayOf', () => {
  it('그 주의 월요일 0시를 돌려준다', () => {
    expect(mondayOf(new Date(2026, 10, 27, 14, 30))).toEqual(new Date(2026, 10, 23))
  })

  it('월요일이면 그 날이고, 일요일이면 엿새 전이다', () => {
    expect(mondayOf(new Date(2026, 10, 23))).toEqual(new Date(2026, 10, 23))
    expect(mondayOf(new Date(2026, 10, 29))).toEqual(new Date(2026, 10, 23))
  })
})

describe('dateOfDay', () => {
  const weekOne = new Date(2026, 10, 23)

  it('입사 1주 차 월요일은 기준 날짜 그대로다', () => {
    expect(dateOfDay(weekOne, DAY1)).toEqual(new Date(2026, 10, 23))
  })

  it('주 차와 요일만큼 더한다. 달이 넘어가도 된다', () => {
    expect(dateOfDay(weekOne, DAY2)).toEqual(new Date(2026, 11, 9)) // 3주 차 수요일
  })
})

describe('lockNotifications', () => {
  it('오늘 받았고 아직 읽지 않은 것만 남긴다', () => {
    const received = [
      { message: sms('old'), day: DAY1 },
      { message: sms('read'), day: DAY2 },
      { message: bank('new'), day: DAY2 },
    ]
    expect(lockNotifications(received, ['read'], 2).map((m) => m.id)).toEqual(['new'])
  })
})

describe('messagesOf', () => {
  it('한 채널의 메시지를 받은 날짜와 함께 준다', () => {
    const received = [
      { message: sms('a'), day: DAY1 },
      { message: bank('b'), day: DAY2 },
      { message: sms('c'), day: DAY2 },
    ]
    const result = messagesOf(received, new Date(2026, 10, 23), 'sms')
    expect(result.map((m) => m.id)).toEqual(['a', 'c'])
    expect(result.map((m) => m.date)).toEqual([new Date(2026, 10, 23), new Date(2026, 11, 9)])
  })
})
