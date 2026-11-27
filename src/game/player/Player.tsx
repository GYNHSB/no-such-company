import { PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Ecctrl, type EcctrlHandle } from 'ecctrl'
import { useEffect, useRef } from 'react'
import { Vector3, type Group, type Quaternion } from 'three'
import { footstep } from '@/game/audio/sound'
import { PlayerInput } from '@/game/input/PlayerInput'
import { BED_EYE, EYE, START } from '@/game/world/anchors'
import { surfaceAt } from '@/game/world/zones'
import { useGameStore } from '@/stores/gameStore'
import { createBob, stepBob, type BobOffset } from './headBob'

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
/** 누웠을 때는 가슴이 오르내려 숨이 더 크게 느껴진다 */
const LYING_BREATH = 1.5
/** 누운 채 볼 수 있는 범위. 천장(바로 위)에서 이 각도까지만 고개를 돌린다(어느 방향이든). */
const LYING_LOOK = Math.PI / 2
/** 누우면 천장을 보되 발쪽으로 살짝 기울여 본다(라디안) */
const LYING_TILT = 0.15

/** 컴퓨터에 "동작 줄이기"가 켜져 있으면 시점을 흔들지 않는다(멀미 방지) */
const MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1

// 매 프레임 새로 만들지 않도록 재사용한다
const base = new Vector3()
const last = new Vector3()
const forward = new Vector3()
const right = new Vector3()

interface PlayerProps {
  /** 방을 걸어 다니는 중인지. false면 멈추고, 시점과 커서 잠금을 놓아 준다. */
  active: boolean
  /** 침대에 누워 있는지. 걷지 못하고, 천장을 기준으로 고개만 돌린다. */
  lying: boolean
  /** 클릭하면 커서를 잠그는 영역의 CSS 선택자. 버튼을 누를 때는 잠기지 않게 3D 화면으로만 한정한다. */
  lockSelector: string
}

/**
 * 1인칭으로 걷는 몸. W A S D(또는 방향키)로 걷고, 화면을 클릭하면 커서가 잠겨 마우스로 둘러본다.
 * 이동과 충돌은 ecctrl(rapier)이 맡고, 카메라는 몸의 눈높이를 따라간다.
 * 가만히 있으면 숨에 맞춰 살짝 들썩이고, 걸으면 걸음마다 흔들리며 작은 발소리가 난다.
 * Physics와 KeyboardControls 안에 둔다.
 */
export function Player({ active, lying, lockSelector }: PlayerProps) {
  const player = useRef<EcctrlHandle>(null)
  const head = useRef<Group>(null)
  const camera = useThree((state) => state.camera)
  const bob = useRef(createBob())
  const offset = useRef<BobOffset>({ y: 0, side: 0, forward: 0, step: 0 })
  const tracking = useRef(false)

  // 시작할 때 현관 안쪽에 서서 방 안쪽을 본다
  useEffect(() => {
    camera.position.set(...START.position)
    camera.lookAt(...START.target)
  }, [camera])

  // 다른 것을 보러 가면 화면 위 버튼을 누를 수 있게 잠근 커서를 돌려준다. 누워 있을 때는 계속 둘러본다.
  useEffect(() => {
    if (!active && !lying) document.exitPointerLock()
  }, [active, lying])

  // 누우면 베개에 머리를 대고 천장을 본다. 일어나면 눕기 전에 보던 쪽을 다시 본다.
  useEffect(() => {
    if (!lying) return
    const standing: Quaternion = camera.quaternion.clone()
    camera.position.set(...BED_EYE)
    // 발이 +z 쪽이라 그쪽을 보는 방향(y = 180도)에서 고개를 든다. 화면 위쪽이 머리 쪽이 된다.
    camera.rotation.set(LYING_LOOK - LYING_TILT, Math.PI, 0, 'YXZ')
    return () => {
      camera.quaternion.copy(standing)
    }
  }, [camera, lying])

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.1)
    const tension = useGameStore.getState().suspicion / 100
    const out = offset.current

    if (lying) {
      stepBob(bob.current, out, 0, dt, SPEED, tension)
      camera.position.set(BED_EYE[0], BED_EYE[1] + out.y * LYING_BREATH * MOTION, BED_EYE[2])
      tracking.current = false
      return
    }
    if (!active || !head.current) {
      tracking.current = false
      return
    }

    // 카메라가 눈 자리를 따라가게 한다. 물리 계산 사이를 부드럽게 이은 위치를 읽으려고 몸에 붙인 빈 물체의 자리를 쓴다.
    head.current.getWorldPosition(base)
    const moved = tracking.current ? Math.hypot(base.x - last.x, base.z - last.z) : 0
    last.copy(base)
    tracking.current = true

    stepBob(bob.current, out, moved, dt, SPEED, tension)
    if (out.step !== 0) footstep(surfaceAt(base.x, base.z), out.step)

    // 좌우·앞 흔들림은 시선의 수평 방향을 기준으로 더한다
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    right.set(-forward.z, 0, forward.x)
    camera.position
      .copy(base)
      .addScaledVector(right, out.side * MOTION)
      .addScaledVector(forward, out.forward * MOTION)
    camera.position.y += out.y * MOTION
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
      <PointerLockControls
        enabled={active || lying}
        selector={lockSelector}
        // 각도는 바로 위(천장)에서 잰다. 누우면 90도까지(수평선 위쪽만), 서 있을 때는 기본값(바로 아래까지)
        maxPolarAngle={lying ? LYING_LOOK : Math.PI}
      />
    </>
  )
}
