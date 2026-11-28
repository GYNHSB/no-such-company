import { create } from 'zustand'
import { useGameStore, type LaptopScreen } from './gameStore'

/** 노트북 브라우저의 탭으로 뜨는 사이트. 화상 면접이나 모레온 워크처럼 화면 전체를 쓰는 것은 탭이 아니다 */
export const BROWSER_SITES = ['jobsite', 'mail', 'search'] as const
export type BrowserSite = (typeof BROWSER_SITES)[number]

/** 브라우저의 탭 하나. 사이트이거나 새 탭(즐겨찾기가 보이는 빈 탭)이다. 같은 것은 하나만 열린다 */
export type BrowserTab = BrowserSite | 'newtab'

export const isBrowserSite = (screen: string): screen is BrowserSite =>
  (BROWSER_SITES as readonly string[]).includes(screen)

/** 노트북에 브라우저 창이 떠 있는지. 사이트가 앞에 있거나 새 탭이 앞에 있다 */
export const isBrowserScreen = (screen: string): boolean =>
  screen === 'browser' || isBrowserSite(screen)

/** 열린 탭과 앞에 있는 탭 */
export interface Tabs {
  /** 열린 탭. 왼쪽부터 */
  tabs: BrowserTab[]
  /** 앞에 있는(지금 보이는) 탭. 열린 탭이 없으면 null */
  active: BrowserTab | null
}

/** 탭을 앞으로 가져온다. 열려 있지 않으면 맨 오른쪽에 열고 앞으로 가져온다 */
export function openTab({ tabs }: Tabs, tab: BrowserTab): Tabs {
  return { tabs: tabs.includes(tab) ? tabs : [...tabs, tab], active: tab }
}

/**
 * 탭을 닫는다. 앞에 있던 탭을 닫으면 그 왼쪽 탭(없으면 오른쪽 탭)이 앞으로 온다.
 * 마지막 탭을 닫으면 열린 탭이 없어지고 브라우저 창이 닫힌다(바탕화면의 인터넷 아이콘으로 다시 연다).
 */
export function closeTab({ tabs, active }: Tabs, tab: BrowserTab): Tabs {
  const index = tabs.indexOf(tab)
  if (index < 0) return { tabs, active }
  const left = tabs.filter((t) => t !== tab)
  if (left.length === 0) return { tabs: [], active: null }
  return { tabs: left, active: active === tab ? left[Math.max(0, index - 1)] : active }
}

/**
 * 새 탭에서 즐겨찾기를 눌렀을 때. 새 탭이 그 사이트로 바뀐다.
 * 그 사이트가 이미 다른 탭에 열려 있으면 새 탭을 닫고 그 탭을 앞으로 가져온다.
 */
export function navigateTab({ tabs }: Tabs, site: BrowserSite): Tabs {
  if (tabs.includes(site)) return { tabs: tabs.filter((t) => t !== 'newtab'), active: site }
  return { tabs: tabs.map((t) => (t === 'newtab' ? site : t)), active: site }
}

interface LaptopState extends Tabs {
  /** 탭을 앞으로 가져온다. 없으면 연다 */
  open: (tab: BrowserTab) => void
  close: (tab: BrowserTab) => void
  /** 새 탭의 즐겨찾기로 사이트를 연다 */
  navigate: (site: BrowserSite) => void
  /** 새 게임을 시작할 때 부른다. 열린 탭을 모두 닫는다 */
  reset: () => void
}

/**
 * 노트북 브라우저에 열린 탭. 플레이어가 탭을 누르고 닫으면서 바뀌는 화면 상태다.
 * 대본이 사이트를 띄울 때는 showOnLaptop이 탭을 연다. 무엇을 띄웠는지(즐겨찾기의 근거)는 엔진이 기억한다.
 */
export const useLaptopStore = create<LaptopState>()((set) => ({
  tabs: [],
  active: null,
  open: (tab) => set((state) => openTab(state, tab)),
  close: (tab) => set((state) => closeTab(state, tab)),
  navigate: (site) => set((state) => navigateTab(state, site)),
  reset: () => set({ tabs: [], active: null }),
}))

/**
 * 노트북에 그 화면을 띄운다. 브라우저의 사이트면 탭을 열어 앞으로 가져오고, 그 밖의 화면은 화면 전체에 띄운다.
 * 대본의 laptop 효과와 개발용 화면 고르기가 쓴다.
 */
export function showOnLaptop(screen: LaptopScreen) {
  if (isBrowserSite(screen)) useLaptopStore.getState().open(screen)
  useGameStore.getState().setLaptopScreen(screen)
}

/** 앞에 있는 탭에 맞는 노트북 화면 값. 사이트면 그 사이트, 새 탭이면 browser, 열린 탭이 없으면 off(바탕화면) */
const screenOf = (active: BrowserTab | null): LaptopScreen =>
  active === null ? 'off' : active === 'newtab' ? 'browser' : active

/**
 * 바탕화면의 인터넷 아이콘을 눌렀을 때. 브라우저 창을 연다.
 * 열려 있던 탭이 있으면 그대로 보이고, 없으면 새 탭(즐겨찾기)이 열린다.
 */
export function openBrowser() {
  const laptop = useLaptopStore.getState()
  if (laptop.tabs.length === 0) laptop.open('newtab')
  useGameStore.getState().setLaptopScreen(screenOf(useLaptopStore.getState().active))
}

// 브라우저 창이 떠 있는 동안 앞에 있는 탭이 바뀌면 노트북에 뜬 화면 값도 맞춘다.
// 마지막 탭을 닫으면 창이 닫혀 바탕화면이 된다. 창이 떠 있지 않을 때(바탕화면, 화면 전체를 쓰는 것)는 건드리지 않는다
useLaptopStore.subscribe((state, prev) => {
  if (state.active === prev.active) return
  const game = useGameStore.getState()
  if (isBrowserScreen(game.laptopScreen)) game.setLaptopScreen(screenOf(state.active))
})
