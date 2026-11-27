import { useEffect, useRef, useState } from 'react'
import { Icon } from './icons'
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
  const secondsLeft = Math.ceil(((1 - progress) * durationMs) / 1000)

  return (
    <div className={styles.screen} role="alert">
      <header className={styles.bar}>
        <span className={styles.app}>
          <Icon name="shield" size={18} />
          원격 관리 에이전트
        </span>
        <span className={stopped ? styles.offline : styles.online}>
          {stopped ? '● 서버 연결 끊김' : '● 관리 서버에 연결됨'}
        </span>
      </header>

      <div className={styles.panel}>
        <p className={styles.label}>{stopped ? '작업 일시 중지' : '원격 초기화 진행 중'}</p>
        <h1 className={styles.title}>
          {stopped
            ? '네트워크 연결이 끊겨 초기화가 멈췄습니다'
            : '관리자가 이 기기를 초기화하고 있습니다'}
        </h1>
        <dl className={styles.device}>
          <dt>기기</dt>
          <dd>개인 노트북</dd>
          <dt>요청한 곳</dt>
          <dd>세움파트너스 IT 관리</dd>
          <dt>작업</dt>
          <dd>사용자 데이터 전체 삭제</dd>
        </dl>
        <div className={styles.track} aria-hidden="true">
          <div className={styles.fill} style={{ transform: `scaleX(${progress})` }} />
        </div>
        <p className={styles.percent}>
          <span>{percent}%</span>
          <span>{stopped ? '대기 중' : `남은 시간 약 ${secondsLeft}초`}</span>
        </p>
        <ul className={styles.targets}>
          {TARGETS.map((t, i) => {
            const state = i < count ? 'gone' : i === count && !stopped ? 'now' : 'wait'
            return (
              <li key={t} className={state === 'gone' ? styles.gone : undefined}>
                <span className={styles.item}>
                  <Icon name="doc" size={16} />
                  {t}
                </span>
                <span className={state === 'now' ? `${styles.state} ${styles.now}` : styles.state}>
                  {state === 'gone' ? '삭제됨' : state === 'now' ? '삭제 중' : '대기'}
                </span>
              </li>
            )
          })}
        </ul>
        {!stopped && (
          <p className={styles.warn}>전원을 끄지 마십시오. 작업이 끝나면 기기가 다시 시작됩니다.</p>
        )}
      </div>
    </div>
  )
}
