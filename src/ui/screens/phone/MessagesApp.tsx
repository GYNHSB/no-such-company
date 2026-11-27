import { useEffect, useRef, useState } from 'react'
import type { Message } from '@/data/types'
import { Bubble } from '@/ui/kit/phone/Bubble'
import { PhoneScreen } from '@/ui/kit/phone/PhoneScreen'
import styles from './MessagesApp.module.css'

interface Props {
  /** 지금 시각 "10:11". 상태 표시줄에 쓴다 */
  time: string
  /** 받은 문자만, 도착한 순서대로 넘긴다. 보낸 사람(from)이 같으면 한 대화로 묶는다 */
  messages: Message[]
  /** 처음부터 열어 둘 대화의 보낸 사람. 잠금 화면 알림을 눌러 들어올 때 쓴다 */
  defaultThread?: string
  /** 대화 목록에서 대화를 열었을 때. 읽은 문자로 무엇을 할지는 받는 쪽이 정한다 */
  onOpenThread?: (from: string) => void
}

interface Thread {
  from: string
  messages: Message[]
  /** 마지막 문자가 전체에서 몇 번째로 도착했는지. 목록 순서를 정한다 */
  last: number
}

/** 보낸 사람별로 묶는다. 마지막 문자가 늦게 온 대화가 위로 온다 */
const toThreads = (messages: Message[]): Thread[] => {
  const threads = new Map<string, Thread>()
  messages.forEach((message, index) => {
    const thread = threads.get(message.from) ?? { from: message.from, messages: [], last: index }
    thread.messages.push(message)
    thread.last = index
    threads.set(message.from, thread)
  })
  return [...threads.values()].sort((a, b) => b.last - a.last)
}

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

/** 휴대폰 문자 앱. 대화 목록에서 대화를 누르면 대화방이 열린다 */
export function MessagesApp({ time, messages, defaultThread, onOpenThread }: Props) {
  const [open, setOpen] = useState(defaultThread ?? null)
  // 대화마다 몇 통까지 읽었는지. 그 뒤에 온 문자가 있으면 읽지 않은 대화다
  const [read, setRead] = useState<Record<string, number>>({})
  const endRef = useRef<HTMLDivElement>(null)

  const threads = toThreads(messages)
  const thread = threads.find((t) => t.from === open)
  const count = thread?.messages.length ?? 0

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
              const unread = t.messages.length > (read[t.from] ?? 0)
              return (
                <li key={t.from}>
                  <button
                    type="button"
                    className={styles.row}
                    onClick={() => {
                      setOpen(t.from)
                      onOpenThread?.(t.from)
                    }}
                  >
                    <span className={styles.dot}>
                      {unread && <i role="img" aria-label="읽지 않음" />}
                    </span>
                    <Avatar />
                    <span className={styles.rowText}>
                      <span className={styles.rowHead}>
                        <span className={styles.rowName}>{t.from}</span>
                        <time className={styles.rowTime}>{newest.time}</time>
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

  const back = () => {
    setRead((prev) => ({ ...prev, [thread.from]: thread.messages.length }))
    setOpen(null)
  }

  return (
    <PhoneScreen time={time}>
      <div className={styles.thread}>
        <header className={styles.threadHead}>
          <button type="button" className={styles.back} onClick={back} aria-label="대화 목록으로">
            ‹
          </button>
          <Avatar />
          <h1 className={styles.threadName}>{thread.from}</h1>
        </header>
        <ol className={styles.bubbles}>
          {thread.messages.map((message, index) => {
            const prev = thread.messages[index - 1]
            const next = thread.messages[index + 1]
            return (
              <li key={message.id} className={styles.bubbleItem}>
                {prev?.time !== message.time && (
                  <time className={styles.stamp}>오늘 {message.time}</time>
                )}
                <Bubble side="in" text={message.body} tail={next?.time !== message.time} />
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
