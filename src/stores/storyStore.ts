import { create } from 'zustand'
import { day1 } from '@/data/days/day1'
import type { DayScript } from '@/data/types'
import { laptopSignal } from '@/engine/laptopSignal'
import { checkTransfer, type TransferCheck, type TransferRequest } from '@/engine/bank'
import {
  choose,
  closeDateCard,
  newStory,
  runLater,
  signal,
  startDay,
  submitSentence,
  transfer,
  type Signal,
  type Step,
  type StoryState,
} from '@/engine/story'
import { dayLabel } from '@/ui/screens/common/dayLabel'
import { useGameStore, type LaptopScreen } from './gameStore'
import { showOnLaptop, useLaptopStore } from './laptopStore'
import { useMonologueStore } from './monologueStore'
import { PHONE_CHANNELS, usePhoneStore } from './phoneStore'
import { useStoryLog } from './storyLog'

// 진행할 날의 대본을 차례대로 둔다. day2~5가 생기면 여기에 더하기만 하면 된다.
const DAYS: DayScript[] = [day1]

/** 다음 날이 있을 때, 하루가 끝난 뒤 화면 위 안내에 덧붙이는 말 */
const SLEEP_HINT = '침대에 누워 하루를 마치세요.'

/**
 * 그 날에 쓸 대본. 사건은 그 날 것만 쓰고, 증거 카드와 빈칸 문장은 첫날부터 그 날까지의 것을 모두 합친다.
 * 날이 넘어가도 앞날에 얻은 증거와 문장이 메모 앱에 남고, 엔진이 앞날의 문장도 판정할 수 있다.
 */
export function scriptOf(days: readonly DayScript[], index: number): DayScript {
  const until = days.slice(0, index + 1)
  return {
    ...days[index],
    evidence: until.flatMap((d) => d.evidence),
    sentences: until.flatMap((d) => d.sentences),
  }
}

/** 지금 날의 다음 날 대본. 마지막 날이면 null */
export function nextDayOf(state: Pick<StoryStore, 'days' | 'script'>): DayScript | null {
  const index = state.days.findIndex((d) => d.info.day === state.script.info.day)
  return index >= 0 && index + 1 < state.days.length ? scriptOf(state.days, index + 1) : null
}

/** 화면 위에 보일 안내. 하루가 끝났고 다음 날이 있으면 침대에 누우라는 말을 덧붙인다 */
export function goalOf(state: Pick<StoryStore, 'days' | 'script' | 'story'>): string | null {
  const { goal, dayOver } = state.story
  if (!dayOver || !nextDayOf(state)) return goal
  return goal ? `${goal} ${SLEEP_HINT}` : SLEEP_HINT
}

interface StoryStore {
  story: StoryState
  /** 진행할 날의 대본 전부. 차례대로 넘어간다 */
  days: DayScript[]
  /** 지금 날의 대본(scriptOf). 날짜 카드가 떠 있는 동안에는 곧 시작할 날의 대본이다 */
  script: DayScript
  /** 1일차 날짜 카드부터 다시 연다. 날짜 카드가 끝나면 그날 첫 사건이 시작된다 */
  begin: () => void
  /** 물건이나 화면 버튼을 눌렀을 때 */
  send: (sig: Signal) => void
  /** 선택지를 골랐을 때 */
  pick: (choiceId: string) => void
  /** 메모 앱에서 빈칸 문장을 맞춰 봤을 때. cardIds는 빈칸 순서대로 놓은 카드 id. 판정은 엔진이 한다 */
  submit: (sentenceId: string, cardIds: string[]) => void
  /**
   * 은행 앱에서 송금했을 때. 보낼 수 있는지는 엔진이 확인하고, 그 결과를 돌려준다.
   * ok가 아니면 아무것도 바뀌지 않는다. 화면은 돌려받은 값으로 안내를 보여 준다
   */
  transfer: (request: TransferRequest) => TransferCheck
  /**
   * 플레이어가 잠들었을 때(침대에 누웠을 때). 하루가 끝났고 다음 날이 있으면 다음 날의 날짜 카드를 띄운다.
   * 아직 하루가 끝나지 않았거나 마지막 날이면 아무 일도 없다
   */
  sleep: () => void
  /** 날짜 카드가 끝났을 때 */
  dateCardDone: () => void
}

let timers: ReturnType<typeof setTimeout>[] = []

/** 신호를 기록에 남길 이름으로 바꾼다 */
function describe(sig: Signal): string {
  switch (sig.type) {
    case 'dayStart':
      return '하루 시작'
    case 'interact':
      return sig.objectId
    case 'evidenceCollected':
      return `증거 획득 ${sig.cardId}`
    case 'sentenceSolved':
      return `문장 맞춤 ${sig.sentenceId}`
  }
}

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
    // 대본이 노트북에 띄우라고 한 화면을 순서대로 띄운다. 한 사건이 사이트 여럿을 띄우면 탭이 차례로 열린다
    for (const screen of state.laptopLog.slice(prev.laptopLog.length)) {
      showOnLaptop(screen as LaptopScreen)
    }
    if (state.suspicion !== prev.suspicion) game.setSuspicion(state.suspicion)
    if (state.webcamOn !== prev.webcamOn) game.setWebcam(state.webcamOn)

    for (const { eventId, delaySec } of later) {
      timers.push(
        setTimeout(() => {
          const before = get().story
          apply(runLater(before, get().script, eventId))
          note(`${delaySec}초 기다린 사건 ${eventId}`, before)
        }, delaySec * 1000),
      )
    }
  }

  /** 개발 모드의 "엔진 보기" 패널에 방금 알린 일과 그 결과(새로 실행된 사건)를 남긴다. 배포판에서는 남기지 않는다 */
  const note = (what: string, before: StoryState) => {
    if (!import.meta.env.DEV) return
    const after = get().story
    // 하루를 새로 시작하면 사건 기록이 비워지므로, 그때는 실행된 것 전부가 새 사건이다
    const fresh = after.day === before.day ? before.fired : []
    useStoryLog.getState().add(
      what,
      after.fired.filter((id) => !fresh.includes(id)),
    )
  }

  return {
    story: newStory(),
    days: DAYS,
    script: scriptOf(DAYS, 0),
    begin: () => {
      timers.forEach(clearTimeout)
      timers = []
      usePhoneStore.getState().reset()
      useMonologueStore.setState({ queue: [] })
      useLaptopStore.getState().reset()
      useGameStore.getState().setLaptopScreen('off')
      if (import.meta.env.DEV) useStoryLog.getState().clear()
      const first = scriptOf(get().days, 0)
      set({ story: { ...newStory(), dateCard: dayLabel(first.info) }, script: first })
    },
    send: (sig) => {
      const before = get().story
      // 날짜 카드가 떠서 날이 넘어가는 중에는 신호를 받지 않는다. 전날 대본도, 아직 시작하지 않은 다음 날 대본도 아닌 때다
      if (before.day !== get().script.info.day) return
      apply(signal(before, get().script, sig))
      note(`신호 ${describe(sig)}`, before)
    },
    pick: (choiceId) => {
      const before = get().story
      apply(choose(before, get().script, choiceId))
      note(`선택지 고름 ${choiceId}`, before)
    },
    submit: (sentenceId, cardIds) => {
      const before = get().story
      apply(submitSentence(before, get().script, sentenceId, cardIds))
      note(`빈칸 맞춰 보기 ${sentenceId} ← ${cardIds.join(', ')}`, before)
    },
    transfer: (request) => {
      const before = get().story
      const check = checkTransfer(before.bank, request)
      apply(transfer(before, get().script, request))
      note(`송금 ${request.to} ${request.amount}원 (${check})`, before)
      return check
    },
    sleep: () => {
      const { story } = get()
      const next = nextDayOf(get())
      if (!story.dayOver || story.dateCard || !next) return
      // 전날에 기다리던 사건은 버린다
      timers.forEach(clearTimeout)
      timers = []
      set({ script: next, story: { ...story, dateCard: dayLabel(next.info) } })
      if (import.meta.env.DEV) useStoryLog.getState().add(`잠듦 → ${next.info.day}일차로`, [])
    },
    dateCardDone: () => {
      const { story, script } = get()
      set({ story: closeDateCard(story) })
      // 하루를 여는 날짜 카드였으면 그날을 시작한다
      if (story.day !== script.info.day || !story.fired.length) {
        const before = get().story
        apply(startDay(before, script))
        note(`${script.info.day}일차 시작`, { ...before, fired: [] })
      }
    },
  }
})

/** 노트북 앞에 앉거나 휴대폰을 보면 그 물건을 누른 것으로 엔진에 알린다 */
const VIEW_OBJECT: Partial<Record<string, string>> = {
  laptop: 'interact_laptop',
  phone: 'interact_phone',
}
useGameStore.subscribe((s, prev) => {
  if (s.view === prev.view) return
  // 노트북을 보다가 다른 곳을 보면 노트북에서 눈을 뗀 것이다
  if (prev.view === 'laptop') {
    useStoryStore.getState().send({ type: 'interact', objectId: laptopSignal.leave() })
  }
  const objectId = VIEW_OBJECT[s.view]
  if (objectId) useStoryStore.getState().send({ type: 'interact', objectId })
  // 침대에 누우면 잠든다. 하루가 끝난 뒤라면 다음 날로 넘어간다
  if (s.view === 'bed') useStoryStore.getState().sleep()
})
