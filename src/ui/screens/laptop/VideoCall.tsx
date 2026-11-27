import type { ReactNode } from 'react'
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
  return (
    <div className={styles.screen}>
      <header className={styles.bar}>
        <span className={styles.title}>{title}</span>
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
          <div className={styles.self} aria-label="내 웹캠">
            나
          </div>
          {caption && <p className={styles.caption}>{caption}</p>}
        </div>
        {side && <aside className={styles.side}>{side}</aside>}
      </div>
    </div>
  )
}
