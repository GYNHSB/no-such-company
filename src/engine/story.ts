import { BLANK_MAX_WRONG_IN_A_ROW, SUSPICION } from '@/data/rules'
import type { Choice, DayNumber, DayScript, Effect, Message, Trigger } from '@/data/types'
import { balanceOf, checkTransfer, emptyBank, type Bank, type TransferRequest } from './bank'
import { phoneSignal } from './phoneSignal'

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
  /** 노트북에 띄울 화면. null이면 대본이 아직 정하지 않았다 */
  laptop: string | null
  /** 지금 띄울 날짜 카드 문구. 화면이 카드를 다 보여 주면 closeDateCard로 비운다 */
  dateCard: string | null
  /** 지금까지 띄우라고 한 혼잣말 줄. 화면은 새로 늘어난 줄만 창에 넘긴다 */
  said: string[]
  /** 맞춘 빈칸 문장 id. 날이 바뀌어도 이어진다 */
  solved: string[]
  /** 문장마다 연달아 틀린 횟수. 맞추면 지우고, 날이 바뀌면 모두 지운다 */
  wrong: Record<string, number>
  /** 은행 장부. 내 명의의 계좌와 거래. 대본의 효과와 플레이어의 송금이 바꾼다 */
  bank: Bank
}

/** 빈칸 문장 하나의 판정 결과. solved: 맞음, wrong: 틀림, locked: 연달아 틀려 오늘은 더 못 맞춤. 없으면 아직 맞춰 보지 않았다 */
export type SentenceResult = 'solved' | 'wrong' | 'locked'

/** 엔진에 알리는 일. Trigger에서 엔진이 스스로 살피는 것(afterEvent, balance)을 뺀 것 */
export type Signal = Exclude<Trigger, { type: 'afterEvent' } | { type: 'balance' }>

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
    laptop: null,
    dateCard: null,
    said: [],
    solved: [],
    wrong: {},
    bank: emptyBank(),
  }
}

/** 하루를 시작한다. 경계심, 증거, 기록, 메시지, 맞춘 문장, 은행 장부는 이어지고 그날의 사건 기록, 목표, 장면, 날짜 카드, 틀린 횟수는 비운다 */
export function startDay(prev: StoryState, script: DayScript): Step {
  const state: StoryState = {
    ...structuredClone(prev),
    day: script.info.day,
    fired: [],
    goal: null,
    scene: null,
    choice: null,
    dateCard: null,
    wrong: {},
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

/**
 * 빈칸 문장에 증거 카드를 놓고 "맞춰 보기"를 눌렀을 때. cardIds는 빈칸 순서대로 놓은 카드 id다.
 * 맞으면 맞춘 문장으로 적고 sentenceSolved 신호를 낸다. 틀리면 연달아 틀린 횟수를 올린다.
 * 이미 맞췄거나, 오늘 더 못 맞추거나, 아직 열리지 않은 문장이면 아무것도 하지 않는다.
 */
export function submitSentence(
  prev: StoryState,
  script: DayScript,
  sentenceId: string,
  cardIds: string[],
): Step {
  const sentence = script.sentences.find((s) => s.id === sentenceId)
  if (!sentence || sentence.day > prev.day || sentenceResult(prev, sentenceId) === 'solved')
    return { state: prev, later: [] }
  if (sentenceResult(prev, sentenceId) === 'locked') return { state: prev, later: [] }

  // 가지고 있는 카드를 정답 순서대로 놓아야 맞다
  const right =
    cardIds.length === sentence.answers.length &&
    sentence.answers.every((answer, i) => cardIds[i] === answer && prev.evidence.includes(answer))
  return run(structuredClone(prev), (s, later) => {
    if (!right) {
      s.wrong[sentenceId] = (s.wrong[sentenceId] ?? 0) + 1
      return
    }
    delete s.wrong[sentenceId]
    s.solved.push(sentenceId)
    emit(s, script, { type: 'sentenceSolved', sentenceId }, later)
  })
}

/** 빈칸 문장 하나의 판정 결과. 화면은 이 값으로 맞음, 틀림, 잠김을 보여 준다 */
export function sentenceResult(state: StoryState, sentenceId: string): SentenceResult | undefined {
  if (state.solved.includes(sentenceId)) return 'solved'
  const wrong = state.wrong[sentenceId] ?? 0
  if (wrong >= BLANK_MAX_WRONG_IN_A_ROW) return 'locked'
  return wrong > 0 ? 'wrong' : undefined
}

/**
 * 플레이어가 은행 앱에서 송금했을 때. 보낼 수 없으면(checkTransfer가 ok가 아니면) 아무것도 하지 않는다.
 * 장부에 나가는 거래를 적고, 대본이 반응할 수 있게 phone_transfer:받는사람 신호를 낸다.
 */
export function transfer(prev: StoryState, script: DayScript, request: TransferRequest): Step {
  if (checkTransfer(prev.bank, request) !== 'ok') return { state: prev, later: [] }
  return run(structuredClone(prev), (s, later) => {
    const mine = s.bank.entries.filter((entry) => entry.by === 'player').length
    s.bank.entries.push({
      id: `transfer-${mine + 1}`,
      accountId: request.from,
      amount: -request.amount,
      counterparty: request.to.trim(),
      memo: request.memo,
      time: request.time,
      day: script.info,
      by: 'player',
    })
    emit(s, script, { type: 'interact', objectId: phoneSignal.transfer(request.to) }, later)
    checkBalances(s, script, later)
  })
}

/** 특수 장면 화면이 끝났을 때 */
export function endScene(prev: StoryState): StoryState {
  return { ...prev, scene: null }
}

/** 날짜 카드를 다 보여 줬을 때 */
export function closeDateCard(prev: StoryState): StoryState {
  return { ...prev, dateCard: null }
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
  for (const e of script.events) {
    const t = e.trigger
    // 대본 순서보다 먼저 누른 것은 무시한다
    if (t.type === 'interact' && t.after && !s.fired.includes(t.after)) continue
    if (matches(t, sig)) fire(s, script, e.id, later)
  }
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
      case 'monologue':
        s.said.push(...fx.lines)
        break
      case 'dateCard':
        s.dateCard = fx.text
        break
      case 'laptop':
        s.laptop = fx.screen
        break
      case 'bankOpen':
        if (s.bank.accounts.some((a) => a.id === fx.account.id)) break
        s.bank.accounts.push({ ...fx.account, day: script.info, time: fx.time ?? fx.notice?.time })
        if (fx.notice) s.messages.push(fx.notice)
        checkBalances(s, script, later)
        break
      case 'bankEntry':
        if (s.bank.entries.some((e) => e.id === fx.entry.id)) break
        s.bank.entries.push({ ...fx.entry, day: script.info, by: 'script' })
        if (fx.notice) s.messages.push(fx.notice)
        checkBalances(s, script, later)
        break
    }
  }
}

/** 장부가 바뀐 뒤, 잔액 조건(balance 트리거)이 맞게 된 사건을 실행한다. 없는 계좌는 조건을 보지 않는다 */
function checkBalances(s: StoryState, script: DayScript, later: Later) {
  for (const e of script.events) {
    const t = e.trigger
    if (t.type !== 'balance' || s.fired.includes(e.id)) continue
    if (!s.bank.accounts.some((a) => a.id === t.accountId)) continue
    const balance = balanceOf(s.bank, t.accountId)
    if (t.atMost !== undefined && balance > t.atMost) continue
    if (t.atLeast !== undefined && balance < t.atLeast) continue
    fire(s, script, e.id, later)
  }
}
