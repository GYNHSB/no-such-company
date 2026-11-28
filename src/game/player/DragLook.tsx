import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { Euler } from 'three'

/** 마우스를 1픽셀 끌 때 시점이 도는 각도(라디안) */
const SENSITIVITY = 0.004
/** 고개를 들고 숙일 수 있는 한계에서 조금 남겨 두는 각도. 바로 위나 아래를 보면 좌우가 뒤집히기 때문이다 */
const EDGE = 0.01

interface DragLookProps {
  /** false면 끌어도 시점이 돌지 않는다(노트북이나 휴대폰을 보는 동안) */
  enabled: boolean
  /** 바로 위(천장)에서 잰 각도로, 여기까지만 고개를 숙인다. 누웠을 때는 수평선까지만 본다 */
  maxPolarAngle: number
}

/**
 * 화면을 누른 채 끌어서 둘러본다. 커서를 잠그지 않아서 Esc나 화면 위 단추와 부딪히지 않는다.
 * 터치 기기와 "동작 줄이기"를 켠 컴퓨터에서 쓴다. 그 밖에는 커서 쪽으로 고개를 기울인다(CursorLook).
 * 끌지 않고 누르면 그 자리의 물건을 고를 수 있다. 끄는 쪽으로 화면이 따라온다(오른쪽으로 끌면 왼쪽을 본다).
 * 끄는 동안에는 화면에 data-drag를 달아 둔다. 커서 모양을 바꾸는 데 쓴다.
 */
export function DragLook({ enabled, maxPolarAngle }: DragLookProps) {
  const camera = useThree((state) => state.camera)
  const canvas = useThree((state) => state.gl.domElement)

  useEffect(() => {
    if (!enabled) return
    const euler = new Euler(0, 0, 0, 'YXZ')
    let dragging = false
    let lastX = 0
    let lastY = 0

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      canvas.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      if (dx === 0 && dy === 0) return
      canvas.toggleAttribute('data-drag', true)
      euler.setFromQuaternion(camera.quaternion)
      euler.y += dx * SENSITIVITY
      euler.x += dy * SENSITIVITY
      // 고개는 천장부터 maxPolarAngle까지만 움직인다
      euler.x = Math.max(Math.PI / 2 - maxPolarAngle + EDGE, Math.min(Math.PI / 2 - EDGE, euler.x))
      camera.quaternion.setFromEuler(euler)
    }
    const up = (e: PointerEvent) => {
      dragging = false
      canvas.removeAttribute('data-drag')
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
    }

    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    return () => {
      canvas.removeAttribute('data-drag')
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
    }
  }, [enabled, maxPolarAngle, camera, canvas])

  return null
}
