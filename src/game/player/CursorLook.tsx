import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Euler } from 'three'

/** 커서가 화면 끝에 있을 때 고개가 돌아가는 각도(라디안). 좌우 약 26도, 위아래 약 20도 */
const MAX_YAW = 0.45
const MAX_PITCH = 0.35
/** 고개가 커서를 따라가는 빠르기(1/초). 클수록 바로 따라가고, 작을수록 천천히 따라간다 */
const SMOOTH = 7
/** 화면 가운데 근처에서는 덜 움직이게 하는 정도. 1이면 커서가 간 만큼 그대로, 클수록 가운데가 잔잔하다 */
const CURVE = 1.4
/** 고개를 들고 숙일 수 있는 한계에서 조금 남겨 두는 각도. 바로 위나 아래를 보면 좌우가 뒤집히기 때문이다 */
const EDGE = 0.01

// 매 프레임 새로 만들지 않도록 재사용한다
const euler = new Euler(0, 0, 0, 'YXZ')

const curve = (v: number) => Math.sign(v) * Math.abs(v) ** CURVE

interface CursorLookProps {
  /** false면 고개를 기울이지 않고 정면으로 되돌린다(노트북이나 휴대폰을 보는 동안) */
  enabled: boolean
  /** 자세(서 있음, 앉음, 누움). 바뀌면 그 자세의 정면을 새로 잡는다 */
  pose: string | null
  /** 바로 위(천장)에서 잰 각도로, 여기까지만 고개를 숙인다. 누웠을 때는 수평선까지만 본다 */
  maxPolarAngle: number
}

/**
 * 커서가 있는 쪽으로 고개를 살짝 기울인다. 커서가 화면 가운데면 정면을 보고, 끝으로 갈수록 그쪽을 본다.
 * 커서를 잠그지 않으므로 Esc나 화면 위 단추와 부딪히지 않고, 커서가 멈추면 시점도 멈춘다.
 * 기우는 범위가 정해져 있어서 몸을 돌리는 것은 키(A, D)로 한다. 마우스에서만 쓴다.
 *
 * 다른 코드(몸 돌리기, 눕기, 앉기, 노트북 보기)는 기울이기 전의 정면을 기준으로 시점을 다룬다.
 * 그래서 꺼지거나 자세가 바뀌기 직전에 기울인 만큼을 되돌려 놓고, 다시 켜지면 그때의 시점을 정면으로 삼는다.
 */
export function CursorLook({ enabled, pose, maxPolarAngle }: CursorLookProps) {
  const camera = useThree((state) => state.camera)
  const canvas = useThree((state) => state.gl.domElement)
  /** 커서가 있는 자리. 화면 가운데가 (0, 0), 끝이 ±1 */
  const cursor = useRef({ x: 0, y: 0 })
  /** 지금 기울인 각도와, 기울이기 전의 위아래 각도. fresh면 다음 프레임에 정면을 새로 잡는다 */
  const lean = useRef({ yaw: 0, pitch: 0, basePitch: 0, fresh: true })

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const rect = canvas.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      cursor.current.x = Math.max(-1, Math.min(1, x))
      cursor.current.y = Math.max(-1, Math.min(1, y))
    }
    // 커서가 창 밖으로 나가면 정면으로 돌아온다
    const leave = () => {
      cursor.current.x = 0
      cursor.current.y = 0
    }
    window.addEventListener('pointermove', move)
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [canvas])

  useEffect(() => {
    const state = lean.current
    // 자세를 잡는 코드가 이 뒤에 시점을 바꾸므로, 정면은 다음 프레임에 잡는다
    state.fresh = true
    return () => {
      if (state.fresh) return
      // 기울인 만큼을 되돌려 정면을 본 상태로 넘겨준다
      euler.setFromQuaternion(camera.quaternion)
      euler.y -= state.yaw
      euler.x = state.basePitch
      camera.quaternion.setFromEuler(euler)
      state.fresh = true
    }
  }, [camera, enabled, pose])

  useFrame((_, delta) => {
    if (!enabled) return
    const state = lean.current
    euler.setFromQuaternion(camera.quaternion)
    if (state.fresh) {
      state.yaw = 0
      state.pitch = 0
      state.basePitch = euler.x
      state.fresh = false
    }
    // 커서 쪽으로 조금씩 다가간다. 프레임 수가 달라도 같은 빠르기로 따라간다
    const step = 1 - Math.exp(-Math.min(delta, 0.1) * SMOOTH)
    const yaw = state.yaw + (-curve(cursor.current.x) * MAX_YAW - state.yaw) * step
    const pitch = state.pitch + (curve(cursor.current.y) * MAX_PITCH - state.pitch) * step
    // 좌우는 키로도 도니까 달라진 만큼만 더하고, 위아래는 정면에서 잰 각도로 둔다
    euler.y += yaw - state.yaw
    euler.x = Math.max(
      Math.PI / 2 - maxPolarAngle + EDGE,
      Math.min(Math.PI / 2 - EDGE, state.basePitch + pitch),
    )
    state.yaw = yaw
    state.pitch = pitch
    camera.quaternion.setFromEuler(euler)
  })

  return null
}
