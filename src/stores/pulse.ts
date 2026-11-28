/**
 * 지금 심장 소리의 상태. 방의 소리(RoomSounds)가 박동마다 적고, 왼쪽 위 심박수 표시(HeartRate)가 읽는다.
 * 3D 매 프레임 코드에서 바뀌므로 스토어가 아니라 보통 객체로 둔다(useFrame 안에서 스토어를 바꾸지 않는 규칙).
 */
export const pulse: { bpm: number | null; beatAt: number } = { bpm: null, beatAt: 0 }
