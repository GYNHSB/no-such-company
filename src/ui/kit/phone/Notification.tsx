import type { ReactNode } from 'react'
import styles from './Notification.module.css'

interface Props {
  app: string // 보낸 앱 이름: 하나로은행, 메시지 등. 제목이 없으면 제목 자리에 보인다
  /** 왼쪽에 붙는 앱 아이콘. AppIcon을 넣는다 */
  icon?: ReactNode
  time: string // '지금', '2분 전'
  title?: string
  body: string
  onOpen?: () => void
}

/**
 * 아이폰식 알림 배너. 잠금화면과 화면 위쪽 배너에 같이 쓴다.
 * 왼쪽에 앱 아이콘, 오른쪽에 굵은 제목과 시각, 그 아래 본문(4줄까지)을 보여 준다.
 */
export function Notification({ app, icon, time, title, body, onOpen }: Props) {
  return (
    <button type="button" className={styles.card} onClick={onOpen}>
      {icon && (
        <span className={styles.icon} role="img" aria-label={app}>
          {icon}
        </span>
      )}
      <span className={styles.text}>
        <span className={styles.head}>
          <span className={styles.title}>{title ?? app}</span>
          <span className={styles.time}>{time}</span>
        </span>
        <span className={styles.body}>{body}</span>
      </span>
    </button>
  )
}
