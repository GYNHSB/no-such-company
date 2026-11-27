import { describe, expect, it } from 'vitest'
import { fillName, lineAt } from './videoScript'

const lines = [
  { at: 0, text: 'a' },
  { at: 5, text: 'b' },
]

describe('lineAt', () => {
  it('지금 시각까지 나온 마지막 줄을 고른다', () => {
    expect(lineAt(lines, 0)?.text).toBe('a')
    expect(lineAt(lines, 4.9)?.text).toBe('a')
    expect(lineAt(lines, 30)?.text).toBe('b')
    expect(lineAt(lines.slice(1), 1)).toBeUndefined()
  })
})

describe('fillName', () => {
  it('{name}을 모두 바꾼다', () => {
    expect(fillName('{name} 님, {name} 씨', '하나')).toBe('하나 님, 하나 씨')
  })
})
