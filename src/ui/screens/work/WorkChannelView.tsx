// shortcut: 틀과 메시지 줄 모양은 kit WorkChannel, WorkMessage의 스타일을 빌려 쓴다. kit WorkMessage가 꾸민 글과 반응을 받게 되면 kit 부품으로 바꾼다.
import channel from '@/ui/kit/work/WorkChannel.module.css'
import row from '@/ui/kit/work/WorkMessage.module.css'
import { parseRich } from './richText'
import styles from './WorkChannelView.module.css'

export interface ChannelReaction {
  emoji: string
  count: number
}

export interface ChannelMessage {
  id: string
  name: string
  time: string
  /** `*굵게*`, `` `코드` ``, `@멘션`을 쓸 수 있다. '{name}'은 플레이어 이름으로 바뀐다 */
  text: string
  /** 같은 사람이 연달아 보낸 메시지면 이름과 사진 생략 */
  continued?: boolean
  /** 글 아래 반응 */
  reactions?: readonly ChannelReaction[]
}

interface Props {
  /** 상단 이름 바 ('# 공지') */
  name: string
  /** 이름 옆 짧은 설명 */
  topic?: string
  messages: readonly ChannelMessage[]
  /** 글 속 `{name}` 자리에 들어가는 플레이어 이름 */
  playerName: string
}

/** 사내 채널 보기. 꾸민 글과 반응이 달린 메시지 목록 (읽기만 한다) */
export function WorkChannelView({ name, topic, messages, playerName }: Props) {
  return (
    <section className={channel.root} aria-label={name}>
      <header className={channel.bar}>
        <h2 className={channel.name}>{name}</h2>
        {topic && <span className={channel.topic}>{topic}</span>}
      </header>
      <div className={channel.list} role="log">
        {messages.map((message) => (
          <div key={message.id} className={`${row.row} ${message.continued ? row.continued : ''}`}>
            <div>{!message.continued && <span className={row.avatar} aria-hidden="true" />}</div>
            <div>
              {!message.continued && (
                <div className={row.meta}>
                  <span className={row.name}>{message.name}</span>
                  <span className={row.time}>{message.time}</span>
                </div>
              )}
              <p className={row.text}>
                {parseRich(message.text).map((part, index) => {
                  const value = part.value.replaceAll('{name}', playerName)
                  if (part.type === 'bold') return <strong key={index}>{value}</strong>
                  if (part.type === 'code')
                    return (
                      <code key={index} className={styles.code}>
                        {value}
                      </code>
                    )
                  if (part.type === 'mention')
                    return (
                      <span key={index} className={styles.mention}>
                        {value}
                      </span>
                    )
                  return value
                })}
              </p>
              {message.reactions && (
                <ul className={styles.reactions} aria-label="반응">
                  {message.reactions.map((reaction) => (
                    <li key={reaction.emoji} className={styles.reaction}>
                      <span>{reaction.emoji}</span>
                      <span>{reaction.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
