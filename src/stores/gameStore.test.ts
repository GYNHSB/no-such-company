import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from './gameStore'

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.setState({ screen: 'title', view: 'room', hasPhone: false, aim: null })
  })

  it('타이틀 화면에서 시작한다', () => {
    expect(useGameStore.getState().screen).toBe('title')
  })

  it('start를 호출하면 월드 화면으로 바뀐다', () => {
    useGameStore.getState().start()
    expect(useGameStore.getState().screen).toBe('world')
  })

  it('노트북을 열어도 휴대폰을 집은 것으로 치지 않는다', () => {
    useGameStore.getState().openView('laptop')
    expect(useGameStore.getState()).toMatchObject({ view: 'laptop', hasPhone: false })
  })

  it('휴대폰을 한 번 열면 내려놓은 뒤에도 가지고 있다', () => {
    useGameStore.getState().openView('phone')
    useGameStore.getState().openView('room')
    expect(useGameStore.getState()).toMatchObject({ view: 'room', hasPhone: true })
  })

  it('천장등과 스탠드는 누를 때마다 켜졌다 꺼진다', () => {
    useGameStore.setState({ ceilingLight: false, deskLamp: false })
    useGameStore.getState().toggleCeilingLight()
    useGameStore.getState().toggleDeskLamp()
    useGameStore.getState().toggleDeskLamp()
    expect(useGameStore.getState()).toMatchObject({ ceilingLight: true, deskLamp: false })
  })

  it('경계심은 0~100 밖으로 나가지 않는다', () => {
    useGameStore.getState().setSuspicion(130)
    expect(useGameStore.getState().suspicion).toBe(100)
    useGameStore.getState().setSuspicion(-5)
    expect(useGameStore.getState().suspicion).toBe(0)
  })
})
