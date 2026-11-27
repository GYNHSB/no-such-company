import { useLayoutEffect, useRef } from 'react'
import styles from './DateCard.module.css'
import { DAY_BADGE_SPOT } from './dayBadgeSpot'

/** 카드 전체 길이(ms). DateCard.module.css의 --total과 같아야 한다. */
const CARD_MS = 3600

interface Props {
  /** 보여 줄 글. 하루 시작이면 dayLabel(info)("2일차 · 입사 3주 차"), 시간이 건너뛰면 "그날 오후"처럼 그대로 넣는다. */
  text: string
  /** 카드가 끝난 뒤 부른다. 다음 장면으로 넘기고, 날짜면 그 자리에 DayBadge를 띄운다. */
  onDone?: () => void
}

/**
 * 장면이 어둡게 가라앉고 가운데에 날짜가 떠올랐다가 사라지는 카드. 약 3.6초.
 * "2일차 · 입사 3주 차"는 "2일차"를 크게, "입사 3주 차"를 작게 나눠 보여 주고,
 * 끝날 때 "2일차"가 작아지며 왼쪽 위 DayBadge 자리에 정확히 내려앉는다. onDone에서 DayBadge로 바꾸면 끊김 없이 이어진다.
 * 날짜 카드가 시작되면 왼쪽 위의 지난 날짜(DayBadge)는 감춰 둔다(날아오는 동안 두 개가 보이지 않게).
 * 화면 위 다른 것(조준점, 안내)을 모두 덮도록 화면의 맨 마지막에, DayBadge와 같은 전체 화면 칸 안에 둔다.
 * 같은 글을 다시 보여 주려면 key를 바꿔 새로 그린다.
 */
export function DateCard({ text, onDone }: Props) {
  const [main, sub] = text.split(' · ')
  const mainRef = useRef<HTMLParagraphElement>(null)

  // 큰 날짜가 지금 어디에 있는지 재서, 왼쪽 위 자리까지 날아가는 움직임을 만든다.
  // CSS 애니메이션에 잰 값을 변수로 넘기면 재는 순간 이미 시작돼 0으로 굳는다. 그래서 잰 다음 여기서 직접 시작한다.
  useLayoutEffect(() => {
    const el = mainRef.current
    if (!el || !sub) return
    const size = parseFloat(getComputedStyle(el).fontSize)
    const scale = DAY_BADGE_SPOT.fontSize / size
    // 큰 날짜는 가운데를 맞추려고 왼쪽에 0.2em을 비워 두었다. 그 빈칸도 함께 줄어든다.
    const x = DAY_BADGE_SPOT.left - el.offsetLeft - 0.2 * size * scale
    const y = DAY_BADGE_SPOT.top - el.offsetTop
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const landed = still ? 'none' : `translate(${x}px, ${y}px) scale(${scale})`
    const fly = el.animate(
      [
        { offset: 0, opacity: 0, transform: still ? 'none' : 'translateY(8px)' },
        {
          offset: 0.12,
          opacity: 0,
          transform: still ? 'none' : 'translateY(8px)',
          easing: 'ease-out',
        },
        { offset: 0.3, opacity: 1, transform: 'none' },
        // 바탕이 걷히기 조금 전(64%)부터 날기 시작해, 검은 화면 위에서 출발하는 게 보인다
        { offset: 0.64, opacity: 1, transform: 'none', easing: 'ease-in-out' },
        // 움직임 줄이기 설정이면 날지 않고 그 자리에서 옅어지고, 왼쪽 위에 날짜가 새로 나타난다
        { offset: 1, opacity: still ? 0 : 1, transform: landed },
      ],
      { duration: CARD_MS, fill: 'both' },
    )
    return () => fly.cancel()
  }, [sub])

  return (
    <div role="status" className={styles.card}>
      <div
        className={styles.backdrop}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) onDone?.()
        }}
      />
      <p ref={mainRef} className={`${styles.main} ${sub ? styles.fly : ''}`}>
        {main}
      </p>
      <span className={styles.line} aria-hidden="true" />
      {sub && <p className={styles.sub}>{sub}</p>}
    </div>
  )
}
