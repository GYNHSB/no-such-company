import { SUSPICION } from '@/data/rules'
import type { Choice, DayNumber, DayScript, Effect, Message, Trigger } from '@/data/types'

/** 대본을 진행하면서 쌓이는 상태. 화면은 이 값을 보고 그린다 */
export interface StoryState {
  day: DayNumber
  /** 이미 실행한 사건 id. 사건은 한 번만 실행된다 */
  fired: string[]
  /** 화면 위 목표 문구 */
  goal: string | null
  /** 도착한 메시지. 채널별로 나눠 보여 주는 건 화면이 한다 */
  messages: Message[]
  /** 얻은 증거 카드 id */
  evidence: string[]
  suspicion: number
  /** 엔딩 판정용 기록 */
  flags: Record<string, boolean>
  /** 지금 열린 특수 장면(화상 면접, 취임식 등). 화면이 끝나면 endScene으로 닫는다 */
  scene: string | null
  /** 지금 고르길 기다리는 선택지 */
  choice: { prompt: string; choices: Choice[] } | null
  webcamOn: boolean
}

/** 엔진에 알리는 일. Trigger에서 afterEvent를 뺀 것 */
export type Signal = Exclude<Trigger, { type: 'afterEvent' }>

/** delaySec 뒤에 runLater로 실행할 사건. 타이머는 부르는 쪽이 건다 */
export interface Delayed {
  eventId: string
  delaySec: number
}

export interface Step {
  state: StoryState
  later: Delayed[]
}

export function newStory(day: DayNumber = 1): StoryState {
  return {
    day,
    fired: [],
    goal: null,
    messages: [],
    evidence: [],
    suspicion: SUSPICION.start,
    flags: {},
    scene: null,
    choice: null,
    webcamOn: false,
  }
}

/** 하루를 시작한다. 경계심, 증거, 기록은 이어지고 그날의 사건 기록과 목표, 장면은 비운다 */
export function startDay(prev: StoryState, script: DayScript): Step {
  const state: StoryState = {
    ...structuredClone(prev),
    day: script.info.day,
    fired: [],
    goal: null,
    scene: null,
    choice: null,
  }
  return run(state, (s, later) => emit(s, script, { type: 'dayStart' }, later))
}

/** 물건을 누르거나 증거를 얻거나 문장을 맞췄을 때 */
export function signal(prev: StoryState, script: DayScript, sig: Signal): Step {
  return run(structuredClone(prev), (s, later) => emit(s, script, sig, later))
}

/** 타이머가 끝난 사건을 실행한다 */
export function runLater(prev: StoryState, script: DayScript, eventId: string): Step {
  return run(structuredClone(prev), (s, later) => fire(s, script, eventId, later))
}

/** 선택지를 고른다. 지금 선택지에 없는 id면 아무것도 하지 않는다 */
export function choose(prev: StoryState, script: DayScript, choiceId: string): Step {
  const picked = prev.choice?.choices.find((c) => c.id === choiceId)
  if (!picked) return { state: prev, later: [] }
  const state = { ...structuredClone(prev), choice: null }
  return run(state, (s, later) => applyEffects(s, script, picked.effects, later))
}

/** 특수 장면 화면이 끝났을 때 */
export function endScene(prev: StoryState): StoryState {
  return { ...prev, scene: null }
}

// ── 안쪽: state는 복사본이라 직접 바꾼다 ──

type Later = Delayed[]

function run(state: StoryState, body: (s: StoryState, later: Later) => void): Step {
  const later: Later = []
  body(state, later)
  return { state, later }
}

function matches(t: Trigger, sig: Signal): boolean {
  switch (sig.type) {
    case 'dayStart':
      return t.type === 'dayStart'
    case 'interact':
      return t.type === 'interact' && t.objectId === sig.objectId
    case 'evidenceCollected':
      return t.type === 'evidenceCollected' && t.cardId === sig.cardId
    case 'sentenceSolved':
      return t.type === 'sentenceSolved' && t.sentenceId === sig.sentenceId
  }
}

function emit(s: StoryState, script: DayScript, sig: Signal, later: Later) {
  for (const e of script.events) if (matches(e.trigger, sig)) fire(s, script, e.id, later)
}

function fire(s: StoryState, script: DayScript, eventId: string, later: Later) {
  const event = script.events.find((e) => e.id === eventId)
  if (!event || s.fired.includes(eventId)) return
  s.fired.push(eventId)
  applyEffects(s, script, event.effects, later)
  // 이 사건 뒤에 오는 사건: 기다릴 시간이 없으면 바로, 있으면 부르는 쪽 타이머로
  for (const next of script.events) {
    const t = next.trigger
    if (t.type !== 'afterEvent' || t.eventId !== eventId) continue
    if (t.delaySec) later.push({ eventId: next.id, delaySec: t.delaySec })
    else fire(s, script, next.id, later)
  }
}

function applyEffects(s: StoryState, script: DayScript, effects: Effect[], later: Later) {
  for (const fx of effects) {
    switch (fx.type) {
      case 'message':
        s.messages.push(fx.message)
        break
      case 'evidence':
        if (s.evidence.includes(fx.cardId)) break
        s.evidence.push(fx.cardId)
        emit(s, script, { type: 'evidenceCollected', cardId: fx.cardId }, later)
        break
      case 'suspicion':
        s.suspicion = Math.min(SUSPICION.max, Math.max(0, s.suspicion + fx.delta))
        break
      case 'flag':
        s.flags[fx.key] = fx.value
        break
      case 'choice':
        s.choice = { prompt: fx.prompt, choices: fx.choices }
        break
      case 'scene':
        s.scene = fx.sceneId
        break
      case 'webcam':
        s.webcamOn = fx.on
        break
      case 'goal':
        s.goal = fx.text
        break
    }
  }
}
