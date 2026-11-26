import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { PerspectiveCamera, Quaternion, Vector3 } from 'three'
import { LAPTOP_SCREEN } from '@/game/world/anchors'

/** 노트북 화면이 브라우저 화면에서 차지하는 비율. 1이면 가장자리까지 꽉 찬다. */
const LAPTOP_FILL = 0.9

/**
 * 노트북 앞에 앉은 시점. seated가 되면 노트북 화면이 가득 차도록 카메라를 옮기고,
 * 일어나면 앉기 전에 보던 곳으로 되돌린다. 몸은 서 있던 자리에 그대로 둔다.
 */
export function LaptopView({ seated }: { seated: boolean }) {
  const camera = useThree((state) => state.camera)
  const standing = useRef<{ position: Vector3; quaternion: Quaternion } | null>(null)

  useEffect(() => {
    if (seated) {
      standing.current = {
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
      }
      // 화면을 정면에서 보고, 가로와 세로가 모두 들어오는 가장 가까운 거리까지 다가간다
      const lens = camera as PerspectiveCamera
      const half = Math.tan((lens.fov * Math.PI) / 360)
      const distance =
        Math.max(LAPTOP_SCREEN.height / half, LAPTOP_SCREEN.width / (half * lens.aspect)) /
        (2 * LAPTOP_FILL)
      const [x, y, z] = LAPTOP_SCREEN.center
      const [fx, fy, fz] = LAPTOP_SCREEN.facing
      camera.position.set(x + fx * distance, y + fy * distance, z + fz * distance)
      camera.lookAt(x, y, z)
    } else if (standing.current) {
      camera.position.copy(standing.current.position)
      camera.quaternion.copy(standing.current.quaternion)
      standing.current = null
    }
  }, [camera, seated])

  return null
}
