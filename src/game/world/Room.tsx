import { useGLTF, useTexture } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import {
  Color,
  MeshBasicMaterial,
  SRGBColorSpace,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
} from 'three'
import { LIGHTMAP_URL, ROOM_URL } from './assets'

/**
 * 구운 색에 곱하는 색. 구운 조명은 낮에 전등을 끈 상태라, 그 위에 밤과 천장등을 흉내 낸다.
 * shortcut: 색을 곱할 뿐이라 전등을 켜도 그림자는 바뀌지 않는다. 진짜처럼 하려면 Blender에서 전등별 빛을 따로 굽는다.
 */
const ROOM_TINT = {
  day: new Color(1, 1, 1),
  dayLit: new Color(1.12, 1.08, 1),
  night: new Color(0.2, 0.22, 0.32),
  nightLit: new Color(0.8, 0.76, 0.68),
}
/** 바깥 빛이 비치는 유리는 밤에 더 어둡게(짙은 남색) 한다 */
const NIGHT_OUTSIDE = new Color(0.05, 0.06, 0.11)
const NO_TINT = new Color(1, 1, 1)
/** 꺼진 스탠드 전구는 빛나지 않는 회색으로 */
const LAMP_OFF = new Color(0.35, 0.35, 0.35)
/** 켠 천장등 덮개는 하얗게 빛나 보이게 밝힌다(flat이라 1을 넘으면 흰색이 된다) */
const CEILING_ON = new Color(1.8, 1.75, 1.6)

/** object가 이름이 name인 물체 안에 있는지 */
function inside(object: Object3D, name: string) {
  for (let o: Object3D | null = object; o; o = o.parent) {
    if (o.name === name) return true
  }
  return false
}

/** 재질의 종류. 밤과 전등에 따라 다르게 밝힌다. */
type Part = 'screen' | 'outside' | 'deskLamp' | 'ceilingLamp' | 'room'

function partOf(mesh: Mesh, emissive: boolean): Part {
  if (inside(mesh, 'interact_laptop')) return emissive ? 'screen' : 'room'
  if (inside(mesh, 'desk_lamp')) return emissive ? 'deskLamp' : 'room'
  if (inside(mesh, 'ceiling_lamp')) return 'ceilingLamp'
  return emissive ? 'outside' : 'room'
}

interface RoomProps {
  /** 그리지 않을 물체 이름. 다른 모델로 바꿔 그리는 자리 표시용 물체를 감출 때 쓴다. 배열은 컴포넌트 밖에 두고 같은 것을 넘긴다. */
  hide?: readonly string[]
  /** 밤이면 방을 어둡게 한다. 노트북 화면은 그대로 밝다. */
  night?: boolean
  /** 천장등이 켜져 있으면 방 전체를 밝힌다 */
  ceilingLight?: boolean
  /** 스탠드가 켜져 있으면 전구가 빛난다 */
  deskLamp?: boolean
}

/**
 * Blender에서 만든 원룸(room.glb)에 미리 구운 조명(room_lightmap.png)을 입혀서 보여 준다.
 * 구운 색이 톤 매핑으로 바뀌지 않게 Canvas에 flat을 준다.
 */
export function Room({ hide, night = false, ceilingLight = false, deskLamp = false }: RoomProps) {
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
      const emissive = baked.emissive.getHex() !== 0
      if (emissive) {
        // 스스로 빛나는 면(노트북 화면, 베란다 유리, 스탠드 전구)
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
      ;(mesh.material as MeshBasicMaterial).userData.part = partOf(mesh, emissive)
    })

    for (const name of hide ?? []) {
      const object = copy.getObjectByName(name)
      if (object) object.visible = false
    }
    return copy
  }, [scene, loaded, hide])

  // 구운 조명은 바꿀 수 없어서 색을 곱해 밝기를 바꾼다. 처음 색은 재질에 적어 두고 매번 거기서 다시 곱한다.
  useEffect(() => {
    const roomTint = night
      ? ceilingLight
        ? ROOM_TINT.nightLit
        : ROOM_TINT.night
      : ceilingLight
        ? ROOM_TINT.dayLit
        : ROOM_TINT.day
    const tints: Record<Part, Color> = {
      screen: NO_TINT,
      outside: night ? NIGHT_OUTSIDE : NO_TINT,
      deskLamp: deskLamp ? NO_TINT : LAMP_OFF,
      ceilingLamp: ceilingLight ? CEILING_ON : roomTint,
      room: roomTint,
    }
    room.traverse((child) => {
      const material = (child as Mesh).material as MeshBasicMaterial | undefined
      if (!material?.isMeshBasicMaterial) return
      material.userData.dayColor ??= material.color.clone()
      material.color
        .copy(material.userData.dayColor)
        .multiply(tints[material.userData.part as Part])
      // 켠 천장등은 구운 빛(옆면은 어둡다)을 떼고 제 색만 써서 어느 쪽에서 봐도 하얗게 빛나게 한다
      if (material.userData.part === 'ceilingLamp') {
        material.userData.lightMap ??= material.lightMap
        const lightMap = ceilingLight ? null : material.userData.lightMap
        if (material.lightMap !== lightMap) {
          material.lightMap = lightMap
          material.needsUpdate = true
        }
      }
    })
  }, [room, night, ceilingLight, deskLamp])

  return <primitive object={room} />
}
