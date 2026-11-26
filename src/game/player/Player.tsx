import { PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Ecctrl, type EcctrlHandle } from 'ecctrl'
import { useEffect, useRef } from 'react'
import type { Group } from 'three'
import { PlayerInput } from '@/game/input/PlayerInput'
import { EYE, START } from '@/game/world/anchors'

/** 걷는 속도(m/초) */
const SPEED = 1.8
/** 몸(캡슐)의 반지름과 원통 부분 높이의 절반(m). 벽과 가구에 반지름만큼 가까워지면 멈춘다. */
const RADIUS = 0.22
const HALF_HEIGHT = 0.4
/** ecctrl은 몸을 바닥에서 이만큼 띄워 둔다(m). 문턱 같은 낮은 턱에 걸리지 않게 한다. */
const FLOAT = 0.2
/**
 * 속도를 붙이고 줄이는 빠르기(0~1). 한 프레임에 목표 속도와의 차이를 이 비율만큼 좁힌다.
 * GRIP은 바닥에 발이 붙는 정도로, 위 두 값이 그대로 먹게 가장 크게 둔다.
 */
const ACCELERATION = 0.3
const BRAKING = 0.4
const GRIP = 1.5
/** 서 있을 때 바닥에서 몸 가운데까지의 높이 */
const CENTER = FLOAT + RADIUS + HALF_HEIGHT

interface PlayerProps {
  /** 방을 걸어 다니는 중인지. false면 멈추고, 시점과 커서 잠금을 놓아 준다. */
  active: boolean
  /** 클릭하면 커서를 잠그는 영역의 CSS 선택자. 버튼을 누를 때는 잠기지 않게 3D 화면으로만 한정한다. */
  lockSelector: string
}

/**
 * 1인칭으로 걷는 몸. W A S D(또는 방향키)로 걷고, 화면을 클릭하면 커서가 잠겨 마우스로 둘러본다.
 * 이동과 충돌은 ecctrl(rapier)이 맡고, 카메라는 몸의 눈높이를 따라간다.
 * Physics와 KeyboardControls 안에 둔다.
 */
export function Player({ active, lockSelector }: PlayerProps) {
  const player = useRef<EcctrlHandle>(null)
  const head = useRef<Group>(null)
  const camera = useThree((state) => state.camera)

  // 시작할 때 현관 안쪽에 서서 방 안쪽을 본다
  useEffect(() => {
    camera.position.set(...START.position)
    camera.lookAt(...START.target)
  }, [camera])

  // 카메라가 눈 자리를 따라가게 한다. 물리 계산 사이를 부드럽게 이은 위치를 읽으려고 몸에 붙인 빈 물체의 자리를 쓴다.
  useFrame(({ camera }) => {
    if (active && head.current) head.current.getWorldPosition(camera.position)
  })

  return (
    <>
      <Ecctrl
        ref={player}
        position={[START.position[0], CENTER, START.position[2]]}
        capsuleRadius={RADIUS}
        capsuleHalfHeight={HALF_HEIGHT}
        floatHeight={FLOAT}
        maxWalkVel={SPEED}
        // 좁은 방이라 키를 누르면 바로 걷고 떼면 바로 서게 한다. 기본값은 0.3m쯤 미끄러진다.
        accDeltaTime={ACCELERATION}
        decDeltaTime={BRAKING}
        slideGripFactor={GRIP}
        // 몸이 보이지 않으므로 돌거나 기울 필요가 없다. 기울면 눈 자리가 흔들린다.
        lockRotations
        autoBalance={false}
      >
        <group ref={head} position={[0, EYE - CENTER, 0]} />
      </Ecctrl>
      <PlayerInput target={player} active={active} />
      <PointerLockControls enabled={active} selector={lockSelector} />
    </>
  )
}
