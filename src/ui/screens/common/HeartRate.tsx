import { useEffect, useState } from 'react'
import { pulse } from '@/stores/pulse'
import { DAY_BADGE_SPOT } from './dayBadgeSpot'
import styles from './HeartRate.module.css'

/** 왼쪽 위 날짜 바로 아래 */
const TOP = DAY_BADGE_SPOT.top + 36

/**
 * 웹캠 앞에서 심장 소리가 날 때 왼쪽 위 날짜 아래에 뜨는 심박수.
 * 박동마다 하트가 뛰고 심전도 선이 한 번 그려진다. 숫자는 경계심이 높을수록 커진다.
 * 박동은 방의 소리(RoomSounds)가 pulse에 적은 것을 읽는다. 박동이 바뀔 때만 다시 그린다.
 */
export function HeartRate() {
  const [beat, setBeat] = useState({ bpm: pulse.bpm, beatAt: pulse.beatAt })

  useEffect(() => {
    let frame = 0
    const watch = () => {
      setBeat((b) =>
        b.bpm === pulse.bpm && b.beatAt === pulse.beatAt
          ? b
          : { bpm: pulse.bpm, beatAt: pulse.beatAt },
      )
      frame = requestAnimationFrame(watch)
    }
    frame = requestAnimationFrame(watch)
    return () => cancelAnimationFrame(frame)
  }, [])

  const { bpm, beatAt } = beat
  if (bpm === null) return null
  return (
    <div
      className={styles.rate}
      style={{ left: DAY_BADGE_SPOT.left, top: TOP }}
      role="img"
      aria-label={`심박수 분당 ${bpm}회`}
    >
      <svg key={`heart-${beatAt}`} className={styles.heart} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20.5 4.2 12.9A4.9 4.9 0 0 1 11.1 6l.9.9.9-.9a4.9 4.9 0 0 1 6.9 6.9Z" />
      </svg>
      <svg key={`line-${beatAt}`} className={styles.line} viewBox="0 0 64 20" aria-hidden="true">
        <polyline
          pathLength={100}
          points="0,11 16,11 20,8 24,11 28,11 31,2 35,19 38,11 44,11 48,8 52,11 64,11"
        />
      </svg>
      <span className={styles.number}>{bpm}</span>
      <span className={styles.unit}>BPM</span>
    </div>
  )
}
