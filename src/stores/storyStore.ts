import { create } from 'zustand'
import { day1 } from '@/data/days/day1'
import type { DayScript } from '@/data/types'
import {
  choose,
  closeDateCard,
  newStory,
  runLater,
  signal,
  startDay,
  type Signal,
  type Step,
  type StoryState,
} from '@/engine/story'
import { dayLabel } from '@/ui/screens/common/dayLabel'
import { useGameStore, type LaptopScreen } from './gameStore'
import { useMonologueStore } from './monologueStore'
import { PHONE_CHANNELS, usePhoneStore } from './phoneStore'

// shortcut: 대본이 1일차만 있다. day2~5가 생기면 여기에 더하고 하루가 끝날 때 다음 날로 넘긴다.
const DAYS: DayScript[] = [day1]

interface StoryStore {
  story: StoryState
  script: DayScript
  /** 1일차 날짜 카드부터 다시 연다. 날짜 카드가 끝나면 그날 첫 사건이 시작된다 */
  begin: () => void
  /** 물건이나 화면 버튼을 눌렀을 때 */
  send: (sig: Signal) => void
  /** 선택지를 골랐을 때 */
  pick: (choiceId: string) => void
  /** 날짜 카드가 끝났을 때 */
  dateCardDone: () => void
}

let timers: ReturnType<typeof setTimeout>[] = []

export const useStoryStore = create<StoryStore>()((set, get) => {
  /** 엔진이 돌려준 새 상태를 받아, 늘어난 것만 다른 스토어로 보내고 늦게 올 사건의 타이머를 건다 */
  const apply = ({ state, later }: Step) => {
    const prev = get().story
    const script = get().script
    set({ story: state })

    const name = useGameStore.getState().playerName
    const lines = state.said.slice(prev.said.length).map((l) => l.replaceAll('{name}', name))
    if (lines.length) useMonologueStore.getState().say(...lines)

    const arrived = state.messages.slice(prev.messages.length)
    for (const m of arrived) {
      if (!PHONE_CHANNELS.includes(m.channel)) continue
      usePhoneStore.getState().receive(m, script.info)
      useGameStore.getState().buzzPhone()
    }

    const game = useGameStore.getState()
    if (state.laptop !== prev.laptop && state.laptop)
      game.setLaptopScreen(state.laptop as LaptopScreen)
    if (state.suspicion !== prev.suspicion) game.setSuspicion(state.suspicion)
    if (state.webcamOn !== prev.webcamOn) game.setWebcam(state.webcamOn)

    for (const { eventId, delaySec } of later) {
      timers.push(
        setTimeout(() => apply(runLater(get().story, get().script, eventId)), delaySec * 1000),
      )
    }
  }

  return {
    story: newStory(),
    script: DAYS[0],
    begin: () => {
      timers.forEach(clearTimeout)
      timers = []
      usePhoneStore.getState().reset()
      useMonologueStore.setState({ queue: [] })
      useGameStore.getState().setLaptopScreen('off')
      set({ story: { ...newStory(), dateCard: dayLabel(DAYS[0].info) }, script: DAYS[0] })
    },
    send: (sig) => apply(signal(get().story, get().script, sig)),
    pick: (choiceId) => apply(choose(get().story, get().script, choiceId)),
    dateCardDone: () => {
      const { story, script } = get()
      set({ story: closeDateCard(story) })
      // 하루를 여는 날짜 카드였으면 그날을 시작한다
      if (story.day !== script.info.day || !story.fired.length) apply(startDay(get().story, script))
    },
  }
})

/** 노트북 앞에 앉거나 휴대폰을 보면 그 물건을 누른 것으로 엔진에 알린다 */
const VIEW_OBJECT: Partial<Record<string, string>> = {
  laptop: 'interact_laptop',
  phone: 'interact_phone',
}
useGameStore.subscribe((s, prev) => {
  const objectId = s.view !== prev.view ? VIEW_OBJECT[s.view] : undefined
  if (objectId) useStoryStore.getState().send({ type: 'interact', objectId })
})
