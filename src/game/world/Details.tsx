import { useMemo } from 'react'
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Float32BufferAttribute,
  MeshBasicMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three'
import { useGameStore } from '@/stores/gameStore'
import { DESK_LAMP, LAPTOP_SCREEN, SUN, WEBCAM, type SunOpening } from './anchors'
import { glowMaterial, glowPlaneMaterial } from './glow'

/** 노트북 화면 앞에 띄우는 빛의 거리(m). 화면에 붙이면 화면 그림과 겹쳐 번져 보인다. */
const GLOW_GAP = 0.08
/** 웹캠 불은 렌즈 옆에 붙어 있다(m) */
const LED_GAP = 0.025

/** 밤에 노트북 화면이 어두운 방을 희미하게 밝히는 빛 */
function ScreenGlow() {
  const material = useMemo(() => glowMaterial('#9fb4ff', 0.35), [])
  const [x, y, z] = LAPTOP_SCREEN.center
  const [fx, fy, fz] = LAPTOP_SCREEN.facing
  return (
    <sprite
      material={material}
      position={[x + fx * GLOW_GAP, y + fy * GLOW_GAP, z + fz * GLOW_GAP]}
      scale={[1.4, 1, 1]}
    />
  )
}

/** 햇빛 색 */
const SUN_COLOR = '#ffe9c4'

/**
 * 빛 그림. 가로(u)는 가장자리가 흐리고, 세로(v)는 along이면 v=0(유리 쪽)에서 v=1로 갈수록 사라지고
 * 아니면 양 끝이 흐리다. 검은 곳은 더해도 아무 변화가 없어서 빛만 남는다.
 */
function beamTexture(along: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const g = canvas.getContext('2d')!
  // 그림의 위쪽이 v=1이다
  const vertical = g.createLinearGradient(0, 0, 0, 64)
  if (along) {
    vertical.addColorStop(0, '#000')
    vertical.addColorStop(1, '#fff')
  } else {
    vertical.addColorStop(0, '#000')
    vertical.addColorStop(0.3, '#fff')
    vertical.addColorStop(0.7, '#fff')
    vertical.addColorStop(1, '#000')
  }
  g.fillStyle = vertical
  g.fillRect(0, 0, 64, 64)
  g.globalCompositeOperation = 'multiply'
  const across = g.createLinearGradient(0, 0, 64, 0)
  across.addColorStop(0, '#000')
  across.addColorStop(0.3, '#fff')
  across.addColorStop(0.7, '#fff')
  across.addColorStop(1, '#000')
  g.fillStyle = across
  g.fillRect(0, 0, 64, 64)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/** 더해지는 빛 재질. strength가 클수록 밝다. */
function sunMaterial(along: boolean, strength: number) {
  return new MeshBasicMaterial({
    map: beamTexture(along),
    color: SUN_COLOR,
    opacity: strength,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
  })
}

/** 네 점(차례대로)과 각 점의 그림 좌표로 네모 면들을 만든다 */
function quads(points: Vector3[][], uvs: number[][][]) {
  const position: number[] = []
  const uv: number[] = []
  const index: number[] = []
  points.forEach((quad, i) => {
    const start = position.length / 3
    quad.forEach((p, j) => {
      position.push(p.x, p.y, p.z)
      uv.push(...uvs[i][j])
    })
    index.push(start, start + 1, start + 2, start, start + 2, start + 3)
  })
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  geometry.setIndex(index)
  return geometry
}

/** 유리에서 햇빛 방향으로 length만큼 뻗는 빛줄기. 네 옆면만 그린다. */
function shaft({ glass, direction }: SunOpening, length: number) {
  const corners = glass.map((p) => new Vector3(...p))
  const reach = new Vector3(...direction).normalize().multiplyScalar(length)
  const sides = corners.map((a, i) => {
    const b = corners[(i + 1) % corners.length]
    return [a, b, b.clone().add(reach), a.clone().add(reach)]
  })
  const uv = sides.map(() => [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ])
  return quads(sides, uv)
}

/** 유리를 지난 햇빛이 바닥에 닿는 자리 */
function floorPatch({ glass, direction }: SunOpening) {
  const sun = new Vector3(...direction).normalize()
  const hits = glass.map(([x, y, z]) => {
    const s = (y - FLOOR_LIGHT_Y) / -sun.y
    return new Vector3(x + sun.x * s, FLOOR_LIGHT_Y, z + sun.z * s)
  })
  return quads(
    [hits],
    [
      [
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
      ],
    ],
  )
}

/** 바닥 빛은 바닥보다 살짝 위에 둔다(겹쳐서 깜빡이지 않게) */
const FLOOR_LIGHT_Y = 0.004

/** 낮에 창문과 베란다 문으로 비스듬히 들어오는 옅은 햇빛 */
function Sunlight() {
  const parts = useMemo(
    () => [
      { geometry: shaft(SUN.window, 1.8), material: sunMaterial(true, 0.3) },
      { geometry: shaft(SUN.veranda, 2.2), material: sunMaterial(true, 0.12) },
      { geometry: floorPatch(SUN.veranda), material: sunMaterial(false, 0.2) },
    ],
    [],
  )
  return (
    <>
      {parts.map((part, i) => (
        <mesh key={i} geometry={part.geometry} material={part.material} />
      ))}
    </>
  )
}

/** 웹캠이 켜지면 렌즈 옆에 들어오는 작은 초록 불 */
function WebcamLight() {
  const material = useMemo(() => glowMaterial('#5cff7a', 0.9), [])
  const [x, y, z] = WEBCAM.position
  return (
    <group position={[x + LED_GAP, y, z]}>
      <mesh>
        <sphereGeometry args={[0.0025, 8, 8]} />
        <meshBasicMaterial color="#8dffa2" />
      </mesh>
      <sprite material={material} scale={[0.025, 0.025, 1]} />
    </group>
  )
}

/** 전등 빛 색 */
const LAMP_COLOR = '#ffd9a0'
/** 낮에는 햇빛에 묻혀 전등 빛이 덜 보인다 */
const DAYLIGHT_DIM = 0.45

/** 켠 스탠드: 전구 둘레의 빛 번짐과 책상 위 빛 웅덩이 */
function DeskLampLight({ night }: { night: boolean }) {
  const strength = night ? 1 : DAYLIGHT_DIM
  const glow = useMemo(() => glowMaterial(LAMP_COLOR, 0.6 * strength), [strength])
  const pool = useMemo(() => glowPlaneMaterial(LAMP_COLOR, 0.4 * strength), [strength])
  const [x, y, z] = DESK_LAMP.bulb
  return (
    <>
      <sprite material={glow} position={[x, y - 0.02, z]} scale={[0.35, 0.35, 1]} />
      <mesh
        material={pool}
        position={[x, DESK_LAMP.deskY, z]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.9, 0.9, 1]}
      >
        <planeGeometry />
      </mesh>
    </>
  )
}

/** 방의 작은 디테일: 밤의 화면 빛, 낮의 햇빛, 전등 빛, 웹캠 불 */
export function Details() {
  const night = useGameStore((s) => s.night)
  const webcamOn = useGameStore((s) => s.webcamOn)
  const deskLamp = useGameStore((s) => s.deskLamp)
  return (
    <>
      {night ? <ScreenGlow /> : <Sunlight />}
      {deskLamp && <DeskLampLight night={night} />}
      {webcamOn && <WebcamLight />}
    </>
  )
}
