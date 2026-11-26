import { PointerLockControls, useGLTF, useTexture } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  Box3,
  CanvasTexture,
  ExtrudeGeometry,
  Group,
  Mesh as ThreeMesh,
  MeshBasicMaterial,
  Quaternion,
  Raycaster,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
  type PerspectiveCamera,
} from 'three'

const ROOM_URL = `${import.meta.env.BASE_URL}models/room.glb`
const LIGHTMAP_URL = `${import.meta.env.BASE_URL}models/room_lightmap.png`
// 두 손으로 쥔 휴대폰 그림(1239 x 1269, 배경 투명). 소매가 그림 아래 좌우 끝에서 잘려 있다.
const HAND_URL = `${import.meta.env.BASE_URL}images/hand_phone_day.webp`

/** 어떤 장면을 보고 있는지. room: 방을 걸어 다님, laptop: 의자에 앉아 노트북을 봄, phone: 휴대폰을 손에 쥠 */
type Scene = 'room' | 'laptop' | 'phone'
/** 화면 가운데 점이 가리키는 누를 수 있는 물건 */
type Aim = 'laptop' | 'phone' | null

type Vec3 = [number, number, number]
/** 서 있을 때의 눈높이(m) */
const EYE = 1.35
/** 걷는 속도(m/초)와 몸의 반지름(m). 벽과 가구에 이만큼 가까워지면 멈춘다. */
const SPEED = 1.8
const BODY = 0.22
/** 물건을 가리킬 수 있는 거리(m) */
const REACH = 3
/** 시작 위치(현관 안쪽)와 처음 바라보는 곳(방 안쪽). room.glb의 spawn_start와 같은 자리다. */
const START: { position: Vec3; target: Vec3 } = { position: [0.9, EYE, -1], target: [0.9, EYE, 1] }
/** 노트북 화면(밝은 네모)의 가운데 위치와 크기(m). 노트북을 쓰는 장면에서는 이 화면이 가득 차도록 다가간다. */
const LAPTOP_SCREEN: { center: Vec3; facing: Vec3; width: number; height: number } = {
  center: [-1.3, 0.8637, 0.3783],
  // 뒤로 젖힌 화면이 바라보는 방향(길이 1)
  facing: [0, 0.2571, 0.9664],
  width: 0.31,
  height: 0.19,
}
/** 노트북 화면이 브라우저 화면에서 차지하는 비율. 1이면 가장자리까지 꽉 찬다. */
const LAPTOP_FILL = 0.9
/** 손 그림 안에서 휴대폰 화면이 차지하는 자리. 그림 크기에 대한 비율이라 그림을 바꾸면 이 값도 바꾼다. */
const PHONE_SCREEN = { left: 0.339, top: 0.1182, width: 0.3204, height: 0.6698 }
/** 손 그림을 화면 아래로 내리는 정도(그림 높이에 대한 비율). 소매가 잘린 그림 아래 좌우 끝을 화면 밖으로 숨긴다. */
const HAND_SINK = 0.06
/** 휴대폰을 집은 뒤 휴대폰을 꺼내는 키. code는 KeyboardEvent.code, label은 화면에 보이는 이름이다. */
const PHONE_KEY = { code: 'KeyQ', label: 'Q' }
/** 클릭하면 커서를 잠그는 영역. 버튼을 누를 때는 잠기지 않게 3D 화면으로만 한정한다. */
const VIEW_ID = 'hyeopseong-view'

/** 물체나 그 부모의 이름을 보고 누를 수 있는 물건인지 알아낸다 */
function aimOf(object: Object3D | null): Aim {
  for (let o = object; o; o = o.parent) {
    if (o.name.startsWith('interact_laptop')) return 'laptop'
    if (o.name.startsWith('interact_phone')) return 'phone'
  }
  return null
}

/**
 * 책상 위 휴대폰의 크기(m). room.glb의 interact_phone은 이 크기의 납작한 상자 하나라서, 화면에는 이 모델을 대신 그린다.
 * 상자는 책상 위에서 세로축 기준 17도쯤 돌아가 있다(angle, 라디안).
 */
const DESK_PHONE = { width: 0.075, length: 0.15, height: 0.0095, corner: 0.0095, angle: 0.3 }

/** 모서리가 둥근 네모 모양. 가운데가 원점이다. */
function roundedRect(width: number, height: number, radius: number) {
  const x = width / 2
  const y = height / 2
  const shape = new Shape()
  shape.moveTo(-x + radius, -y)
  shape.lineTo(x - radius, -y)
  shape.quadraticCurveTo(x, -y, x, -y + radius)
  shape.lineTo(x, y - radius)
  shape.quadraticCurveTo(x, y, x - radius, y)
  shape.lineTo(-x + radius, y)
  shape.quadraticCurveTo(-x, y, -x, y - radius)
  shape.lineTo(-x, -y + radius)
  shape.quadraticCurveTo(-x, -y, -x + radius, -y)
  return shape
}

/** 꺼진 휴대폰 화면 그림: 검은 유리에 비스듬한 반사광과 앞면 카메라 구멍 */
function phoneGlass() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 512
  const g = canvas.getContext('2d')!
  g.fillStyle = '#08090c'
  g.fillRect(0, 0, 256, 512)
  const shine = g.createLinearGradient(0, 0, 256, 512)
  shine.addColorStop(0.3, 'rgb(255 255 255 / 0)')
  shine.addColorStop(0.42, 'rgb(190 205 230 / 0.13)')
  shine.addColorStop(0.5, 'rgb(255 255 255 / 0)')
  g.fillStyle = shine
  g.fillRect(0, 0, 256, 512)
  g.fillStyle = '#1c1f26'
  g.beginPath()
  g.arc(128, 26, 9, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#000'
  g.beginPath()
  g.arc(128, 26, 6, 0, Math.PI * 2)
  g.fill()
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/** 책상 위에 화면을 위로 두고 놓인 휴대폰. 바닥 가운데가 원점이다. */
function deskPhone() {
  const { width, length, height, corner, angle } = DESK_PHONE
  const bevel = 0.0012
  const body = new ExtrudeGeometry(roundedRect(width, length, corner), {
    depth: height - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 8,
  })
  // 두께 방향을 위(y)로 세우고 바닥을 책상에 붙인다
  body.rotateX(-Math.PI / 2)
  body.translate(0, bevel, 0)

  // 앞뒷면은 검은 유리, 옆면은 금속 테두리
  const phone = new Group()
  phone.add(
    new ThreeMesh(body, [
      new MeshBasicMaterial({ color: '#111216' }),
      new MeshBasicMaterial({ color: '#6c7079' }),
    ]),
  )

  // 테두리 안쪽에 화면을 얹는다. 모양 좌표를 그림 좌표(0~1)로 바꿔 화면 그림이 꽉 차게 한다.
  const inset = 0.0028
  const screen = new ShapeGeometry(
    roundedRect(width - inset * 2, length - inset * 2, corner - inset),
    8,
  )
  const position = screen.attributes.position
  const uv = screen.attributes.uv
  for (let i = 0; i < position.count; i++) {
    uv.setXY(
      i,
      position.getX(i) / (width - inset * 2) + 0.5,
      position.getY(i) / (length - inset * 2) + 0.5,
    )
  }
  screen.rotateX(-Math.PI / 2)
  const glass = new ThreeMesh(screen, new MeshBasicMaterial({ map: phoneGlass() }))
  glass.position.y = height + 0.0002
  phone.add(glass)

  phone.rotation.y = angle
  return phone
}

/**
 * Blender에서 만든 원룸(room.glb)에 미리 구운 조명(room_lightmap.png)을 입혀서 보여 준다.
 * 원본은 assets-src/room/room.blend, 출처는 assets-src/CREDITS.md에 있다.
 */
function Room() {
  // Draco로 압축한 파일이라 해제기가 필요하다. drei 기본값(구글 CDN의 해제기)을 그대로 쓴다.
  const { scene } = useGLTF(ROOM_URL)
  const loaded = useTexture(LIGHTMAP_URL)

  const room = useMemo(() => {
    const lightmap = loaded.clone()
    lightmap.flipY = false // glTF의 UV 방향에 맞춘다
    lightmap.colorSpace = SRGBColorSpace
    lightmap.channel = 1 // 두 번째 UV(Lightmap)
    lightmap.needsUpdate = true

    const copy = scene.clone()
    copy.traverse((child) => {
      // col_*는 충돌 판정용 상자라 화면에는 그리지 않는다
      if (child.name.startsWith('col_')) child.visible = false
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      const baked = mesh.material as MeshStandardMaterial
      if (baked.emissive.getHex() !== 0) {
        // 스스로 빛나는 면(노트북 화면, 베란다 유리)
        mesh.material = new MeshBasicMaterial({ color: baked.emissive })
      } else if (mesh.geometry.attributes.uv1) {
        // 두 번째 UV가 있는 메시만 조명을 구웠다. 구운 값은 "색 x 빛" 그대로라 계산 없는 재질에 입힌다.
        mesh.material = new MeshBasicMaterial({
          map: baked.map,
          color: baked.color,
          lightMap: lightmap,
          transparent: baked.transparent,
          opacity: baked.opacity,
        })
      }
    })

    // 납작한 상자인 휴대폰은 감춘다. 그 자리에는 DeskPhone이 휴대폰 모델을 그린다.
    const slab = copy.getObjectByName('interact_phone')
    if (slab) slab.visible = false
    return copy
  }, [scene, loaded])

  return <primitive object={room} />
}

/**
 * 책상 위에 놓인 휴대폰. room.glb의 interact_phone 상자 자리에 휴대폰 모델을 놓는다.
 * 가리키기 판정은 원본 장면(Body)의 상자로 한다.
 */
function DeskPhone() {
  const { scene } = useGLTF(ROOM_URL)
  const phone = useMemo(() => {
    const model = deskPhone()
    const slab = scene.getObjectByName('interact_phone')
    if (slab) model.position.copy(slab.position)
    return model
  }, [scene])

  return <primitive object={phone} />
}

// 매 프레임 새로 만들지 않고 돌려 쓰는 계산용 값
const forward = new Vector3()
const sideways = new Vector3()
const step = new Vector3()
const CENTER = new Vector2(0, 0)

interface BodyProps {
  seated: boolean
  walking: boolean
  /** 휴대폰이 아직 책상 위에 있는지. 집은 뒤에는 가리킬 수 없다. */
  phoneOnDesk: boolean
  /** 화면 가운데 점이 가리키는 물건이 바뀔 때 알린다 */
  onAim: (aim: Aim) => void
  /** 가리키던 물건을 클릭했을 때 알린다 */
  onPick: (scene: Scene) => void
}

/**
 * 1인칭으로 걷는 몸. W A S D(또는 방향키)로 걷고, 벽과 가구(col_* 상자)는 지나가지 못한다.
 * 화면 가운데 점이 가리키는 물건을 클릭하면 그 물건의 장면으로 넘어간다.
 */
function Body({ seated, walking, phoneOnDesk, onAim, onPick }: BodyProps) {
  const { scene } = useGLTF(ROOM_URL)
  const camera = useThree((state) => state.camera)
  const keys = useRef(new Set<string>())
  const standing = useRef<{ position: Vector3; quaternion: Quaternion } | null>(null)
  const aimed = useRef<Aim>(null)
  // 손이 닿는 거리까지만 가리킬 수 있다
  const reach = useMemo(() => {
    const raycaster = new Raycaster()
    raycaster.far = REACH
    return raycaster
  }, [])

  // 커서가 잠긴 상태에서 누른 클릭만 물건을 누른 것으로 친다. 첫 클릭은 커서를 잠그는 데 쓰인다.
  useEffect(() => {
    const click = () => {
      if (document.pointerLockElement && aimed.current) onPick(aimed.current)
    }
    document.addEventListener('click', click)
    return () => document.removeEventListener('click', click)
  }, [onPick])

  // 몸높이에 걸리는 충돌 상자만 모은다(바닥과 천장은 뺀다)
  const blockers = useMemo(() => {
    const list: Box3[] = []
    scene.updateWorldMatrix(true, true)
    scene.traverse((child) => {
      if (!child.name.startsWith('col_')) return
      const box = new Box3().setFromObject(child)
      if (box.min.y < EYE && box.max.y > 0.1) list.push(box)
    })
    return list
  }, [scene])

  // 시작할 때 현관 안쪽에 서서 방 안쪽을 본다
  useEffect(() => {
    camera.position.set(...START.position)
    camera.lookAt(...START.target)
  }, [camera])

  // 앉으면 의자 자리로 바로 옮기고, 일어나면 앉기 전에 서 있던 자리로 돌아온다
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

  useEffect(() => {
    const pressed = keys.current
    const down = (e: KeyboardEvent) => pressed.add(e.code)
    const up = (e: KeyboardEvent) => pressed.delete(e.code)
    const clear = () => pressed.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])

  useFrame(({ camera }, delta) => {
    if (!walking) {
      aimed.current = null
      return
    }
    // 화면 가운데가 가리키는 맨 앞 물체를 찾는다. 보이지 않는 충돌 상자와 이미 집은 휴대폰은 건너뛴다.
    reach.setFromCamera(CENTER, camera)
    const front = reach
      .intersectObject(scene, true)
      .find(
        (hit) =>
          !hit.object.name.startsWith('col_') && (phoneOnDesk || aimOf(hit.object) !== 'phone'),
      )
    const aim = aimOf(front?.object ?? null)
    if (aim !== aimed.current) {
      aimed.current = aim
      onAim(aim)
    }

    const pressed = keys.current
    const ahead =
      Number(pressed.has('KeyW') || pressed.has('ArrowUp')) -
      Number(pressed.has('KeyS') || pressed.has('ArrowDown'))
    const right =
      Number(pressed.has('KeyD') || pressed.has('ArrowRight')) -
      Number(pressed.has('KeyA') || pressed.has('ArrowLeft'))
    if (!ahead && !right) return

    // 바라보는 방향에서 위아래 기울기를 빼고 걷는다
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    sideways.crossVectors(forward, camera.up)
    step
      .set(0, 0, 0)
      .addScaledVector(forward, ahead)
      .addScaledVector(sideways, right)
      .normalize()
      // 화면이 잠깐 멈췄다 풀릴 때 벽을 뚫고 지나가지 않게 한 번에 가는 거리를 제한한다
      .multiplyScalar(Math.min(delta, 0.05) * SPEED)

    const free = (x: number, z: number) =>
      !blockers.some(
        (box) =>
          x > box.min.x - BODY &&
          x < box.max.x + BODY &&
          z > box.min.z - BODY &&
          z < box.max.z + BODY,
      )
    // 가로와 세로를 따로 따져서, 벽에 비스듬히 닿으면 벽을 타고 미끄러진다
    const position = camera.position
    if (free(position.x + step.x, position.z)) position.x += step.x
    if (free(position.x, position.z + step.z)) position.z += step.z
  })

  // 화면을 클릭하면 커서가 잠기고 마우스 움직임으로 둘러본다. 다른 장면에서는 끈다.
  return <PointerLockControls enabled={walking} selector={`#${VIEW_ID}`} />
}

const panel: CSSProperties = {
  margin: 0,
  padding: '8px 12px',
  border: 0,
  borderRadius: 8,
  background: 'rgb(0 0 0 / 0.6)',
  color: '#fff',
  font: 'inherit',
}

/** 화면 가운데 점. 누를 수 있는 물건을 가리키면 커지고 무엇을 하는지 알려 준다. */
function Crosshair({ aim }: { aim: Aim }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        display: 'grid',
        justifyItems: 'center',
        gap: 8,
        transform: 'translate(-50%, -7px)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: aim ? 14 : 6,
          height: aim ? 14 : 6,
          margin: aim ? 0 : 4,
          borderRadius: '50%',
          border: '2px solid rgb(0 0 0 / 0.6)',
          background: '#fff',
        }}
      />
      {aim && (
        <span style={panel}>
          {aim === 'laptop' ? '클릭해서 노트북 쓰기' : '클릭해서 휴대폰 집기'}
        </span>
      )}
    </div>
  )
}

/** 휴대폰을 두 손으로 쥔 장면. 화면 자리는 네모로만 두고, 실제 화면은 나중에 이 자리에 얹는다. */
function PhoneInHand() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgb(0 0 0 / 0.45)',
        backdropFilter: 'blur(6px)',
        overflow: 'hidden',
      }}
    >
      {/* 손이 화면 아래에서 올라온 것처럼 보이게 아래에 붙이고, 잘린 소매 끝은 화면 밖으로 내린다 */}
      <div
        style={{
          position: 'relative',
          flexShrink: 0,
          height: '100vh',
          aspectRatio: '1239 / 1269',
          transform: `translateY(${HAND_SINK * 100}%)`,
        }}
      >
        <img
          src={HAND_URL}
          alt="두 손으로 세로로 쥔 휴대폰"
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${PHONE_SCREEN.left * 100}%`,
            top: `${PHONE_SCREEN.top * 100}%`,
            width: `${PHONE_SCREEN.width * 100}%`,
            height: `${PHONE_SCREEN.height * 100}%`,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '8.8% / 4.1%',
            background: '#e9edf2',
            color: '#30343a',
          }}
        >
          휴대폰 화면
        </div>
      </div>
    </div>
  )
}

/**
 * 협성의 테스트 페이지. 개발 서버에서 `?sandbox=hyeopseong` 주소로 연다.
 * 주인이 자유롭게 고친다. 이 페이지만 따로 불러오므로 three·R3F·src/game을 import해도 된다.
 *
 * 방을 1인칭으로 걸어 다닌다. 노트북을 누르면 의자에 앉아 화면을 가득 채워 보는 시점으로 바뀐다.
 * 책상 위 휴대폰을 누르면 휴대폰을 집어 손에 쥔 장면으로 바뀌고, 책상에서는 사라진다.
 * 그 뒤로는 오른쪽 아래 휴대폰 버튼이나 Q로 꺼내고, 내려놓기 버튼이나 Esc로 닫는다.
 */
export default function SandboxPage() {
  const [scene, setScene] = useState<Scene>('room')
  const [aim, setAim] = useState<Aim>(null)
  const [hasPhone, setHasPhone] = useState(false)

  // 다른 장면으로 넘어가면 버튼을 누를 수 있게 잠근 커서를 돌려준다. 휴대폰을 한 번 열면 집은 것으로 친다.
  const open = (next: Scene) => {
    if (next !== 'room') document.exitPointerLock()
    if (next === 'phone') setHasPhone(true)
    setAim(null)
    setScene(next)
  }

  // 방에서는 휴대폰 꺼내기 키로 휴대폰을 열고, 휴대폰을 보는 중에는 Esc로 닫는다
  useEffect(() => {
    const press = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (scene === 'room' && hasPhone && e.code === PHONE_KEY.code) {
        document.exitPointerLock()
        setAim(null)
        setScene('phone')
      } else if (scene === 'phone' && e.code === 'Escape') {
        setScene('room')
      }
    }
    window.addEventListener('keydown', press)
    return () => window.removeEventListener('keydown', press)
  }, [scene, hasPhone])

  return (
    <main style={{ position: 'fixed', inset: 0, background: '#b9c2c9' }}>
      <div id={VIEW_ID} style={{ position: 'absolute', inset: 0 }}>
        {/* flat: 구운 조명 색이 톤 매핑으로 바뀌지 않게 한다 */}
        <Canvas flat camera={{ position: START.position, fov: 70, near: 0.05 }}>
          <color attach="background" args={['#b9c2c9']} />
          {/* 조명을 굽지 않은 물건(휴대폰, 우편물, 공유기 플러그)을 비추는 약한 빛 */}
          <ambientLight intensity={1.2} />
          <Suspense fallback={null}>
            <Room />
            {!hasPhone && <DeskPhone />}
            <Body
              seated={scene === 'laptop'}
              walking={scene === 'room'}
              phoneOnDesk={!hasPhone}
              onAim={setAim}
              onPick={open}
            />
          </Suspense>
        </Canvas>
      </div>

      {scene === 'phone' && <PhoneInHand />}

      {scene === 'room' ? (
        <>
          <Crosshair aim={aim} />
          <p style={{ ...panel, position: 'absolute', left: 16, bottom: 16 }}>
            화면을 클릭하면 마우스로 둘러보고 W A S D로 걸어요. Esc를 누르면 커서가 나와요.
            <br />
            {hasPhone
              ? `가운데 점을 노트북에 맞추고 클릭해 보세요. ${PHONE_KEY.label}를 누르면 휴대폰을 꺼내요.`
              : '가운데 점을 노트북이나 휴대폰에 맞추고 클릭해 보세요.'}
          </p>
          {hasPhone && (
            <button
              type="button"
              style={{ ...panel, position: 'absolute', right: 16, bottom: 16, cursor: 'pointer' }}
              onClick={() => open('phone')}
            >
              휴대폰 ({PHONE_KEY.label})
            </button>
          )}
        </>
      ) : (
        <button
          type="button"
          style={{ ...panel, position: 'absolute', left: 16, top: 16, cursor: 'pointer' }}
          onClick={() => open('room')}
        >
          {scene === 'laptop' ? '일어나기' : '휴대폰 내려놓기'}
        </button>
      )}
    </main>
  )
}
