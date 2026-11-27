import { useEffect, useRef, useState } from 'react'
import type { Message } from '@/data/types'
import { Bubble } from '@/ui/kit/phone/Bubble'
import { PhoneScreen } from '@/ui/kit/phone/PhoneScreen'
import { daysAgo, formatDate, formatMonthDay } from './clock'
import styles from './MessagesApp.module.css'

/** 받은 문자. 대본의 Message에 받은 날을 붙인 것이다 */
export type ReceivedMessage = Message & {
  /** 받은 날. 시각은 Message의 time을 쓰고, 여기서는 날짜만 본다 */
  date: Date
}

interface Props {
  /** 지금 시각 "10:11". 상태 표시줄에 쓴다 */
  time: string
  /** 오늘 날짜. 문자를 받은 날이 오늘인지, 어제인지, 그 전인지 가린다 */
  today: Date
  /** 지금까지 받은 문자를 받은 순서대로 모두 넘긴다. 보낸 사람(from)이 같으면 한 대화로 묶는다 */
  messages: ReceivedMessage[]
  /** 이미 읽은 문자의 id. 여기에 없는 문자가 있는 대화에는 읽지 않음 점이 붙는다 */
  readIds: readonly string[]
  /** 대화방에서 문자가 화면에 보였을 때. 받는 쪽이 readIds에 더해서 다시 넘긴다 */
  onRead: (ids: string[]) => void
  /** 처음부터 열어 둘 대화의 보낸 사람. 잠금 화면 알림을 눌러 들어올 때 쓴다 */
  defaultThread?: string
}

interface Thread {
  from: string
  messages: ReceivedMessage[]
  /** 마지막 문자가 전체에서 몇 번째로 도착했는지. 목록 순서를 정한다 */
  last: number
}

/** 보낸 사람별로 묶는다. 마지막 문자가 늦게 온 대화가 위로 온다 */
const toThreads = (messages: ReceivedMessage[]): Thread[] => {
  const threads = new Map<string, Thread>()
  messages.forEach((message, index) => {
    const thread = threads.get(message.from) ?? { from: message.from, messages: [], last: index }
    thread.messages.push(message)
    thread.last = index
    threads.set(message.from, thread)
  })
  return [...threads.values()].sort((a, b) => b.last - a.last)
}

/** 대화 목록 오른쪽 위: 오늘이면 시각, 어제면 "어제", 그 전이면 "11월 23일" */
const listTime = (today: Date, message: ReceivedMessage) => {
  const ago = daysAgo(today, message.date)
  if (ago <= 0) return message.time
  return ago === 1 ? '어제' : formatMonthDay(message.date)
}

/** 대화방 구분선: "오늘 15:11", "어제 15:11", "11월 23일 (월) 10:11" */
const stamp = (today: Date, message: ReceivedMessage) => {
  const ago = daysAgo(today, message.date)
  const day = ago <= 0 ? '오늘' : ago === 1 ? '어제' : formatDate(message.date)
  return `${day} ${message.time}`
}

/** 같은 날 같은 분에 온 문자는 한 묶음으로 본다 */
const sameMoment = (a: ReceivedMessage | undefined, b: ReceivedMessage) =>
  a !== undefined && a.time === b.time && daysAgo(a.date, b.date) === 0

/** 연락처 사진 자리의 사람 모양 */
function Avatar() {
  return (
    <svg className={styles.avatar} viewBox="0 0 40 40" aria-hidden="true">
      <circle className={styles.avatarBack} cx="20" cy="20" r="20" />
      <circle cx="20" cy="15.5" r="6.5" fill="currentColor" />
      <path d="M7.5 34a12.5 11 0 0 1 25 0a20 20 0 0 1-25 0z" fill="currentColor" />
    </svg>
  )
}

/**
 * 휴대폰 문자 앱. 대화 목록에서 대화를 누르면 대화방이 열린다.
 * 받은 문자와 읽음 여부는 밖에서 받는다. 화면은 어느 대화를 열었는지만 기억한다.
 */
export function MessagesApp({ time, today, messages, readIds, onRead, defaultThread }: Props) {
  const [open, setOpen] = useState(defaultThread ?? null)
  const endRef = useRef<HTMLDivElement>(null)

  const threads = toThreads(messages)
  const thread = threads.find((t) => t.from === open)
  const count = thread?.messages.length ?? 0
  const isUnread = (message: ReceivedMessage) => !readIds.includes(message.id)
  // 열려 있는 대화에서 아직 읽음으로 넘기지 않은 문자
  const unreadKey = (thread?.messages ?? [])
    .filter(isUnread)
    .map((m) => m.id)
    .join('\n')

  // 대화방에 보인 문자는 읽은 것으로 알린다. 열어 둔 채 새 문자가 와도 마찬가지다
  useEffect(() => {
    if (unreadKey) onRead(unreadKey.split('\n'))
  }, [unreadKey, onRead])

  // 대화방에 새 문자가 오면 맨 아래가 보이게 한다
  useEffect(() => {
    if (count > 0) endRef.current?.scrollIntoView({ block: 'end' })
  }, [count])

  if (!thread) {
    return (
      <PhoneScreen time={time} title="메시지">
        {threads.length === 0 ? (
          <p className={styles.empty}>메시지 없음</p>
        ) : (
          <ul className={styles.list}>
            {threads.map((t) => {
              const newest = t.messages[t.messages.length - 1]
              return (
                <li key={t.from}>
                  <button type="button" className={styles.row} onClick={() => setOpen(t.from)}>
                    <span className={styles.dot}>
                      {t.messages.some(isUnread) && <i role="img" aria-label="읽지 않음" />}
                    </span>
                    <Avatar />
                    <span className={styles.rowText}>
                      <span className={styles.rowHead}>
                        <span className={styles.rowName}>{t.from}</span>
                        <time className={styles.rowTime}>{listTime(today, newest)}</time>
                      </span>
                      <span className={styles.preview}>{newest.body}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </PhoneScreen>
    )
  }

  return (
    <PhoneScreen time={time}>
      <div className={styles.thread}>
        <header className={styles.threadHead}>
          <button
            type="button"
            className={styles.back}
            onClick={() => setOpen(null)}
            aria-label="대화 목록으로"
          >
            ‹
          </button>
          <Avatar />
          <h1 className={styles.threadName}>{thread.from}</h1>
        </header>
        <ol className={styles.bubbles}>
          {thread.messages.map((message, index) => {
            const next = thread.messages[index + 1]
            return (
              <li key={message.id} className={styles.bubbleItem}>
                {!sameMoment(thread.messages[index - 1], message) && (
                  <time className={styles.stamp}>{stamp(today, message)}</time>
                )}
                <Bubble
                  side="in"
                  text={message.body}
                  tail={next === undefined || !sameMoment(message, next)}
                />
              </li>
            )
          })}
        </ol>
        <div ref={endRef} />
        {/* 답장은 보낼 수 없다. 입력란은 모양만 있다 */}
        <div className={styles.input} aria-hidden="true">
          <span>문자 메시지</span>
        </div>
      </div>
    </PhoneScreen>
  )
}
