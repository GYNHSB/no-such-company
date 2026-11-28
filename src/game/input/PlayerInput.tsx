import { useKeyboardControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { EcctrlHandle, MovementInput } from 'ecctrl'
import { useRef, type RefObject } from 'react'
import { Euler } from 'three'
import type { GameAction } from './controls'

interface PlayerInputProps {
  target: RefObject<EcctrlHandle | null>
  /** false면 키를 누르고 있어도 멈춘다(노트북이나 휴대폰을 보는 동안). */
  active: boolean
  /** 좌우 키로 고개를 돌릴 수 있는지. 걷지 못해도 의자에 앉아 있으면 돌릴 수 있다. 주지 않으면 active를 따른다. */
  turning?: boolean
}

/** A, D로 몸을 돌리는 빠르기(라디안/초). 한 바퀴에 3초쯤 걸린다 */
const TURN_SPEED = 2.1

// 매 프레임 새로 만들지 않도록 재사용한다
const euler = new Euler(0, 0, 0, 'YXZ')

/**
 * 키보드 입력을 매 프레임 캐릭터 컨트롤러에 전달한다. 앞뒤 키는 걷고, 좌우 키는 몸을 돌린다.
 * 걷는 방향은 보는 방향을 따르므로, 몸을 돌리면 화면도 같이 돌고 그쪽으로 걷게 된다.
 * 성능 규칙: useFrame 안에서는 setState를 쓰지 않고, 스토어는 getState()로 읽기만 한다.
 */
export function PlayerInput({ target, active, turning = active }: PlayerInputProps) {
  const [, getKeys] = useKeyboardControls<GameAction>()
  // 매 프레임 새 객체를 만들지 않도록 재사용한다.
  const movement = useRef<MovementInput>({})

  useFrame(({ camera }, delta) => {
    const player = target.current
    if (!player) return

    const keys = getKeys()
    const m = movement.current
    m.forward = active && keys.forward
    m.backward = active && keys.backward
    // 좌우 키는 옆으로 걷지 않고 몸을 돌린다
    m.leftward = false
    m.rightward = false
    const turn = (keys.leftward ? 1 : 0) - (keys.rightward ? 1 : 0)
    if (turning && turn !== 0) {
      euler.setFromQuaternion(camera.quaternion)
      euler.y += turn * TURN_SPEED * Math.min(delta, 0.1)
      camera.quaternion.setFromEuler(euler)
    }

    player.setMovement(m)
  })

  return null
}
