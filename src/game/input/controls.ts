import type { KeyboardControlsEntry } from '@react-three/drei'

/**
 * 게임 안의 모든 입력은 이 액션으로 바뀐다.
 * 키보드, 가상 조이스틱, 터치 버튼의 차이는 input 폴더 안에서만 다루고, 게임 로직은 이 타입만 본다.
 */
export type GameAction = 'forward' | 'backward' | 'leftward' | 'rightward' | 'jump' | 'run'

export const keyboardMap: KeyboardControlsEntry<GameAction>[] = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
]

/** 모바일 터치 버튼 id (ecctrl/input의 VirtualButton) */
export const JUMP_BUTTON_ID = 'jump'
