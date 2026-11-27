import { create } from 'zustand'
import type { Channel, DayInfo, DayNumber, Message, Weekday } from '@/data/types'

/** 휴대폰으로 오는 메시지의 채널. 노트북 메일과 메신저는 여기에 담지 않는다 */
export const PHONE_CHANNELS: readonly Channel[] = ['sms', 'bank', 'sns', 'blabla']

/** 휴대폰에 떠 있는 화면(src/ui/screens/phone). 화면이 늘 때마다 추가한다 */
export type PhoneApp =
  | 'lock'
  | 'home'
  | 'messages'
  | 'bank'
  | 'notes'
  | 'photos'
  | 'sns'
  | 'phone'
  | 'blabla'
  | 'browser'

/** 받은 메시지 하나. 받은 날을 함께 적어 둔다 */
export interface Received {
  message: Message
  day: DayInfo
}

/** 통화 기록 하나 */
export interface CallLog {
  id: string
  /** 숫자만. "01000001234" */
  number: string
  /** 받은 전화(in), 건 전화(out), 못 받은 전화(missed) */
  kind: 'in' | 'out' | 'missed'
  date: Date
  /** "15:12" */
  time: string
}

/** 화면에 넘기는 모양. 받은 날을 실제 날짜로 바꿔 붙인 메시지 */
export type DatedMessage = Message & { date: Date }

interface PhoneState {
  /** 받은 메시지. 도착한 순서대로 쌓이고, 날이 바뀌어도 지우지 않는다 */
  received: Received[]
  /** 읽은 메시지의 id */
  readIds: string[]
  /** 통화 기록. 통화한 순서대로 쌓이고, 날이 바뀌어도 지우지 않는다 */
  calls: CallLog[]
  /** 지금 떠 있는 화면 */
  app: PhoneApp
  /** 문자 앱을 열 때 바로 보여 줄 대화의 보낸 사람. 없으면 대화 목록이 보인다 */
  thread: string | null
  /** 입사 1주 차 월요일. 게임을 시작할 때 한 번 정하고, 몇 일차인지를 날짜로 바꾸는 기준으로 쓴다 */
  weekOne: Date
  /** 메시지가 도착한다. 휴대폰 채널이 아니거나 이미 받은 id면 아무 일도 없다 */
  receive: (message: Message, day: DayInfo) => void
  /** 읽은 것으로 적는다 */
  markRead: (ids: string[]) => void
  /** 통화 기록에 한 건을 더한다. 전화를 걸었거나, 받았거나, 못 받았을 때 부른다 */
  logCall: (call: Omit<CallLog, 'id'>) => void
  /** 화면을 바꾼다. 문자 앱은 바로 보여 줄 대화를 함께 넘길 수 있다 */
  openApp: (app: PhoneApp, thread?: string) => void
  /** 새 게임을 시작할 때 부른다. 받은 메시지와 통화 기록을 비우고 날짜 기준을 지금 날짜로 다시 잡는다 */
  reset: (now?: Date) => void
}

const WEEKDAYS: readonly Weekday[] = ['월', '화', '수', '목', '금', '토', '일']

/** 그 날이 든 주의 월요일 0시 */
export const mondayOf = (date: Date): Date => {
  const sinceMonday = (date.getDay() + 6) % 7
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - sinceMonday)
}

/** 몇 일차인지를 실제 날짜로 바꾼다. 입사 1주 차 월요일에서 주 차와 요일만큼 더한다 */
export const dateOfDay = (weekOne: Date, day: DayInfo): Date =>
  new Date(
    weekOne.getFullYear(),
    weekOne.getMonth(),
    weekOne.getDate() + (day.week - 1) * 7 + WEEKDAYS.indexOf(day.weekday),
  )

/** 잠금 화면 알림: 오늘 받았고 아직 읽지 않은 메시지 */
export const lockNotifications = (
  received: readonly Received[],
  readIds: readonly string[],
  today: DayNumber,
): Message[] =>
  received
    .filter((r) => r.day.day === today && !readIds.includes(r.message.id))
    .map((r) => r.message)

/** 한 채널에서 지금까지 받은 메시지 전부. 받은 날짜를 붙여서 준다 */
export const messagesOf = (
  received: readonly Received[],
  weekOne: Date,
  channel: Channel,
): DatedMessage[] =>
  received
    .filter((r) => r.message.channel === channel)
    .map((r) => ({ ...r.message, date: dateOfDay(weekOne, r.day) }))

/**
 * 휴대폰 안의 내용. 방 안 물건으로서의 휴대폰(집었는지, 진동)은 gameStore가 맡는다.
 * 위의 뽑는 함수들은 매번 새 배열을 만드니 훅의 선택 함수로 쓰지 말고,
 * received, readIds, weekOne을 꺼낸 뒤 계산한다.
 */
let callCount = 0

export const usePhoneStore = create<PhoneState>()((set) => ({
  received: [],
  readIds: [],
  calls: [],
  app: 'lock',
  thread: null,
  weekOne: mondayOf(new Date()),
  receive: (message, day) =>
    set((state) =>
      !PHONE_CHANNELS.includes(message.channel) ||
      state.received.some((r) => r.message.id === message.id)
        ? state
        : { received: [...state.received, { message, day }] },
    ),
  markRead: (ids) =>
    set((state) => {
      const fresh = ids.filter((id) => !state.readIds.includes(id))
      return fresh.length === 0 ? state : { readIds: [...state.readIds, ...new Set(fresh)] }
    }),
  logCall: (call) =>
    set((state) => ({ calls: [...state.calls, { ...call, id: `call-${callCount++}` }] })),
  openApp: (app, thread) => set({ app, thread: thread ?? null }),
  reset: (now = new Date()) =>
    set({
      received: [],
      readIds: [],
      calls: [],
      app: 'lock',
      thread: null,
      weekOne: mondayOf(now),
    }),
}))
