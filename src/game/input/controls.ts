import type { KeyboardControlsEntry } from '@react-three/drei'

/**
 * 게임 안의 이동 입력은 이 액션으로 바뀐다.
 * 키 이름은 input 폴더 안에서만 다루고, 게임 로직은 이 타입만 본다.
 */
export type GameAction = 'forward' | 'backward' | 'leftward' | 'rightward'

export const keyboardMap: KeyboardControlsEntry<GameAction>[] = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
]
