import type { ReactNode } from 'react'
import styles from './PhoneNav.module.css'

interface Props {
  /** 뒤로 가기 화살표 옆에 보이는 글(돌아갈 화면 이름). 없으면 화살표만 보인다 */
  backLabel?: string
  /** 화살표만 있을 때 화면 낭독기가 읽을 이름 */
  backAriaLabel?: string
  /** 뒤로 가기를 눌렀을 때. backLabel만 있고 이 값이 없으면 누를 수 없는 꾸밈으로 그린다 */
  onBack?: () => void
  /** 줄 가운데에 놓을 것. 대화방의 사람 모양과 이름처럼 줄보다 높아도 된다 */
  children?: ReactNode
  /** 줄 아래에 오는 아이폰식 큰 제목 */
  title?: string
}

/** 뒤로 가기 화살표 */
function Chevron() {
  return (
    <svg className={styles.chevron} viewBox="0 0 12 20" aria-hidden="true">
      <path d="M10 2L2 10l8 8" />
    </svg>
  )
}

/**
 * 휴대폰 앱 화면 위쪽 줄. 왼쪽에 뒤로 가기, 가운데에 내용, 아래에 큰 제목을 둔다.
 * 내용이 없어도 줄 높이는 차지해서, 앱마다 큰 제목이 같은 높이에 온다.
 * 좌우 여백은 놓는 쪽이 정한다(PhoneScreen 본문은 이미 16pt 여백이 있다).
 * 뒤로 가기 색은 --phone-accent로 바꾼다. 정하지 않으면 파랑이다.
 */
export function PhoneNav({ backLabel, backAriaLabel = '뒤로', onBack, children, title }: Props) {
  const back = (
    <>
      <Chevron />
      {backLabel}
    </>
  )
  return (
    <header className={styles.nav}>
      <div className={styles.row}>
        {onBack ? (
          <button
            type="button"
            className={styles.back}
            onClick={onBack}
            aria-label={backLabel ? undefined : backAriaLabel}
          >
            {back}
          </button>
        ) : (
          backLabel && (
            <span className={styles.back} aria-hidden="true">
              {back}
            </span>
          )
        )}
        {children && <div className={styles.center}>{children}</div>}
      </div>
      {title && <h1 className={styles.title}>{title}</h1>}
    </header>
  )
}
