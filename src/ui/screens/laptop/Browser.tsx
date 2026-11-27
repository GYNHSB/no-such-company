import { useState, type ReactNode } from 'react'
import styles from './Browser.module.css'

interface Props {
  /** 탭 제목 */
  title: string
  /** 주소창에 보이는 주소. 가상 주소는 `.example`로 끝나게 쓴다 */
  url: string
  /** 버튼 id의 화면 이름. 버튼 id는 `btn_{screen}_close`, `_back`, `_forward`, `_reload` */
  screen: string
  /** 탭의 닫기 버튼을 눌렀을 때. 없으면 닫기 버튼을 숨긴다 */
  onClose?: () => void
  /** 뒤로·앞으로. 없으면 버튼이 흐려지고 눌리지 않는다 */
  onBack?: () => void
  onForward?: () => void
  children: ReactNode
}

/** 개인 노트북의 브라우저 틀. 탭 하나, 뒤로·앞으로·새로고침, 주소창, 본문 */
export function Browser({ title, url, screen, onClose, onBack, onForward, children }: Props) {
  // 새로고침하면 본문을 다시 그려 맨 위로 돌아간다
  const [reloads, setReloads] = useState(0)

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
        <nav className={styles.nav} aria-label="페이지 이동">
          <button
            id={`btn_${screen}_back`}
            className={styles.navButton}
            type="button"
            aria-label="뒤로"
            disabled={!onBack}
            onClick={onBack}
          >
            ‹
          </button>
          <button
            id={`btn_${screen}_forward`}
            className={styles.navButton}
            type="button"
            aria-label="앞으로"
            disabled={!onForward}
            onClick={onForward}
          >
            ›
          </button>
          <button
            id={`btn_${screen}_reload`}
            className={styles.navButton}
            type="button"
            aria-label="새로고침"
            onClick={() => setReloads((n) => n + 1)}
          >
            ⟳
          </button>
        </nav>
        <div className={styles.address}>{url}</div>
      </div>
      <div key={reloads} className={styles.body}>
        {children}
      </div>
    </div>
  )
}
