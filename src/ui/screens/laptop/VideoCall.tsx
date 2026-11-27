import { useEffect, useState, type ReactNode } from 'react'
import { Icon, type IconName } from './icons'
import styles from './VideoCall.module.css'

interface Props {
  /** 위쪽 막대 제목 (앱 이름, 회의 이름) */
  title: string
  /** 상대 이름. 영상이 없을 때 자리 표시에 보인다 */
  remoteName: string
  /** 상대 영상. 없으면 이름만 있는 정지 화면 */
  videoSrc?: string
  /** 영상이 끝났을 때 */
  onVideoEnded?: () => void
  /** 영상 재생 위치(초)가 바뀔 때. 자막 시간 맞추기에 쓴다 */
  onVideoTime?: (sec: number) => void
  /** 녹화 중 표시 */
  recording?: boolean
  /** 아래쪽 자막 */
  caption?: string
  /** 오른쪽 패널(서류 등). 없으면 영상이 화면을 다 쓴다 */
  side?: ReactNode
}

// 아래 막대의 통화 버튼. 대본대로 흘러가는 통화라 누를 수 없는 장식이다
const CONTROLS: { icon: IconName; label: string }[] = [
  { icon: 'mic', label: '음소거' },
  { icon: 'video', label: '비디오 중지' },
  { icon: 'share', label: '화면 공유' },
  { icon: 'users', label: '참가자 2' },
  { icon: 'chat', label: '채팅' },
]

/** 통화한 시간 mm:ss */
function clock(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
}

/** 개인 노트북의 화상 통화 틀. 상대 영상, 내 웹캠 작은 창, 웹캠 켜짐·녹화 표시, 자막 */
export function VideoCall({
  title,
  remoteName,
  videoSrc,
  onVideoEnded,
  onVideoTime,
  recording,
  caption,
  side,
}: Props) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setElapsed((n) => n + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={styles.screen}>
      <header className={styles.bar}>
        <span className={styles.title}>
          <Icon name="video" size={16} />
          {title}
          <span className={styles.clock}>{clock(elapsed)}</span>
        </span>
        <span className={styles.badges}>
          {recording && <span className={styles.rec}>● 녹화 중</span>}
          <span className={styles.cam}>● 웹캠 켜짐</span>
        </span>
      </header>
      <div className={side ? `${styles.stage} ${styles.withSide}` : styles.stage}>
        <div className={styles.remote}>
          {videoSrc ? (
            <video
              className={styles.video}
              src={videoSrc}
              autoPlay
              playsInline
              onEnded={onVideoEnded}
              onTimeUpdate={(e) => onVideoTime?.(e.currentTarget.currentTime)}
            />
          ) : (
            <div className={styles.placeholder} aria-label={`${remoteName} 영상 자리`}>
              <span className={styles.avatar} aria-hidden="true" />
              <span>{remoteName}</span>
            </div>
          )}
          <span className={styles.nameTag}>{remoteName}</span>
          <div className={styles.self} aria-label="내 웹캠">
            <span className={styles.selfAvatar}>나</span>
            <span className={styles.nameTag}>나</span>
          </div>
          {caption && <p className={styles.caption}>{caption}</p>}
        </div>
        {side && <aside className={styles.side}>{side}</aside>}
      </div>
      <footer className={styles.controls} aria-hidden="true">
        {CONTROLS.map((c) => (
          <span key={c.label} className={styles.control}>
            <Icon name={c.icon} size={22} />
            {c.label}
          </span>
        ))}
        <span className={styles.leave}>나가기</span>
      </footer>
    </div>
  )
}
