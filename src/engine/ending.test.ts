import { describe, expect, it } from 'vitest'
import { decideEnding, type EndingInput } from './ending'

/** 신고하고 문장을 다 맞추고 아무것도 넘기지 않은 가장 좋은 경우 */
const best: EndingInput = {
  signedInauguration: false,
  gaveNewInfo: false,
  vanished: false,
  reported: true,
  allSentencesSolved: true,
  laptopWiped: false,
}

describe('decideEnding', () => {
  it('신고하고 문장을 다 맞추고 노트북을 지키면 휴 위험했다', () => {
    expect(decideEnding(best)).toBe('safe')
  })

  it('노트북이 원격 초기화되면 잡히지 않은 사람', () => {
    expect(decideEnding({ ...best, laptopWiped: true })).toBe('escaped')
  })

  it('잠적하거나, 신고하지 않거나, 문장을 다 맞추지 못하면 서류 위의 주범', () => {
    expect(decideEnding({ ...best, vanished: true })).toBe('scapegoat')
    expect(decideEnding({ ...best, reported: false })).toBe('scapegoat')
    expect(decideEnding({ ...best, allSentencesSolved: false })).toBe('scapegoat')
  })

  it('취임 서류에 서명하거나 새 정보를 넘기면 다른 것과 상관없이 공범', () => {
    expect(decideEnding({ ...best, signedInauguration: true })).toBe('accomplice')
    expect(decideEnding({ ...best, gaveNewInfo: true, vanished: true })).toBe('accomplice')
  })
})
