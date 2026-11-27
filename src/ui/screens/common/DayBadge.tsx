import styles from './DayBadge.module.css'
import { DAY_BADGE_SPOT } from './dayBadgeSpot'

interface Props {
  /** 지금 며칠째인지("2일차"). null이면 감춘다. */
  text: string | null
}

/**
 * 화면 왼쪽 위에 계속 남아 있는 날짜와, 그 옆에서 깜빡이는 웹캠 불빛 같은 초록 점.
 * 날짜 카드의 큰 날짜가 이 자리로 날아와 내려앉고, 그 뒤로 이 부품이 이어받는다.
 */
export function DayBadge({ text }: Props) {
  if (!text) return null
  const { left, top, fontSize } = DAY_BADGE_SPOT
  return (
    <p className={styles.badge} style={{ left, top, fontSize }}>
      {text}
      <span className={styles.light} aria-hidden="true" />
    </p>
  )
}
