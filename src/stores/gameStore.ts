import { create } from 'zustand'
import { SUSPICION } from '@/data/rules'

/** 지금 보여줄 화면. 게임은 URL 라우팅 대신 이 상태로 화면을 전환한다. */
export type Screen = 'title' | 'world'

/** 방 안에서 무엇을 보고 있는지. room: 방을 걸어 다님, seat: 의자에 앉아 둘러봄, laptop: 의자에 앉아 노트북을 봄, phone: 휴대폰을 손에 쥠, bed: 침대에 누움 */
export type View = 'room' | 'seat' | 'laptop' | 'phone' | 'bed'

/** 노트북에 떠 있는 화면(src/ui/screens/laptop). off: 아무 앱도 없는 빈 화면 */
export type LaptopScreen =
  'off' | 'jobsite' | 'mail' | 'install' | 'interview' | 'work' | 'search' | 'inauguration' | 'wipe'

interface GameState {
  screen: Screen
  view: View
  /** 의자에 앉아 있는지. 앉은 채로 노트북이나 휴대폰을 보다가 닫으면 앉은 자리로 돌아온다. */
  seated: boolean
  /** 책상 위 휴대폰을 집었는지. 집은 뒤에는 책상에서 사라지고 언제든 꺼낼 수 있다. */
  hasPhone: boolean
  /** 화면 가운데 점이 가리키는 누를 수 있는 물건(room.glb의 interact_* 이름). 없으면 null */
  aim: string | null
  /** 팀장의 경계심(0~100). 높을수록 숨과 심장 소리가 빨라진다. */
  suspicion: number
  /** 노트북 웹캠이 켜져 있는지 */
  webcamOn: boolean
  /** 밤인지. 방이 어두워지고 화면 빛이 보인다. */
  night: boolean
  /** 마지막으로 휴대폰 알림이 온 시각(performance.now(), ms). 0이면 아직 없음 */
  buzzAt: number
  /** 마지막으로 현관에 우편물이 들어온 시각(performance.now(), ms). 0이면 아직 없음 */
  mailAt: number
  /** 천장등과 책상 스탠드가 켜져 있는지. 플레이어가 스위치와 스탠드를 눌러 켜고 끈다. */
  ceilingLight: boolean
  deskLamp: boolean
  /** 노트북에 떠 있는 화면. 장면 진행(엔진)이 바꾼다 */
  laptopScreen: LaptopScreen
  /** 시작 화면에서 플레이어가 입력한 이름. 자료의 {name} 자리에 들어간다. 브라우저 밖으로 보내지 않는다. */
  playerName: string
  /** 이름을 받아 게임을 시작한다. 앞뒤 빈칸은 지운다. */
  start: (name: string) => void
  /** 보는 것을 바꾼다. 휴대폰을 한 번 열면 집은 것으로 친다. */
  openView: (view: View) => void
  /** 보던 것을 닫는다. 앉아서 노트북이나 휴대폰을 보던 중이면 앉은 자리로, 그 밖에는 방으로 돌아간다. */
  closeView: () => void
  aimAt: (id: string | null) => void
  setSuspicion: (value: number) => void
  setWebcam: (on: boolean) => void
  setNight: (night: boolean) => void
  /** 휴대폰 알림. 진동이 울린다. */
  buzzPhone: () => void
  /** 현관 문틈으로 우편물이 들어온다 */
  dropMail: () => void
  toggleCeilingLight: () => void
  toggleDeskLamp: () => void
  setLaptopScreen: (screen: LaptopScreen) => void
}

export const useGameStore = create<GameState>()((set) => ({
  screen: 'title',
  view: 'room',
  seated: false,
  hasPhone: false,
  aim: null,
  suspicion: SUSPICION.start,
  webcamOn: false,
  night: false,
  buzzAt: 0,
  mailAt: 0,
  ceilingLight: false,
  deskLamp: false,
  laptopScreen: 'off',
  playerName: '',
  start: (name) => set({ screen: 'world', playerName: name.trim() }),
  openView: (view) =>
    set((state) => ({
      view,
      // 노트북과 휴대폰은 앉은 채로도, 선 채로도 본다. 그 밖의 것을 보면 앉았는지가 정해진다
      seated: view === 'laptop' || view === 'phone' ? state.seated : view === 'seat',
      hasPhone: state.hasPhone || view === 'phone',
    })),
  closeView: () =>
    set((state) => {
      const back = state.seated && (state.view === 'laptop' || state.view === 'phone')
      return { view: back ? 'seat' : 'room', seated: back }
    }),
  aimAt: (aim) => set({ aim }),
  setSuspicion: (value) => set({ suspicion: Math.min(SUSPICION.max, Math.max(0, value)) }),
  setWebcam: (webcamOn) => set({ webcamOn }),
  setNight: (night) => set({ night }),
  buzzPhone: () => set({ buzzAt: performance.now() }),
  dropMail: () => set({ mailAt: performance.now() }),
  toggleCeilingLight: () => set((state) => ({ ceilingLight: !state.ceilingLight })),
  toggleDeskLamp: () => set((state) => ({ deskLamp: !state.deskLamp })),
  setLaptopScreen: (laptopScreen) => set({ laptopScreen }),
}))
