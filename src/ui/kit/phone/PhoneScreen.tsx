import type { ReactNode } from 'react'
import styles from './PhoneScreen.module.css'

interface Props {
  /** 상태 표시줄 시각 "09:03" */
  time: string
  /** 상태 표시줄 왼쪽에 시각 대신 보여 줄 글. 잠금 화면의 통신사 이름에 쓴다 */
  statusLabel?: string
  /** 앱 제목. 있으면 아이폰식 큰 제목으로 */
  title?: string
  /** 제목 왼쪽 뒤로 가기 */
  onBack?: () => void
  /** 아래 막대를 눌렀을 때. 있으면 막대가 홈 화면으로 가는 단추가 된다 */
  onHome?: () => void
  children: ReactNode
}

/**
 * 아이폰 다크 모드 화면 틀. PhoneCloseup의 화면 영역 안에 넣는다.
 * 크기는 화면 영역 너비를 390pt로 보고 비례해서 맞춘다(--pt).
 */
export function PhoneScreen({ time, statusLabel, title, onBack, onHome, children }: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.status} aria-hidden="true">
        <span className={styles.time}>{statusLabel ?? time}</span>
        <span className={styles.icons}>
          <i className={styles.signal} />
          <i className={styles.battery} />
        </span>
      </div>
      {title && (
        <header className={styles.header}>
          {onBack && (
            <button type="button" className={styles.back} onClick={onBack} aria-label="뒤로">
              ‹
            </button>
          )}
          <h1 className={styles.title}>{title}</h1>
        </header>
      )}
      <div className={styles.body}>{children}</div>
      {onHome ? (
        <button
          type="button"
          className={styles.homeButton}
          onClick={onHome}
          aria-label="홈 화면으로"
        >
          <span className={styles.home} />
        </button>
      ) : (
        <div className={styles.home} aria-hidden="true" />
      )}
    </div>
  )
}
