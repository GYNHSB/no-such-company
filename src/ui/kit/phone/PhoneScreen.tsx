import type { ReactNode } from 'react'
import styles from './PhoneScreen.module.css'

interface Props {
  /** 상태 표시줄 시각 "09:03" */
  time: string
  /** 앱 제목. 있으면 아이폰식 큰 제목으로 */
  title?: string
  /** 제목 왼쪽 뒤로 가기 */
  onBack?: () => void
  children: ReactNode
}

/**
 * 아이폰 다크 모드 화면 틀. PhoneCloseup의 화면 영역 안에 넣는다.
 * 크기는 화면 영역 너비를 390pt로 보고 비례해서 맞춘다(--pt).
 */
export function PhoneScreen({ time, title, onBack, children }: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.status} aria-hidden="true">
        <span className={styles.time}>{time}</span>
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
      <div className={styles.home} aria-hidden="true" />
    </div>
  )
}
