import type { ReactNode } from 'react'
import styles from './PhoneCloseup.module.css'

/** 손 이미지 위에서 휴대폰 화면이 차지하는 영역. 이미지 픽셀 좌표(왼쪽 위, 오른쪽 아래). */
export interface ScreenRect {
  left: number
  top: number
  right: number
  bottom: number
}

interface Props {
  /** 손 이미지 경로. 없으면 임시 배경으로 그린다 */
  handSrc?: string
  /** 손 이미지의 원본 크기(px). 좌표 계산 기준 */
  imageSize: { width: number; height: number }
  /** 팀원이 넘겨주는 화면 꼭짓점 좌표 */
  screen: ScreenRect
  /** 손이 떨리는 상태 (경계심이 높을 때 등) */
  shaking?: boolean
  children: ReactNode
}

const pct = (v: number, total: number) => `${(v / total) * 100}%`

/**
 * 1인칭 휴대폰 클로즈업.
 * 레이어: 손 이미지 → 화면 UI → 화면 빛.
 * 흔들림은 묶음 전체에 주어 UI가 화면 위치에서 어긋나지 않는다.
 */
export function PhoneCloseup({ handSrc, imageSize, screen, shaking, children }: Props) {
  const { width, height } = imageSize
  return (
    <div className={styles.stage}>
      <div
        className={`${styles.sway} ${shaking ? styles.shaking : ''}`}
        style={{ aspectRatio: `${width} / ${height}`, ['--ar' as string]: width / height }}
      >
        {handSrc ? (
          <img className={styles.hand} src={handSrc} alt="" draggable={false} />
        ) : (
          <div className={styles.placeholder} aria-hidden="true" />
        )}
        <div
          className={styles.screen}
          style={{
            left: pct(screen.left, width),
            top: pct(screen.top, height),
            width: pct(screen.right - screen.left, width),
            height: pct(screen.bottom - screen.top, height),
          }}
        >
          {children}
        </div>
        <div className={styles.glow} aria-hidden="true" />
      </div>
    </div>
  )
}
