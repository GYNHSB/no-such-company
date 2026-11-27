import type { ReactNode } from 'react'
import styles from './Browser.module.css'

interface Props {
  /** 탭 제목 */
  title: string
  /** 주소창에 보이는 주소. 가상 주소는 `.example`로 끝나게 쓴다 */
  url: string
  /** 버튼 id의 화면 이름. 닫기 버튼 id는 `btn_{screen}_close` */
  screen: string
  /** 탭의 닫기 버튼을 눌렀을 때. 없으면 닫기 버튼을 숨긴다 */
  onClose?: () => void
  children: ReactNode
}

/** 개인 노트북의 브라우저 틀. 탭 하나, 주소창, 본문 */
export function Browser({ title, url, screen, onClose, children }: Props) {
  return (
    <div className={styles.window}>
      <div className={styles.tabs}>
        <div className={styles.tab}>
          <span className={styles.tabTitle}>{title}</span>
          {onClose && (
            <button
              id={`btn_${screen}_close`}
              className={styles.close}
              type="button"
              aria-label="탭 닫기"
              onClick={onClose}
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className={styles.bar}>
        <span className={styles.nav} aria-hidden="true">
          ‹ › ⟳
        </span>
        <div className={styles.address}>{url}</div>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  )
}
