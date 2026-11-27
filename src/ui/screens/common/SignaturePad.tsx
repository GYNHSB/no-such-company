import { useEffect, useRef, useState, type PointerEvent } from 'react'
import styles from './SignaturePad.module.css'

/** 이만큼(px) 그어야 서명으로 친다. 점 하나 찍고 끝내지 못하게 한다. */
const MIN_INK = 60

interface Props {
  /**
   * "서명 완료"를 눌렀을 때. 그린 서명을 배경이 투명한 PNG 그림 주소(data URL)로 넘긴다.
   * 서류의 서명 칸에 이 그림을 넣는다. 공범 기록은 엔진이 한다. 그림은 브라우저 밖으로 보내지 않는다.
   */
  onSign: (image: string) => void
}

/**
 * 마우스(또는 손가락)로 직접 그리는 서명란. 다시 쓰기와 서명 완료가 있고, 완료하면 더 그릴 수 없다.
 * 마우스를 못 쓰면 서명란에 초점을 두고 Enter나 Space를 눌러 서명을 그려 넣을 수 있다.
 * 색과 선은 노트북 웹 화면(--web-*) 토큰을 따라 서류와 어울리게 한다.
 */
export function SignaturePad({ onSign }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [ink, setInk] = useState(0)
  const [done, setDone] = useState(false)

  // 화면 밀도에 맞춰 캔버스를 선명하게 맞추고, 선 모양을 정한다
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const ratio = window.devicePixelRatio || 1
    canvas.width = canvas.clientWidth * ratio
    canvas.height = canvas.clientHeight * ratio
    ctx.scale(ratio, ratio)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2.2
    ctx.strokeStyle = getComputedStyle(canvas).color
  }, [])

  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - box.left, y: e.clientY - box.top }
  }

  const drawTo = (to: { x: number; y: number }) => {
    const ctx = canvasRef.current?.getContext('2d')
    const from = last.current
    if (!ctx || !from) return
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    setInk((n) => n + Math.hypot(to.x - from.x, to.y - from.y))
    last.current = to
  }

  /** 키보드로 서명할 때 그려 넣는 필기체 흉내 획 */
  const scribble = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    last.current = { x: w * 0.18, y: h * 0.62 }
    for (let i = 1; i <= 48; i++) {
      const t = i / 48
      drawTo({
        x: w * (0.18 + 0.6 * t),
        y: h * (0.6 - 0.22 * Math.sin(t * Math.PI * 5) * (1 - t * 0.5) - 0.08 * t),
      })
    }
    last.current = null
  }

  const clear = () => {
    const canvas = canvasRef.current
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    setInk(0)
  }

  return (
    <div className={styles.pad}>
      <div className={styles.area}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          tabIndex={done ? -1 : 0}
          role="img"
          aria-label={done ? '서명함' : '서명란. 마우스로 서명하거나 Enter를 눌러 서명'}
          onPointerDown={(e) => {
            if (done) return
            e.currentTarget.setPointerCapture(e.pointerId)
            last.current = point(e)
          }}
          onPointerMove={(e) => {
            if (!done && last.current) drawTo(point(e))
          }}
          onPointerUp={() => {
            last.current = null
          }}
          onKeyDown={(e) => {
            if (done || (e.key !== 'Enter' && e.key !== ' ')) return
            e.preventDefault()
            clear()
            scribble()
          }}
        />
        {ink === 0 && (
          <span className={styles.hint} aria-hidden="true">
            여기에 서명하세요
          </span>
        )}
      </div>
      {!done && (
        <div className={styles.actions}>
          <button type="button" className={styles.clear} onClick={clear} disabled={ink === 0}>
            다시 쓰기
          </button>
          <button
            type="button"
            className={styles.submit}
            disabled={ink < MIN_INK}
            onClick={() => {
              setDone(true)
              onSign(canvasRef.current?.toDataURL('image/png') ?? '')
            }}
          >
            서명 완료
          </button>
        </div>
      )}
    </div>
  )
}
