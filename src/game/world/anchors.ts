/** 방 안의 자리 값(m). room.glb를 바꾸면 이 값도 맞춘다. */

export type Vec3 = [number, number, number]

/** 서 있을 때의 눈높이 */
export const EYE = 1.35

/** 시작 위치(현관 안쪽)와 처음 바라보는 곳(방 안쪽). room.glb의 spawn_start와 같은 자리다. */
export const START: { position: Vec3; target: Vec3 } = {
  position: [0.9, EYE, -1],
  target: [0.9, EYE, 1],
}

/** 노트북 화면(밝은 네모)의 가운데 위치와 크기 */
export const LAPTOP_SCREEN: { center: Vec3; facing: Vec3; width: number; height: number } = {
  center: [-1.3, 0.8637, 0.3783],
  // 뒤로 젖힌 화면이 바라보는 방향(길이 1)
  facing: [0, 0.2571, 0.9664],
  width: 0.31,
  height: 0.19,
}
