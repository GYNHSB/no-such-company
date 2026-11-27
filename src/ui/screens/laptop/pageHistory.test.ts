import { describe, expect, it } from 'vitest'
import { back, forward, start, visit } from './pageHistory'

describe('pageHistory', () => {
  it('뒤로 간 뒤 새 페이지로 가면 앞으로 기록을 버린다', () => {
    let h = visit(visit(start('a'), 'b'), 'c')
    h = back(back(h))
    expect(h.pages[h.index]).toBe('a')
    expect(back(h)).toBe(h)
    h = forward(h)
    expect(h.pages[h.index]).toBe('b')
    h = visit(h, 'd')
    expect(h.pages).toEqual(['a', 'b', 'd'])
    expect(forward(h)).toBe(h)
  })

  it('같은 페이지를 다시 누르면 기록이 늘지 않는다', () => {
    const h = start('a')
    expect(visit(h, 'a')).toBe(h)
  })
})
