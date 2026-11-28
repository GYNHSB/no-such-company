import type { ReactNode } from 'react'
import styles from './PhoneCloseup.module.css'

/** 손 이미지 위에서 휴대폰 화면이 차지하는 영역. 이미지 픽셀 좌표(왼쪽 위, 오른쪽 아래). */
export interface ScreenRect {
  left: number
  top: number
  right: number
  bottom: number
  /** 화면 모서리의 둥글기(이미지 픽셀). 없으면 기본 둥글기를 쓴다 */
  radius?: number
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
  /** 뒤 배경. solid는 어두운 단색으로 덮고, blur는 뒤에 있는 화면(3D 방)을 흐리고 어둡게 비춘다 */
  backdrop?: 'solid' | 'blur'
  /** 손 이미지를 아래로 내리는 정도(이미지 높이에 대한 비율, 0~1). 이미지 아래쪽의 잘린 소매를 화면 밖으로 내보낸다 */
  sink?: number
  children: ReactNode
}

const pct = (v: number, total: number) => `${(v / total) * 100}%`

/**
 * 1인칭 휴대폰 클로즈업.
 * 레이어: 손 이미지 → 화면 UI → 화면 빛.
 * 흔들림은 묶음 전체에 주어 UI가 화면 위치에서 어긋나지 않는다.
 */
export function PhoneCloseup({
  handSrc,
  imageSize,
  screen,
  shaking,
  backdrop = 'solid',
  sink = 0,
  children,
}: Props) {
  const { width, height } = imageSize
  const screenWidth = screen.right - screen.left
  const screenHeight = screen.bottom - screen.top
  return (
    <div
      className={[
        styles.stage,
        backdrop === 'blur' ? styles.seeThrough : '',
        // 아래로 내릴 때는 이미지를 화면 바닥에 붙여서, 창이 좁고 길어도 내린 만큼이 꼭 화면 밖으로 나가게 한다
        sink > 0 ? styles.sunk : '',
      ].join(' ')}
    >
      <div
        className={`${styles.sway} ${shaking ? styles.shaking : ''}`}
        style={{
          aspectRatio: `${width} / ${height}`,
          ['--ar' as string]: width / height,
          // 숨 쉬는 움직임(transform)과 겹치지 않게 translate로 내린다
          translate: `0 ${sink * 100}%`,
        }}
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
            width: pct(screenWidth, width),
            height: pct(screenHeight, height),
            borderRadius:
              screen.radius === undefined
                ? undefined
                : `${pct(screen.radius, screenWidth)} / ${pct(screen.radius, screenHeight)}`,
          }}
        >
          {children}
        </div>
        <div className={styles.glow} aria-hidden="true" />
      </div>
    </div>
  )
}
