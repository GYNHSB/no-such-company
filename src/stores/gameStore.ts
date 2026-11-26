import { create } from 'zustand'

/** 지금 보여줄 화면. 게임은 URL 라우팅 대신 이 상태로 화면을 전환한다. */
export type Screen = 'title' | 'world'

/** 방 안에서 무엇을 보고 있는지. room: 방을 걸어 다님, laptop: 의자에 앉아 노트북을 봄, phone: 휴대폰을 손에 쥠 */
export type View = 'room' | 'laptop' | 'phone'

interface GameState {
  screen: Screen
  view: View
  /** 책상 위 휴대폰을 집었는지. 집은 뒤에는 책상에서 사라지고 언제든 꺼낼 수 있다. */
  hasPhone: boolean
  /** 화면 가운데 점이 가리키는 누를 수 있는 물건(room.glb의 interact_* 이름). 없으면 null */
  aim: string | null
  start: () => void
  /** 보는 것을 바꾼다. 휴대폰을 한 번 열면 집은 것으로 친다. */
  openView: (view: View) => void
  aimAt: (id: string | null) => void
}

export const useGameStore = create<GameState>()((set) => ({
  screen: 'title',
  view: 'room',
  hasPhone: false,
  aim: null,
  start: () => set({ screen: 'world' }),
  openView: (view) => set((state) => ({ view, hasPhone: state.hasPhone || view === 'phone' })),
  aimAt: (aim) => set({ aim }),
}))
