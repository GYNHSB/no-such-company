import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from './gameStore'

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.setState({ screen: 'title' })
  })

  it('타이틀 화면에서 시작한다', () => {
    expect(useGameStore.getState().screen).toBe('title')
  })

  it('start를 호출하면 월드 화면으로 바뀐다', () => {
    useGameStore.getState().start()
    expect(useGameStore.getState().screen).toBe('world')
  })
})
