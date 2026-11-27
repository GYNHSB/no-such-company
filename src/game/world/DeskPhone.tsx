import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  CanvasTexture,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Shape,
  ShapeGeometry,
  Sprite,
  SRGBColorSpace,
} from 'three'
import { BUZZ_PULSES } from '@/game/audio/sound'
import { useGameStore } from '@/stores/gameStore'
import { ROOM_URL } from './assets'
import { glowMaterial } from './glow'

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

/** 알림이 와서 켜진 화면 그림: 시각과 알림 한 줄 */
function phoneLit() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 512
  const g = canvas.getContext('2d')!
  const sky = g.createLinearGradient(0, 0, 0, 512)
  sky.addColorStop(0, '#1b2238')
  sky.addColorStop(1, '#0b0d14')
  g.fillStyle = sky
  g.fillRect(0, 0, 256, 512)
  g.fillStyle = 'rgb(255 255 255 / 0.9)'
  g.font = '600 64px system-ui, sans-serif'
  g.textAlign = 'center'
  g.fillText('10:12', 128, 140)
  // 알림 한 줄: 흐린 상자 안에 글자 대신 막대 두 개
  g.fillStyle = 'rgb(255 255 255 / 0.2)'
  g.beginPath()
  g.roundRect(20, 220, 216, 70, 16)
  g.fill()
  g.fillStyle = 'rgb(255 255 255 / 0.75)'
  g.fillRect(38, 240, 110, 10)
  g.fillStyle = 'rgb(255 255 255 / 0.45)'
  g.fillRect(38, 262, 160, 8)
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
    new Mesh(body, [
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
  const off = phoneGlass()
  const glass = new Mesh(screen, new MeshBasicMaterial({ map: off }))
  glass.name = 'screen'
  glass.position.y = height + 0.0002
  phone.add(glass)

  // 밤에 화면이 켜지면 책상 위로 번지는 빛
  const glow = new Sprite(glowMaterial('#a9bdff', 0.5))
  glow.name = 'glow'
  glow.position.y = 0.02
  glow.scale.set(0.35, 0.35, 1)
  glow.visible = false
  phone.add(glow)

  phone.rotation.y = angle
  return { phone, off }
}

/** 알림이 오면 화면이 켜져 있는 시간(초) */
const LIT_SECONDS = 4
/** 진동할 때 떨리는 폭(m, 라디안) */
const SHAKE = 0.0012
const SHAKE_TURN = 0.012

/**
 * 책상 위에 놓인 휴대폰. room.glb의 interact_phone 상자 자리에 휴대폰 모델을 놓는다.
 * 가리키기 판정은 원본 장면의 상자로 한다. Room에는 hide로 상자를 감추라고 알린다.
 * 알림이 오면 진동 박자에 맞춰 떨리고, 화면이 잠깐 켜진다.
 */
export function DeskPhone() {
  const { scene } = useGLTF(ROOM_URL)
  const parts = useMemo(() => {
    const model = deskPhone()
    const slab = scene.getObjectByName('interact_phone')
    if (slab) model.phone.position.copy(slab.position)
    return {
      phone: model.phone,
      rest: model.phone.position.clone(),
      off: model.off,
      on: phoneLit(),
    }
  }, [scene])

  // 화면에 올린 물체는 ref로 받아 바꾼다(훅이 돌려준 값은 직접 바꾸지 않는다)
  const phone = useRef<Group>(null)

  useFrame(() => {
    const model = phone.current
    if (!model) return
    const { buzzAt, night } = useGameStore.getState()
    const since = (performance.now() - buzzAt) / 1000
    const shaking =
      buzzAt > 0 && BUZZ_PULSES.some(([start, length]) => since >= start && since < start + length)
    const lit = buzzAt > 0 && since < LIT_SECONDS
    const jitter = () => (shaking ? Math.random() * 2 - 1 : 0)
    model.position.set(
      parts.rest.x + jitter() * SHAKE,
      parts.rest.y,
      parts.rest.z + jitter() * SHAKE,
    )
    model.rotation.y = DESK_PHONE.angle + jitter() * SHAKE_TURN
    const screen = model.getObjectByName('screen') as Mesh<ShapeGeometry, MeshBasicMaterial>
    screen.material.map = lit ? parts.on : parts.off
    model.getObjectByName('glow')!.visible = lit && night
  })

  return <primitive ref={phone} object={parts.phone} />
}
