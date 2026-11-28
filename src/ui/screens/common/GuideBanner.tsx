import { useEffect, useState } from 'react'
import styles from './GuideBanner.module.css'

/** 알림이 들어와 머무는 시간(ms). 이 시간이 지나면 오른쪽으로 빠지고 작은 종 손잡이만 남는다. */
const HOLD_MS = 6000
/** 안내를 다시 여는 키. code는 KeyboardEvent.code, label은 화면에 보이는 이름 */
const GUIDE_KEY = { code: 'KeyG', label: 'G' }

type Phase = 'open' | 'closing' | 'closed'

interface Props {
  /** 대본의 [안내] 문구. 다음에 무엇을 하면 되는지 알려 준다. null이면 감춘다. */
  text: string | null
  /** 머무는 시간(ms). null이면 올라가지 않고 계속 떠 있다. */
  holdMs?: number | null
}

/**
 * 맥북 알림 모양의 안내 문구. 화면 오른쪽 위로 슥 밀려 들어왔다가 잠시 뒤 오른쪽으로 빠진다.
 * 빠진 뒤에는 오른쪽 위에 작은 종 손잡이가 남고, 그걸 누르거나 G를 누르면 다시 들어온다.
 * 문구가 바뀌면 새 알림이 들어온다. 언제 어떤 문구를 띄울지는 엔진이 정한다(사건의 goal).
 */
export function GuideBanner({ text, holdMs = HOLD_MS }: Props) {
  // 문구가 바뀔 때마다 처음(open)부터 다시 보여 준다
  return text ? <Banner key={text} text={text} holdMs={holdMs} /> : <div role="status" />
}

function Banner({ text, holdMs }: { text: string; holdMs: number | null }) {
  const [phase, setPhase] = useState<Phase>('open')
  // 다시 열 때마다 늘려서 내려오는 움직임을 처음부터 다시 그린다
  const [shown, setShown] = useState(0)

  // 머무는 시간이 지나면 올라간다
  useEffect(() => {
    if (phase !== 'open' || holdMs === null) return
    const id = setTimeout(() => setPhase('closing'), holdMs)
    return () => clearTimeout(id)
  }, [phase, holdMs, shown])

  const reopen = () => {
    setShown((n) => n + 1)
    setPhase('open')
  }

  // G를 누르면 다시 내려온다. 글자를 입력하는 칸에서는 반응하지 않는다.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea')
      if (e.code !== GUIDE_KEY.code || e.repeat || typing) return
      setShown((n) => n + 1)
      setPhase('open')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    // 읽어 주는 칸은 그대로 두고 안쪽 글만 바꿔야 화면 낭독기가 새 문구를 읽는다
    <div role="status" className={styles.slot}>
      {phase === 'closed' ? (
        <button
          type="button"
          className={styles.handle}
          onClick={reopen}
          aria-label={`안내 다시 보기 (${GUIDE_KEY.label})`}
          aria-keyshortcuts={GUIDE_KEY.label}
        >
          <BellIcon size={16} />
          <kbd className={styles.key} aria-hidden="true">
            {GUIDE_KEY.label}
          </kbd>
        </button>
      ) : (
        <div
          key={shown}
          className={`${styles.banner} ${phase === 'closing' ? styles.leaving : ''}`}
          onAnimationEnd={(e) => {
            if (phase === 'closing' && e.target === e.currentTarget) setPhase('closed')
          }}
        >
          <span className={styles.icon} aria-hidden="true">
            <BellIcon size={20} />
          </span>
          <span className={styles.text}>{text}</span>
        </div>
      )}
    </div>
  )
}

/** 알림 아이콘 안의 종 모양 */
function BellIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  )
}
