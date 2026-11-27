import { describe, expect, it } from 'vitest'
import { BED_EYE, EYE, START } from './anchors'
import { inWebcamView, surfaceAt } from './zones'

describe('surfaceAt', () => {
  it('현관 안쪽은 타일, 방 가운데는 장판이다', () => {
    expect(surfaceAt(1.3, -2)).toBe('tile')
    expect(surfaceAt(0, 0.5)).toBe('floor')
  })
})

describe('inWebcamView', () => {
  it('노트북 앞 의자 쪽은 보인다', () => {
    expect(inWebcamView([-1.3, 1.1, 1.3])).toBe(true)
  })

  it('침대와 현관(시작 자리)은 시야 밖이다', () => {
    expect(inWebcamView(BED_EYE)).toBe(false)
    expect(inWebcamView([START.position[0], EYE, START.position[2]])).toBe(false)
  })

  it('너무 멀면 보이지 않는다', () => {
    expect(inWebcamView([-1.3, 1.5, 6])).toBe(false)
  })
})
