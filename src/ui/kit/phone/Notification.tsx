import styles from './Notification.module.css'

interface Props {
  app: string // 보낸 앱 이름: 하나로은행, 메시지 등
  time: string // '지금', '2분 전'
  title?: string
  body: string
  onOpen?: () => void
}

/** 아이폰식 알림 배너. 잠금화면과 화면 위쪽 배너에 같이 쓴다 */
export function Notification({ app, time, title, body, onOpen }: Props) {
  return (
    <button type="button" className={styles.card} onClick={onOpen}>
      <span className={styles.head}>
        <span className={styles.app}>{app}</span>
        <span className={styles.time}>{time}</span>
      </span>
      {title && <span className={styles.title}>{title}</span>}
      <span className={styles.body}>{body}</span>
    </button>
  )
}
