import { type PointerEvent, useEffect, useRef, useState } from 'react'
import styles from './UnlockSlider.module.css'

/** 손잡이를 이만큼(전체의 비율) 밀고 놓으면 풀린다 */
const UNLOCK_AT = 0.6
/** 눌렀을 때 손잡이가 끝까지 가는 동안 기다리는 시간(ms). CSS의 움직임 시간과 같다 */
const SLIDE_MS = 220
/** 이보다 적게 움직였으면 민 것이 아니라 누른 것으로 본다(px) */
const TAP_SLOP = 4

interface Props {
  /** 손잡이 옆에 보이는 글 */
  label?: string
  /** 손잡이를 끝까지 밀었거나 줄을 눌렀을 때 */
  onUnlock: () => void
}

/**
 * 잠금 화면 아래의 "밀어서 잠금 해제" 줄. 손잡이를 오른쪽으로 밀면 풀린다.
 * 마우스로 밀기 번거로울 수 있어서 줄을 누르기만 해도(키보드 포함) 손잡이가 끝까지 가고 풀린다.
 */
export function UnlockSlider({ label = '밀어서 잠금 해제', onUnlock }: Props) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const track = useRef<HTMLButtonElement>(null)
  const knob = useRef<HTMLSpanElement>(null)
  const drag = useRef({ startX: 0, moved: false })
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  /** 손잡이가 갈 수 있는 거리(px) */
  const reach = () => {
    if (!track.current || !knob.current) return 0
    const { paddingLeft, paddingRight } = getComputedStyle(track.current)
    const inner = track.current.clientWidth - parseFloat(paddingLeft) - parseFloat(paddingRight)
    return Math.max(0, inner - knob.current.offsetWidth)
  }

  const finish = () => {
    setOffset(reach())
    clearTimeout(timer.current)
    timer.current = setTimeout(onUnlock, SLIDE_MS)
  }

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startX: e.clientX, moved: false }
    setDragging(true)
  }

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return
    const moved = e.clientX - drag.current.startX
    if (Math.abs(moved) > TAP_SLOP) drag.current.moved = true
    setOffset(Math.min(reach(), Math.max(0, moved)))
  }

  const onPointerUp = () => {
    if (!dragging) return
    setDragging(false)
    if (!drag.current.moved) return // 누르기만 한 것은 onClick이 처리한다
    if (offset >= reach() * UNLOCK_AT) finish()
    else setOffset(0)
  }

  return (
    <button
      ref={track}
      type="button"
      className={`${styles.track} ${dragging ? styles.dragging : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={() => {
        // 밀다가 놓은 뒤에 오는 클릭은 건너뛴다
        if (drag.current.moved) drag.current.moved = false
        else finish()
      }}
    >
      <span
        ref={knob}
        className={styles.knob}
        style={{ transform: `translateX(${offset}px)` }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24">
          <path d="M5 12h13M12.5 6.5L18 12l-5.5 5.5" />
        </svg>
      </span>
      <span className={styles.label}>{label}</span>
    </button>
  )
}
