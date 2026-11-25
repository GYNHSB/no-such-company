import { create } from 'zustand'

/** 지금 보여줄 화면. 게임은 URL 라우팅 대신 이 상태로 화면을 전환한다. */
export type Screen = 'title' | 'world'

interface GameState {
  screen: Screen
  start: () => void
}

export const useGameStore = create<GameState>()((set) => ({
  screen: 'title',
  start: () => set({ screen: 'world' }),
}))
