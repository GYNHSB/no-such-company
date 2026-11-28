import { useFrame, useThree } from '@react-three/fiber'
import { Ecctrl, type EcctrlHandle } from 'ecctrl'
import { useEffect, useRef } from 'react'
import { Vector3, type Group, type Quaternion } from 'three'
import { footstep } from '@/game/audio/sound'
import { PlayerInput } from '@/game/input/PlayerInput'
import { BED_EYE, EYE, LAPTOP_SCREEN, SEAT_EYE, START } from '@/game/world/anchors'
import { surfaceAt } from '@/game/world/zones'
import { useGameStore } from '@/stores/gameStore'
import { CursorLook } from './CursorLook'
import { DragLook } from './DragLook'
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
/**
 * 커서 쪽으로 고개를 기울여 둘러볼지. 마우스로 쓰는 기기에서만 그렇게 하고,
 * 터치 기기와 "동작 줄이기"를 켠 컴퓨터에서는 화면을 끌어서 둘러본다.
 */
const LEAN = MOTION === 1 && !window.matchMedia('(pointer: coarse)').matches

// 매 프레임 새로 만들지 않도록 재사용한다
const base = new Vector3()
const last = new Vector3()
const forward = new Vector3()
const right = new Vector3()

/** 쉬는 자세. bed: 침대에 누움, seat: 의자에 앉음. 걷지 못하고 그 자리에서 고개만 돌린다 */
export type Rest = 'bed' | 'seat'

interface PlayerProps {
  /** 방을 걸어 다니는 중인지. false면 멈춘다. */
  active: boolean
  /** 눕거나 앉아 있으면 그 자세. 앉은 채로 노트북이나 휴대폰을 보는 동안에도 seat이다. */
  rest: Rest | null
  /** 둘러볼 수 있는지(걷는 중이거나, 눕거나 앉아서 방을 보는 중). false면 끌어도 시점이 돌지 않는다. */
  looking: boolean
}

/**
 * 1인칭으로 걷는 몸. W S(또는 위아래 방향키)로 걷고, A D(또는 좌우 방향키)로 몸을 돌린다.
 * 커서는 잠그지 않는다. 커서가 있는 쪽으로 고개를 살짝 기울여 둘러본다(CursorLook).
 * 터치 기기와 "동작 줄이기"를 켠 컴퓨터에서는 화면을 누른 채 끌어서 둘러본다(DragLook).
 * 침대에 눕거나 의자에 앉으면 눈이 그 자리로 가고, 일어나면 몸이 서 있던 자리로 돌아온다.
 * 이동과 충돌은 ecctrl(rapier)이 맡고, 카메라는 몸의 눈높이를 따라간다.
 * 가만히 있으면 숨에 맞춰 살짝 들썩이고, 걸으면 걸음마다 흔들리며 작은 발소리가 난다.
 * Physics와 KeyboardControls 안에 둔다.
 */
export function Player({ active, rest, looking }: PlayerProps) {
  const lying = rest === 'bed'
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

  // 누우면 베개에 머리를 대고 천장을 보고, 앉으면 책상 위 노트북 쪽을 본다.
  // 일어나면 눕거나 앉기 전에 보던 쪽을 다시 본다.
  useEffect(() => {
    if (!rest) return
    const standing: Quaternion = camera.quaternion.clone()
    if (rest === 'bed') {
      camera.position.set(...BED_EYE)
      // 발이 +z 쪽이라 그쪽을 보는 방향(y = 180도)에서 고개를 든다. 화면 위쪽이 머리 쪽이 된다.
      camera.rotation.set(LYING_LOOK - LYING_TILT, Math.PI, 0, 'YXZ')
    } else {
      camera.position.set(...SEAT_EYE)
      camera.lookAt(...LAPTOP_SCREEN.center)
    }
    return () => {
      camera.quaternion.copy(standing)
    }
  }, [camera, rest])

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.1)
    const tension = useGameStore.getState().suspicion / 100
    const out = offset.current

    if (rest) {
      // 눕거나 앉은 자리에서 숨에 맞춰 살짝 오르내린다. 앉은 채로 노트북이나 휴대폰을 보는 동안에는 시점을 건드리지 않는다
      if (looking) {
        const eye = rest === 'bed' ? BED_EYE : SEAT_EYE
        const breath = rest === 'bed' ? LYING_BREATH : 1
        stepBob(bob.current, out, 0, dt, SPEED, tension)
        camera.position.set(eye[0], eye[1] + out.y * breath * MOTION, eye[2])
      }
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
      <PlayerInput
        target={player}
        active={active}
        turning={active || (rest === 'seat' && looking)}
      />
      {/* 눕거나 앉아 있을 때도 계속 둘러본다. 각도는 바로 위(천장)에서 잰다. 누우면 90도까지(수평선 위쪽만), 그 밖에는 바로 아래까지 */}
      {LEAN ? (
        <CursorLook enabled={looking} pose={rest} maxPolarAngle={lying ? LYING_LOOK : Math.PI} />
      ) : (
        <DragLook enabled={looking} maxPolarAngle={lying ? LYING_LOOK : Math.PI} />
      )}
    </>
  )
}
