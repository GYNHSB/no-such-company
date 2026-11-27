import type { Message } from '@/data/types'
import { Notification } from '@/ui/kit/phone/Notification'
import { PhoneScreen } from '@/ui/kit/phone/PhoneScreen'
import styles from './LockScreen.module.css'

interface Props {
  /** 지금 시각 "10:11". 큰 시계와 상태 표시줄에 쓴다 */
  time: string
  /** 시계 위에 "11월 27일 (금)"처럼 보여 줄 날짜. 없으면 시계만 보인다 */
  date?: Date
  /** 도착한 순서대로 넘긴다. 화면에는 새 알림이 맨 위에 온다 */
  messages: Message[]
  /** 알림을 눌렀을 때. 어떤 앱을 열지는 받는 쪽이 정한다 */
  onOpen?: (message: Message) => void
}

const toMinutes = (clock: string) => {
  const [hour = 0, minute = 0] = clock.split(':').map(Number)
  return hour * 60 + minute
}

const monthDay = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' })
const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' })

/** "11월 27일 (금)" */
const formatDate = (date: Date) => `${monthDay.format(date)} (${weekday.format(date)})`

/** 알림 오른쪽 위에 보이는 "지금", "4분 전" */
const ago = (now: string, at: string) => {
  const minutes = toMinutes(now) - toMinutes(at)
  return minutes <= 0 ? '지금' : `${minutes}분 전`
}

/**
 * 휴대폰 잠금 화면. PhoneCloseup 안에 넣는다.
 * 문자는 앱 이름 "메시지" 아래에 보낸 사람을, 그 밖의 알림은 보낸 곳을 앱 이름 자리에 보여 준다.
 * 알림이 언제 도착하는지는 엔진이 정하고, 이 화면은 받은 목록을 그리고 누른 알림을 넘기기만 한다.
 */
export function LockScreen({ time, date, messages, onOpen }: Props) {
  const newestFirst = messages.toReversed()

  return (
    <div className={styles.wallpaper}>
      <PhoneScreen time={time}>
        <div className={styles.lock}>
          <div className={styles.clock}>
            {date && <p className={styles.date}>{formatDate(date)}</p>}
            <time className={styles.time}>{time}</time>
          </div>
          <ul className={styles.list} aria-label="알림">
            {newestFirst.map((message) => {
              const isSms = message.channel === 'sms'
              return (
                <li key={message.id} className={styles.item}>
                  <Notification
                    app={isSms ? '메시지' : message.from}
                    title={isSms ? message.from : undefined}
                    time={ago(time, message.time)}
                    body={message.body}
                    onOpen={onOpen && (() => onOpen(message))}
                  />
                </li>
              )
            })}
          </ul>
        </div>
      </PhoneScreen>
    </div>
  )
}
