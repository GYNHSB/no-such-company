import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react'
import { WorkMessage } from './WorkMessage'
import styles from './WorkChannel.module.css'

export type WorkChannelMessage = ComponentProps<typeof WorkMessage> & { id: string }

interface Props {
  /** 상단 이름 바. 채널은 '# 업무', DM은 '박재훈 팀장' */
  name: string
  /** 이름 옆 짧은 설명 */
  topic?: string
  messages: WorkChannelMessage[]
  /** 아래 입력창. 보통 WorkComposer */
  composer?: ReactNode
}

/** 대화 영역: 이름 바 + 메시지 목록 + 입력창. 새 메시지가 오면 맨 아래로 내린다 */
export function WorkChannel({ name, topic, messages, composer }: Props) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages.length])

  return (
    <section className={styles.root} aria-label={name}>
      <header className={styles.bar}>
        <h2 className={styles.name}>{name}</h2>
        {topic && <span className={styles.topic}>{topic}</span>}
      </header>
      <div ref={listRef} className={styles.list} role="log" aria-live="polite">
        {messages.map(({ id, ...message }) => (
          <WorkMessage key={id} {...message} />
        ))}
      </div>
      {composer}
    </section>
  )
}
