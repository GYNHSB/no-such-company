import type { KeyboardControlsEntry } from '@react-three/drei'

/**
 * 게임 안의 이동 입력은 이 액션으로 바뀐다.
 * 키 이름은 input 폴더 안에서만 다루고, 게임 로직은 이 타입만 본다.
 * forward, backward는 앞뒤로 걷고, leftward, rightward는 몸을 왼쪽, 오른쪽으로 돌린다(화면도 같이 돈다).
 */
export type GameAction = 'forward' | 'backward' | 'leftward' | 'rightward'

export const keyboardMap: KeyboardControlsEntry<GameAction>[] = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
]

/** 가까이에서 보고 있는 물건을 고르는 키. 클릭으로도 고른다 */
export const PICK_KEY = { code: 'KeyE', label: 'E' }

/** 집어 둔 휴대폰을 꺼내는 키. code는 KeyboardEvent.code, label은 화면에 보이는 이름이다. */
export const PHONE_KEY = { code: 'KeyQ', label: 'Q' }
