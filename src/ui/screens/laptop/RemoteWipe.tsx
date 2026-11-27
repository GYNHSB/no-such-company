import { useEffect, useRef, useState } from 'react'
import styles from './RemoteWipe.module.css'
import { TARGETS, wipedCount } from './remoteWipeTargets'

interface Props {
  /** 공유기 전원이 뽑혔는지. true가 되면 그 자리에서 멈춘다 */
  stopped: boolean
  /** 0%에서 100%까지 걸리는 시간(ms) */
  durationMs?: number
  /** 끝까지 지워졌을 때 한 번 부른다 */
  onWiped?: () => void
}

const TICK_MS = 100

/**
 * 5일차 장면 5. 취임식 중 경계심이 70을 넘으면 엔진이 띄운다.
 * 노트북이 원격으로 지워지고, 공유기 전원을 뽑으면(stopped) 멈춘다. 끝까지 가면 지워진 화면으로 남는다.
 */
export function RemoteWipe({ stopped, durationMs = 20000, onWiped }: Props) {
  const [progress, setProgress] = useState(0)
  const done = progress >= 1
  const onWipedRef = useRef(onWiped)
  useEffect(() => {
    onWipedRef.current = onWiped
  })

  useEffect(() => {
    if (stopped || done) return
    const timer = setInterval(() => {
      setProgress((p) => Math.min(1, p + TICK_MS / durationMs))
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [stopped, done, durationMs])

  useEffect(() => {
    if (done) onWipedRef.current?.()
  }, [done])

  if (done) {
    return (
      <div className={`${styles.screen} ${styles.blank}`} role="status">
        <p className={styles.blankText}>이 기기는 초기화되었습니다.</p>
      </div>
    )
  }

  const percent = Math.floor(progress * 100)
  const count = wipedCount(progress)

  return (
    <div className={styles.screen} role="alert">
      <div className={styles.panel}>
        <p className={styles.label}>원격 관리</p>
        <h1 className={styles.title}>
          {stopped
            ? '네트워크 연결이 끊겨 초기화가 멈췄습니다'
            : '관리자가 이 기기를 초기화하고 있습니다'}
        </h1>
        <div className={styles.track} aria-hidden="true">
          <div className={styles.fill} style={{ transform: `scaleX(${progress})` }} />
        </div>
        <p className={styles.percent}>{percent}%</p>
        <ul className={styles.targets}>
          {TARGETS.map((t, i) => (
            <li key={t} className={i < count ? styles.gone : undefined}>
              {t}
              <span className={styles.state}>{i < count ? '삭제됨' : '남아 있음'}</span>
            </li>
          ))}
        </ul>
        {!stopped && <p className={styles.warn}>전원을 끄지 마십시오.</p>}
      </div>
    </div>
  )
}
