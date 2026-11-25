import { useKeyboardControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { EcctrlHandle, MovementInput } from 'ecctrl'
import { useButtonStore, useJoystickStore } from 'ecctrl/input'
import { useRef, type RefObject } from 'react'
import { JUMP_BUTTON_ID, type GameAction } from './controls'

/**
 * 키보드와 터치 입력을 합쳐 매 프레임 캐릭터 컨트롤러에 전달한다.
 * 성능 규칙: useFrame 안에서는 setState를 쓰지 않고, 스토어는 getState()로 읽기만 한다.
 */
export function PlayerInput({ target }: { target: RefObject<EcctrlHandle | null> }) {
  const [, getKeys] = useKeyboardControls<GameAction>()
  // 매 프레임 새 객체를 만들지 않도록 재사용한다.
  const movement = useRef<MovementInput>({ joystick: { x: 0, y: 0 } })

  useFrame(() => {
    const player = target.current
    if (!player) return

    const keys = getKeys()
    const stick = useJoystickStore.getState().joysticks.default
    const jumpButton = useButtonStore.getState().buttons[JUMP_BUTTON_ID] ?? false

    const m = movement.current
    m.forward = keys.forward
    m.backward = keys.backward
    m.leftward = keys.leftward
    m.rightward = keys.rightward
    m.run = keys.run
    m.jump = keys.jump || jumpButton
    m.joystick!.x = stick?.x ?? 0
    m.joystick!.y = stick?.y ?? 0

    player.setMovement(m)
  })

  return null
}
