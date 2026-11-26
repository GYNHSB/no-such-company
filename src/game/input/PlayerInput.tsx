import { useKeyboardControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { EcctrlHandle, MovementInput } from 'ecctrl'
import { useRef, type RefObject } from 'react'
import type { GameAction } from './controls'

interface PlayerInputProps {
  target: RefObject<EcctrlHandle | null>
  /** false면 키를 누르고 있어도 멈춘다(노트북이나 휴대폰을 보는 동안). */
  active: boolean
}

/**
 * 키보드 입력을 매 프레임 캐릭터 컨트롤러에 전달한다.
 * 성능 규칙: useFrame 안에서는 setState를 쓰지 않고, 스토어는 getState()로 읽기만 한다.
 */
export function PlayerInput({ target, active }: PlayerInputProps) {
  const [, getKeys] = useKeyboardControls<GameAction>()
  // 매 프레임 새 객체를 만들지 않도록 재사용한다.
  const movement = useRef<MovementInput>({})

  useFrame(() => {
    const player = target.current
    if (!player) return

    const keys = getKeys()
    const m = movement.current
    m.forward = active && keys.forward
    m.backward = active && keys.backward
    m.leftward = active && keys.leftward
    m.rightward = active && keys.rightward

    player.setMovement(m)
  })

  return null
}
