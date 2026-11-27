import { ENTRY_TILE, WEBCAM, type Vec3 } from './anchors'

/** 발밑 바닥 재질. tile: 현관 타일, floor: 방 장판 */
export type Surface = 'tile' | 'floor'

export function surfaceAt(x: number, z: number): Surface {
  const t = ENTRY_TILE
  return x >= t.minX && x <= t.maxX && z >= t.minZ && z <= t.maxZ ? 'tile' : 'floor'
}

/** 점이 노트북 웹캠 시야(원뿔) 안에 있는지 */
export function inWebcamView([x, y, z]: Vec3): boolean {
  const [cx, cy, cz] = WEBCAM.position
  const dx = x - cx
  const dy = y - cy
  const dz = z - cz
  const distance = Math.hypot(dx, dy, dz)
  if (distance === 0 || distance > WEBCAM.range) return false
  const [fx, fy, fz] = WEBCAM.facing
  return (dx * fx + dy * fy + dz * fz) / distance >= Math.cos(WEBCAM.halfAngle)
}
