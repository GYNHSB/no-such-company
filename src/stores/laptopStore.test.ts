import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from './gameStore'
import {
  closeTab,
  navigateTab,
  openBrowser,
  openTab,
  showOnLaptop,
  useLaptopStore,
  type Tabs,
} from './laptopStore'

const none: Tabs = { tabs: [], active: null }

describe('탭 열고 닫기', () => {
  it('열면 맨 오른쪽에 생기고 앞으로 온다. 이미 열린 탭은 앞으로만 온다', () => {
    const two = openTab(openTab(none, 'jobsite'), 'mail')
    expect(two).toEqual({ tabs: ['jobsite', 'mail'], active: 'mail' })
    expect(openTab(two, 'jobsite')).toEqual({ tabs: ['jobsite', 'mail'], active: 'jobsite' })
  })

  it('앞에 있던 탭을 닫으면 왼쪽 탭이, 왼쪽이 없으면 오른쪽 탭이 앞으로 온다', () => {
    const three: Tabs = { tabs: ['jobsite', 'mail', 'search'], active: 'mail' }
    expect(closeTab(three, 'mail')).toEqual({ tabs: ['jobsite', 'search'], active: 'jobsite' })
    expect(closeTab({ ...three, active: 'jobsite' }, 'jobsite')).toEqual({
      tabs: ['mail', 'search'],
      active: 'mail',
    })
  })

  it('뒤에 있던 탭을 닫아도 앞에 있는 탭은 그대로다', () => {
    const two: Tabs = { tabs: ['jobsite', 'mail'], active: 'jobsite' }
    expect(closeTab(two, 'mail')).toEqual({ tabs: ['jobsite'], active: 'jobsite' })
    expect(closeTab(two, 'search')).toEqual(two)
  })

  it('마지막 탭을 닫으면 열린 탭이 없어진다', () => {
    expect(closeTab({ tabs: ['mail'], active: 'mail' }, 'mail')).toEqual({ tabs: [], active: null })
  })

  it('새 탭에서 즐겨찾기를 누르면 새 탭이 그 사이트로 바뀐다', () => {
    const state: Tabs = { tabs: ['jobsite', 'newtab'], active: 'newtab' }
    expect(navigateTab(state, 'mail')).toEqual({ tabs: ['jobsite', 'mail'], active: 'mail' })
  })

  it('즐겨찾기의 사이트가 이미 열려 있으면 새 탭을 닫고 그 탭을 앞으로 가져온다', () => {
    const state: Tabs = { tabs: ['jobsite', 'mail', 'newtab'], active: 'newtab' }
    expect(navigateTab(state, 'jobsite')).toEqual({ tabs: ['jobsite', 'mail'], active: 'jobsite' })
  })
})

describe('노트북에 화면 띄우기', () => {
  beforeEach(() => {
    useLaptopStore.getState().reset()
    useGameStore.getState().setLaptopScreen('off')
  })

  it('브라우저의 사이트를 띄우면 탭이 열리고 노트북에 뜬 화면이 그 사이트가 된다', () => {
    showOnLaptop('jobsite')
    showOnLaptop('mail')
    showOnLaptop('jobsite')
    expect(useLaptopStore.getState()).toMatchObject({
      tabs: ['jobsite', 'mail'],
      active: 'jobsite',
    })
    expect(useGameStore.getState().laptopScreen).toBe('jobsite')
  })

  it('화면 전체를 쓰는 것을 띄워도 열린 탭은 그대로 남는다', () => {
    showOnLaptop('mail')
    showOnLaptop('interview')
    expect(useGameStore.getState().laptopScreen).toBe('interview')
    expect(useLaptopStore.getState().tabs).toEqual(['mail'])
  })

  it('브라우저가 떠 있을 때 다른 탭을 앞으로 가져오면 노트북에 뜬 화면도 따라 바뀐다', () => {
    showOnLaptop('jobsite')
    showOnLaptop('mail')
    useLaptopStore.getState().open('jobsite')
    expect(useGameStore.getState().laptopScreen).toBe('jobsite')
    // 새 탭이 앞에 오면 사이트가 아니라 브라우저 창으로 적는다
    useLaptopStore.getState().open('newtab')
    expect(useGameStore.getState().laptopScreen).toBe('browser')
  })

  it('마지막 탭을 닫으면 브라우저 창이 닫혀 바탕화면이 된다', () => {
    showOnLaptop('mail')
    useLaptopStore.getState().close('mail')
    expect(useGameStore.getState().laptopScreen).toBe('off')
    expect(useLaptopStore.getState().tabs).toEqual([])
  })

  it('바탕화면에서 인터넷을 열면 열려 있던 탭이 다시 보이고, 없으면 새 탭이 열린다', () => {
    openBrowser()
    expect(useLaptopStore.getState()).toMatchObject({ tabs: ['newtab'], active: 'newtab' })
    expect(useGameStore.getState().laptopScreen).toBe('browser')

    useLaptopStore.getState().reset()
    showOnLaptop('jobsite')
    showOnLaptop('mail')
    useGameStore.getState().setLaptopScreen('off')
    openBrowser()
    expect(useGameStore.getState().laptopScreen).toBe('mail')
    expect(useLaptopStore.getState().tabs).toEqual(['jobsite', 'mail'])
  })

  it('노트북이 꺼져 있을 때 탭을 바꿔도 노트북은 꺼진 채다', () => {
    showOnLaptop('jobsite')
    showOnLaptop('mail')
    useGameStore.getState().setLaptopScreen('off')
    useLaptopStore.getState().open('jobsite')
    expect(useGameStore.getState().laptopScreen).toBe('off')
  })
})
