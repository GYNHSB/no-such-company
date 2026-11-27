import { describe, expect, it } from 'vitest'
import { wipedCount } from './remoteWipeTargets'

describe('wipedCount', () => {
  it('진행률에 맞춰 지운 항목 수를 늘리고 전체를 넘지 않는다', () => {
    expect(wipedCount(0, 6)).toBe(0)
    expect(wipedCount(0.49, 6)).toBe(2)
    expect(wipedCount(1, 6)).toBe(6)
    expect(wipedCount(1.2, 6)).toBe(6)
  })
})
