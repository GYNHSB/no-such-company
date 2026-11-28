import { useRef, type ReactNode } from 'react'
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
  /**
   * 뒤 배경을 클릭했을 때. 휴대폰을 내려놓는 데 쓴다.
   * 손이나 휴대폰 테두리를 누른 것과, 화면 안에서 누르기 시작해 밖에서 뗀 것(끌기)은 알리지 않는다.
   */
  onOutside?: () => void
  children: ReactNode
}

const pct = (v: number, total: number) => `${(v / total) * 100}%`

/** 화면 둘레에서 휴대폰 몸체(테두리)로 치는 폭. 화면 너비에 대한 비율이다. 여기까지는 휴대폰 안으로 본다 */
const BEZEL = 0.06
/** 손 이미지에서 이보다 진한(덜 투명한) 곳을 손으로 친다(0~255) */
const SOLID = 32
/** 손이 있는 자리를 알아낼 때 이미지를 줄여 그리는 너비(px). 정확할 필요가 없어 작게 잡는다 */
const MASK_WIDTH = 256

/** 손 이미지의 투명한 정도를 줄여서 담아 둔 것. 어디가 손이고 어디가 빈 곳인지 가리는 데 쓴다 */
interface Mask {
  width: number
  height: number
  alpha: Uint8ClampedArray
}

/** 다 받은 손 이미지에서 투명한 정도를 읽어 낸다. 읽지 못하면 null */
function maskOf(image: HTMLImageElement): Mask | null {
  if (!image.complete || image.naturalWidth === 0) return null
  const width = MASK_WIDTH
  const height = Math.round((MASK_WIDTH * image.naturalHeight) / image.naturalWidth)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  try {
    context.drawImage(image, 0, 0, width, height)
    const { data } = context.getImageData(0, 0, width, height)
    return { width, height, alpha: data.filter((_, i) => i % 4 === 3) }
  } catch {
    return null
  }
}

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
  onOutside,
  children,
}: Props) {
  const { width, height } = imageSize
  const screenEl = useRef<HTMLDivElement>(null)
  const handEl = useRef<HTMLImageElement>(null)
  const mask = useRef<Mask | null>(null)
  /** 누르기 시작한 자리가 뒤 배경이었는지 */
  const downOutside = useRef(false)
  /** 그 자리가 손 위인지. 손 이미지의 투명하지 않은 곳이 손이다 */
  const onHand = (x: number, y: number) => {
    const image = handEl.current
    if (!image) return false
    mask.current ??= maskOf(image)
    const rect = image.getBoundingClientRect()
    const u = (x - rect.left) / rect.width
    const v = (y - rect.top) / rect.height
    if (u < 0 || u >= 1 || v < 0 || v >= 1) return false
    // 이미지를 읽지 못했으면 이미지가 놓인 네모 전체를 손으로 친다(잘못 닫히는 것보다 안 닫히는 쪽이 낫다)
    if (!mask.current) return true
    const { width: w, height: h, alpha } = mask.current
    return alpha[Math.floor(v * h) * w + Math.floor(u * w)] > SOLID
  }
  /** 그 자리가 뒤 배경인지. 휴대폰(화면과 테두리)도 손도 아닌 곳이다 */
  const isOutside = (x: number, y: number) => {
    const rect = screenEl.current?.getBoundingClientRect()
    if (!rect) return false
    const edge = rect.width * BEZEL
    const offPhone =
      x < rect.left - edge || x > rect.right + edge || y < rect.top - edge || y > rect.bottom + edge
    return offPhone && !onHand(x, y)
  }
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
      onPointerDown={(e) => {
        downOutside.current = isOutside(e.clientX, e.clientY)
      }}
      onClick={(e) => {
        // 뒤 배경에서 누르고 뒤 배경에서 뗐을 때만 뒤 배경을 누른 것으로 친다
        if (onOutside && downOutside.current && isOutside(e.clientX, e.clientY)) onOutside()
      }}
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
          <img ref={handEl} className={styles.hand} src={handSrc} alt="" draggable={false} />
        ) : (
          <div className={styles.placeholder} aria-hidden="true" />
        )}
        <div
          ref={screenEl}
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
