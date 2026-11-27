import { describe, expect, it } from 'vitest'
import { addMinutes, daysAgo, formatDate, formatDayTime, formatMonthDay } from './clock'

describe('addMinutes', () => {
  it('분을 더한다', () => {
    expect(addMinutes('11:27', 0)).toBe('11:27')
    expect(addMinutes('11:27', 4)).toBe('11:31')
  })

  it('시가 넘어가면 시를 올린다', () => {
    expect(addMinutes('09:58', 5)).toBe('10:03')
  })

  it('자정을 넘기면 00:00부터 다시 센다', () => {
    expect(addMinutes('23:59', 1)).toBe('00:00')
  })
})

describe('daysAgo', () => {
  it('같은 날이면 시각이 달라도 0이다', () => {
    expect(daysAgo(new Date(2026, 10, 27, 23, 59), new Date(2026, 10, 27, 0, 1))).toBe(0)
  })

  it('자정을 넘기면 하루 전이다', () => {
    expect(daysAgo(new Date(2026, 10, 27, 0, 1), new Date(2026, 10, 26, 23, 59))).toBe(1)
  })

  it('달이 바뀌어도 날 수를 센다', () => {
    expect(daysAgo(new Date(2026, 11, 9), new Date(2026, 10, 23))).toBe(16)
  })
})

describe('formatDate', () => {
  it('월, 일, 요일을 보여 준다', () => {
    expect(formatMonthDay(new Date(2026, 10, 27))).toBe('11월 27일')
    expect(formatDate(new Date(2026, 10, 27))).toBe('11월 27일 (금)')
  })
})

describe('formatDayTime', () => {
  const today = new Date(2026, 10, 27, 15, 0)

  it('오늘과 어제는 말로, 그 전은 날짜로 보여 준다', () => {
    expect(formatDayTime(today, new Date(2026, 10, 27), '15:11')).toBe('오늘 15:11')
    expect(formatDayTime(today, new Date(2026, 10, 26), '09:03')).toBe('어제 09:03')
    expect(formatDayTime(today, new Date(2026, 10, 23), '10:11')).toBe('11월 23일 (월) 10:11')
  })
})
