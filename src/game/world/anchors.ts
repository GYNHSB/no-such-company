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

/**
 * 침대에 누웠을 때 눈 자리. 베개(room.glb의 bed 북쪽 끝)에 머리를 대고 발은 남쪽(+z)을 향한다.
 * 베개 윗면이 0.59m라서 그보다 조금 위에 둔다.
 */
export const BED_EYE: Vec3 = [-0.7, 0.7, -1.88]

/** 현관 타일 바닥의 범위(room.glb의 entry). 이 안에서는 발소리가 딱딱해진다. */
export const ENTRY_TILE = { minX: 0.8, maxX: 1.9, minZ: -2.3, maxZ: -1.6 }

/**
 * 노트북 웹캠(room.glb의 marker_webcam). 화면과 같은 쪽을 본다.
 * 시야(halfAngle)는 흔한 노트북 웹캠(대각선 약 70~80도)에 맞춘 추정값이다.
 */
export const WEBCAM = {
  position: [-1.3, 0.9627, 0.3519] as Vec3,
  facing: LAPTOP_SCREEN.facing,
  halfAngle: (35 * Math.PI) / 180,
  range: 4,
}

/** 현관문 왼쪽 벽의 전등 스위치 판(room.glb의 entry 안에 있는 8x12cm 판). 누르는 판정은 조금 크게 잡는다. */
export const LIGHT_SWITCH = { center: [0.68, 1.2, -2.28] as Vec3, size: [0.12, 0.16, 0.05] as Vec3 }
/** 책상 스탠드 전구(room.glb의 desk_lamp 안쪽 빛나는 면)와 그 아래 책상 윗면 높이 */
export const DESK_LAMP = { bulb: [-0.9, 1.04, 0.33] as Vec3, deskY: 0.744 }

/** 소리가 나는 자리 */
export const SOUND_AT = {
  fridge: [1.72, 0.6, 3] as Vec3,
  /** 바깥 소리가 들어오는 베란다 문과 창문 */
  veranda: [-0.55, 1, 3.3] as Vec3,
  window: [-1.99, 1.5, 0] as Vec3,
  /** 현관 바닥 우편물(interact_mail) */
  mail: [1.5, 0.05, -1.9] as Vec3,
  chair: [-1.3, 0.45, 1.16] as Vec3,
  /** 책상 위 휴대폰(interact_phone) */
  deskPhone: [-0.92, 0.75, 0.64] as Vec3,
}

/** 유리로 들어오는 햇빛. glass는 유리 안쪽 면의 네 모서리(차례대로 이어진다), direction은 빛이 나아가는 방향 */
export interface SunOpening {
  glass: Vec3[]
  direction: Vec3
}

/** 낮의 햇빛. 서쪽 창문(room.glb의 window)과 베란다 문(veranda_door) 유리로 들어온다. */
export const SUN: { window: SunOpening; veranda: SunOpening } = {
  // 벽과 약 60도(반대쪽에서 재면 120도)로 방 안쪽을 향해 내려온다
  window: {
    glass: [
      [-1.93, 1.88, -0.55],
      [-1.93, 1.88, 0.55],
      [-1.93, 1.1, 0.55],
      [-1.93, 1.1, -0.55],
    ],
    direction: [0.866, -0.374, -0.332],
  },
  // 남서쪽 위에서 비쳐 문 앞 바닥에 닿는다
  veranda: {
    glass: [
      [-1.9, 1.95, 3.27],
      [0.8, 1.95, 3.27],
      [0.8, 0.05, 3.27],
      [-1.9, 0.05, 3.27],
    ],
    direction: [0.28, -0.72, -0.64],
  },
}
