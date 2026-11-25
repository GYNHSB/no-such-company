import { CuboidCollider, RigidBody } from '@react-three/rapier'

const OBSTACLES: { position: [number, number, number]; size: [number, number, number] }[] = [
  { position: [3, 0.5, -2], size: [1, 1, 1] },
  { position: [-4, 0.25, -4], size: [2, 0.5, 2] },
  { position: [0, 0.75, -7], size: [4, 1.5, 1] },
]

/** 시작용 테스트 공간: 바닥과 장애물 몇 개. 실제 맵은 public/models의 glb로 교체한다. */
export function World() {
  return (
    <>
      <hemisphereLight args={['#dfe7ff', '#2a2f3a', 1.2]} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[20, 0.5, 20]} position={[0, -0.5, 0]} />
        <mesh rotation-x={-Math.PI / 2}>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#3a4152" />
        </mesh>
      </RigidBody>

      {OBSTACLES.map(({ position, size }) => (
        <RigidBody key={position.join(',')} type="fixed" colliders="cuboid" position={position}>
          <mesh>
            <boxGeometry args={size} />
            <meshStandardMaterial color="#6b7894" />
          </mesh>
        </RigidBody>
      ))}
    </>
  )
}
