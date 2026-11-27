import { describe, expect, it } from 'vitest'
import { addMinutes } from './clock'

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
