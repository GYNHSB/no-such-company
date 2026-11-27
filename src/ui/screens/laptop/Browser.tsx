import { useState, type ReactNode } from 'react'
import styles from './Browser.module.css'
import { Icon } from './icons'

interface Props {
  /** 탭 제목 */
  title: string
  /** 주소창에 보이는 주소. 가상 주소는 `.example`로 끝나게 쓴다 */
  url: string
  /** 탭의 사이트 아이콘 글자 (사이트 이름 첫 글자) */
  favicon: string
  /** 버튼 id의 화면 이름. 버튼 id는 `btn_{screen}_close`, `_back`, `_forward`, `_reload` */
  screen: string
  /** 탭의 닫기 버튼을 눌렀을 때. 없으면 닫기 버튼을 숨긴다 */
  onClose?: () => void
  /** 뒤로·앞으로. 없으면 버튼이 흐려지고 눌리지 않는다 */
  onBack?: () => void
  onForward?: () => void
  children: ReactNode
}

/** 개인 노트북의 브라우저 틀. 탭, 창 버튼, 뒤로·앞으로·새로고침, 주소창, 본문 */
export function Browser({
  title,
  url,
  favicon,
  screen,
  onClose,
  onBack,
  onForward,
  children,
}: Props) {
  // 새로고침하면 본문을 다시 그려 맨 위로 돌아간다
  const [reloads, setReloads] = useState(0)

  return (
    <div className={styles.window}>
      <div className={styles.tabs}>
        <div className={styles.tab}>
          <span className={styles.favicon} aria-hidden="true">
            {favicon}
          </span>
          <span className={styles.tabTitle}>{title}</span>
          {onClose && (
            <button
              id={`btn_${screen}_close`}
              className={styles.close}
              type="button"
              aria-label="탭 닫기"
              onClick={onClose}
            >
              <Icon name="close" size={14} />
            </button>
          )}
        </div>
        {/* 아래는 진짜 브라우저처럼 보이게 하는 장식. 누를 수 없다 */}
        <span className={styles.newTab} aria-hidden="true">
          <Icon name="plus" size={16} />
        </span>
        <span className={styles.windowButtons} aria-hidden="true">
          <Icon name="minus" size={16} />
          <Icon name="square" size={14} />
          <Icon name="close" size={16} />
        </span>
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
            <Icon name="back" />
          </button>
          <button
            id={`btn_${screen}_forward`}
            className={styles.navButton}
            type="button"
            aria-label="앞으로"
            disabled={!onForward}
            onClick={onForward}
          >
            <Icon name="forward" />
          </button>
          <button
            id={`btn_${screen}_reload`}
            className={styles.navButton}
            type="button"
            aria-label="새로고침"
            onClick={() => setReloads((n) => n + 1)}
          >
            <Icon name="reload" />
          </button>
        </nav>
        <div className={styles.address}>
          <Icon name="lock" size={14} />
          <span className={styles.url}>{url}</span>
          <Icon name="star" size={16} />
        </div>
        <span className={styles.profile} aria-hidden="true" />
        <span className={styles.menu} aria-hidden="true">
          <Icon name="more" />
        </span>
      </div>
      <div key={reloads} className={styles.body}>
        {children}
      </div>
    </div>
  )
}
