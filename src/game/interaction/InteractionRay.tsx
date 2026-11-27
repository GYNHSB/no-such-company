import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Raycaster, Vector2, type Object3D } from 'three'
import { ROOM_URL } from '@/game/world/assets'

/** 물건을 가리킬 수 있는 거리(m) */
const REACH = 3
/** 화면 가운데 */
const CENTER = new Vector2(0, 0)

/**
 * 물체가 속한 누를 수 있는 물건의 이름(room.glb의 interact_*, 또는 named에 있는 이름)을 알아낸다.
 * 재질이 여러 개인 물건은 interact_laptop 아래 interact_laptop_1처럼 나뉘므로 가장 위의 이름을 쓴다.
 */
function interactIdOf(object: Object3D | null, named?: readonly string[]): string | null {
  let id: string | null = null
  for (let o = object; o; o = o.parent) {
    if (o.name.startsWith('interact_') || named?.includes(o.name)) id = o.name
  }
  return id
}

interface InteractionRayProps {
  /** false면 아무것도 가리키지 않는다(노트북이나 휴대폰을 보는 동안). */
  enabled: boolean
  /** 방에서 사라진 물건의 이름. 가리킬 수 없고 뒤의 물건을 가리지도 않는다. 배열은 컴포넌트 밖에 두고 같은 것을 넘긴다. */
  ignore?: readonly string[]
  /** 이름이 interact_*가 아니어도 누를 수 있는 물건. 배열은 컴포넌트 밖에 두고 같은 것을 넘긴다. */
  named?: readonly string[]
  /** room.glb 밖에서 코드로 만든 누를 수 있는 물체(화면에 올린 것). 배열은 컴포넌트 밖에 두고 같은 것을 넘긴다. */
  extra?: readonly Object3D[]
  /** 화면 가운데 점이 가리키는 물건이 바뀔 때 알린다. 값은 interact_* 이름이고, 없으면 null이다. */
  onAim: (id: string | null) => void
  /** 가리키던 물건을 클릭했을 때 알린다 */
  onPick: (id: string) => void
}

/**
 * 화면 가운데 점이 가리키는 누를 수 있는 물건을 찾는다. 손이 닿는 거리(REACH)까지만 본다.
 * 판정은 화면에 그린 방이 아니라 원본 장면으로 하므로, 다른 모델로 바꿔 그린 물건도 원래 자리에서 가리킨다.
 */
export function InteractionRay({
  enabled,
  ignore,
  named,
  extra,
  onAim,
  onPick,
}: InteractionRayProps) {
  const { scene } = useGLTF(ROOM_URL)
  const targets = useMemo(() => [scene, ...(extra ?? [])], [scene, extra])
  const aimed = useRef<string | null>(null)
  const reach = useMemo(() => {
    const raycaster = new Raycaster()
    raycaster.far = REACH
    return raycaster
  }, [])

  // 원본 장면은 화면에 그리지 않아서 위치 계산이 저절로 되지 않는다. 한 번 해 둔다.
  useEffect(() => scene.updateWorldMatrix(true, true), [scene])

  // 커서가 잠긴 상태에서 누른 클릭만 물건을 누른 것으로 친다. 첫 클릭은 커서를 잠그는 데 쓰인다.
  useEffect(() => {
    const click = () => {
      if (document.pointerLockElement && aimed.current) onPick(aimed.current)
    }
    document.addEventListener('click', click)
    return () => document.removeEventListener('click', click)
  }, [onPick])

  useFrame(({ camera }) => {
    let id: string | null = null
    if (enabled) {
      // 맨 앞 물체를 찾는다. 보이지 않는 충돌 상자와 사라진 물건은 건너뛴다.
      reach.setFromCamera(CENTER, camera)
      const front = reach.intersectObjects(targets, true).find((hit) => {
        if (hit.object.name.startsWith('col_')) return false
        const hitId = interactIdOf(hit.object, named)
        return !hitId || !ignore?.includes(hitId)
      })
      id = interactIdOf(front?.object ?? null, named)
    }
    if (id !== aimed.current) {
      aimed.current = id
      onAim(id)
    }
  })

  return null
}
