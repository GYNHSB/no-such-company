import { useFrame } from '@react-three/fiber'
import { Ecctrl, type EcctrlHandle } from 'ecctrl'
import { EcctrlCameraControls, type EcctrlCameraControlsHandle } from 'ecctrl/camera'
import { useRef } from 'react'
import { PlayerInput } from '@/game/input/PlayerInput'

/** 플레이어 캐릭터와 3인칭 추적 카메라 */
export function Player() {
  const player = useRef<EcctrlHandle>(null)
  const cameraControls = useRef<EcctrlCameraControlsHandle>(null)

  // 카메라가 캐릭터를 따라가게 한다. 값은 직접 바꾸고 React 렌더링은 거치지 않는다.
  useFrame(() => {
    const p = player.current
    const c = cameraControls.current
    if (!p || !c) return
    c.moveTo(p.currPos.x, p.currPos.y, p.currPos.z, true)
  })

  return (
    <>
      <Ecctrl ref={player} position={[0, 2, 0]}>
        <mesh>
          <capsuleGeometry args={[0.3, 0.7]} />
          <meshStandardMaterial color="#f2b134" />
        </mesh>
      </Ecctrl>
      <PlayerInput target={player} />
      <EcctrlCameraControls
        ref={cameraControls}
        makeDefault
        smoothTime={0.1}
        minDistance={2}
        maxDistance={10}
      />
    </>
  )
}
