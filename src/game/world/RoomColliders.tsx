import { useGLTF } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useMemo } from 'react'
import { Quaternion, Vector3, type Mesh } from 'three'
import { ROOM_URL } from './assets'

type Vec3 = [number, number, number]

interface Box {
  name: string
  position: Vec3
  quaternion: [number, number, number, number]
  /** 가운데에서 각 면까지의 거리(m) */
  half: Vec3
}

/**
 * room.glb의 col_* 상자를 물리 충돌체로 만든다. 벽, 바닥, 천장, 가구가 모두 여기서 나온다.
 * 상자의 회전도 그대로 옮기므로 비스듬히 놓인 가구도 모양대로 막힌다.
 */
export function RoomColliders() {
  const { scene } = useGLTF(ROOM_URL)

  const boxes = useMemo(() => {
    const list: Box[] = []
    const position = new Vector3()
    const quaternion = new Quaternion()
    const scale = new Vector3()
    scene.updateWorldMatrix(true, true)
    scene.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh || !mesh.name.startsWith('col_')) return
      mesh.geometry.computeBoundingBox()
      const bounds = mesh.geometry.boundingBox!
      mesh.matrixWorld.decompose(position, quaternion, scale)
      const size = bounds.getSize(new Vector3()).multiply(scale)
      list.push({
        name: mesh.name,
        position: bounds.getCenter(new Vector3()).applyMatrix4(mesh.matrixWorld).toArray(),
        quaternion: quaternion.toArray() as Box['quaternion'],
        half: [Math.abs(size.x) / 2, Math.abs(size.y) / 2, Math.abs(size.z) / 2],
      })
    })
    return list
  }, [scene])

  return (
    <RigidBody type="fixed" colliders={false}>
      {boxes.map((box) => (
        <CuboidCollider
          key={box.name}
          args={box.half}
          position={box.position}
          quaternion={box.quaternion}
        />
      ))}
    </RigidBody>
  )
}
