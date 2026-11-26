import { beforeEach, describe, expect, it } from 'vitest'
import { useMonologueStore } from './monologueStore'

const texts = () => useMonologueStore.getState().queue.map((line) => line.text)

describe('monologueStore', () => {
  beforeEach(() => {
    useMonologueStore.setState({ queue: [] })
  })

  it('말한 순서대로 쌓이고 하나씩 넘어간다', () => {
    useMonologueStore.getState().say('첫 줄', '둘째 줄')
    useMonologueStore.getState().say('셋째 줄')
    expect(texts()).toEqual(['첫 줄', '둘째 줄', '셋째 줄'])

    useMonologueStore.getState().next()
    expect(texts()).toEqual(['둘째 줄', '셋째 줄'])
  })

  it('같은 문장을 두 번 말해도 서로 다른 줄이다', () => {
    useMonologueStore.getState().say('어?', '어?')
    const [first, second] = useMonologueStore.getState().queue
    expect(first.id).not.toBe(second.id)
  })
})
