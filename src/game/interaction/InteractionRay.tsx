import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Box3, Ray, Raycaster, Vector2, Vector3, type Object3D } from 'three'
import { ROOM_URL } from '@/game/world/assets'
import { PICK_KEY } from '@/game/input/controls'

/** 물건을 고를 수 있는 거리(m). 눈에서 물건의 겉까지 잰다. 한두 걸음 앞까지 다가가야 고를 수 있다 */
const REACH = 1.5
/**
 * 커서에서 이 각도(라디안, 약 6도) 안에 있는 물건을 고른다. 커서를 정확히 올리지 않아도 근처면 잡힌다.
 * 화면 너비 1280px에서 70px쯤이다.
 */
const CONE = 0.1
/** 이보다 적게 움직였으면 끈 것이 아니라 누른 것으로 본다(px) */
const TAP_SLOP = 6

// 매 프레임 새로 만들지 않도록 재사용한다
const eye = new Vector3()
const look = new Vector3()
const toward = new Vector3()
const center = new Vector3()
const spot = new Vector3()
const gaze = new Ray()
const reach = new Raycaster()

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

/** 커서가 없을 때(터치 기기, 커서가 창 밖에 있을 때) 대신 쓰는 화면 가운데 */
const CENTER = new Vector2(0, 0)

interface InteractionRayProps {
  /** false면 아무것도 가리키지 않는다(노트북이나 휴대폰을 보는 동안). */
  enabled: boolean
  /** 방에서 사라진 물건의 이름. 가리킬 수 없고 뒤의 물건을 가리지도 않는다. 배열은 컴포넌트 밖에 두고 같은 것을 넘긴다. */
  ignore?: readonly string[]
  /** 이름이 interact_*가 아니어도 누를 수 있는 물건. 배열은 컴포넌트 밖에 두고 같은 것을 넘긴다. */
  named?: readonly string[]
  /**
   * 지금 고르면 할 일이 있는 물건. 주면 여기 없는 물건은 고르지 않는다(뒤의 물건은 그대로 가린다).
   * 배열은 컴포넌트 밖에 두고 같은 것을 넘긴다.
   */
  usable?: readonly string[]
  /** room.glb 밖에서 코드로 만든 누를 수 있는 물체(화면에 올린 것). 배열은 컴포넌트 밖에 두고 같은 것을 넘긴다. */
  extra?: readonly Object3D[]
  /** 고를 수 있는 물건이 바뀔 때 알린다. 값은 interact_* 이름이고, 없으면 null이다. */
  onAim: (id: string | null) => void
  /** 물건을 골랐을 때 알린다 */
  onPick: (id: string) => void
}

/**
 * 지금 고를 수 있는 물건을 찾는다. 포인터는 마우스 커서 하나다(커서는 잠그지 않는다).
 * - 손이 닿는 거리(REACH) 안에 있고 커서 근처(CONE)에 있는 물건을 고른다. 커서에 가장 가까운 물건이다.
 * - 클릭(터치는 누르기)이나 고르기 키(E)로 누른다.
 * - 고를 수 있는 물건이 있으면 화면에 data-hover를 달아 커서 모양을 바꾼다.
 * - 커서가 없으면(터치 기기, 커서가 창 밖에 있을 때) 화면 가운데를 커서로 친다.
 * 판정은 화면에 그린 방이 아니라 원본 장면으로 하므로, 다른 모델로 바꿔 그린 물건도 원래 자리에서 가리킨다.
 */
export function InteractionRay({
  enabled,
  ignore,
  named,
  usable,
  extra,
  onAim,
  onPick,
}: InteractionRayProps) {
  const { scene } = useGLTF(ROOM_URL)
  const camera = useThree((state) => state.camera)
  const canvas = useThree((state) => state.gl.domElement)
  const targets = useMemo(() => [scene, ...(extra ?? [])], [scene, extra])
  const aimed = useRef<string | null>(null)
  /** 커서가 있는 자리(화면 가운데가 (0, 0), 끝이 ±1)와, 커서가 창 안에 있는지 */
  const cursor = useRef(new Vector2())
  const present = useRef(false)
  /** 누를 수 있는 물건마다의 자리(겉을 감싼 상자). 처음 찾을 때 한 번 만든다 */
  const boxes = useRef<Map<string, Box3> | null>(null)

  /** 원본 장면은 화면에 그리지 않아서 위치 계산이 저절로 되지 않는다. 한 번 해 두고 물건마다 상자를 만든다 */
  const boxesOf = useCallback(() => {
    if (boxes.current) return boxes.current
    const map = new Map<string, Box3>()
    for (const target of targets) {
      target.updateWorldMatrix(true, true)
      target.traverse((object) => {
        const id = interactIdOf(object, named)
        if (!id || object.children.length > 0) return
        const box = map.get(id) ?? new Box3()
        map.set(id, box.expandByObject(object))
      })
    }
    boxes.current = map
    return map
  }, [targets, named])

  /** 눈에서 그 방향으로 맨 앞에 있는 것. 보이지 않는 충돌 상자와 사라진 물건은 건너뛴다 */
  const frontOf = useCallback(
    (far: number): { id: string | null; distance: number } | null => {
      reach.far = far
      const front = reach.intersectObjects(targets, true).find((hit) => {
        if (hit.object.name.startsWith('col_')) return false
        const hitId = interactIdOf(hit.object, named)
        return !hitId || !ignore?.includes(hitId)
      })
      return front ? { id: interactIdOf(front.object, named), distance: front.distance } : null
    },
    [targets, named, ignore],
  )

  /**
   * 그 자리(화면 가운데가 (0, 0), 끝이 ±1)를 가리킬 때 고를 물건. 손이 닿고 그 자리 근처에 있는 물건 가운데
   * 가장 가까운 것이다. 벽이나 다른 물건에 가려져 있으면 고르지 않는다.
   */
  const findBy = useCallback(
    (at: Vector2): string | null => {
      reach.setFromCamera(at, camera)
      eye.copy(reach.ray.origin)
      look.copy(reach.ray.direction)
      gaze.set(eye, look)
      const near: { id: string; angle: number; distance: number }[] = []
      for (const [id, box] of boxesOf()) {
        if (ignore?.includes(id) || (usable && !usable.includes(id))) continue
        if (box.distanceToPoint(eye) > REACH) continue
        // 가리키는 선이 물건에 바로 닿으면 그 물건이 먼저다(각도 0).
        // 닿지 않으면 선에서 가장 가까운 물건의 자리까지 얼마나 벗어났는지로 잰다.
        const hit = gaze.intersectBox(box, spot)
        const distance = (hit ?? box.getCenter(center)).distanceTo(eye)
        if (!hit) box.clampPoint(spot.copy(eye).addScaledVector(look, distance), spot)
        const angle = hit ? 0 : toward.copy(spot).sub(eye).angleTo(look)
        if (angle <= CONE) near.push({ id, angle, distance })
      }
      // 가리키는 선에 가까운 것부터, 같으면 가까이 있는 것부터
      near.sort((a, b) => a.angle - b.angle || a.distance - b.distance)
      for (const { id } of near) {
        const box = boxesOf().get(id)
        if (!box) continue
        toward.copy(box.getCenter(center)).sub(eye)
        const distance = toward.length()
        reach.set(eye, toward.normalize())
        // 물건의 가운데까지 다른 것이 막고 있지 않으면 보이는 것으로 친다.
        // 열린 노트북처럼 가운데가 빈 물건은 선이 물건에 닿지 않고 지나가기도 한다.
        const front = frontOf(distance)
        if (!front || front.id === id) return id
      }
      return null
    },
    [camera, boxesOf, frontOf, ignore, usable],
  )

  // 고르기 키: 지금 안내에 떠 있는 물건을 고른다
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === PICK_KEY.code && !e.repeat && aimed.current) onPick(aimed.current)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onPick])

  // 커서가 있는 자리를 기억한다. 화면 위 단추에 올라가 있어도 따라간다
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const rect = canvas.getBoundingClientRect()
      cursor.current.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      )
      present.current = true
    }
    const leave = () => {
      present.current = false
    }
    window.addEventListener('pointermove', move)
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [canvas])

  // 클릭(터치는 누르기): 끌지 않고 눌렀으면 그 자리가 가리키는 물건을 고른다
  useEffect(() => {
    if (!enabled) return
    let downX = 0
    let downY = 0
    const down = (e: PointerEvent) => {
      downX = e.clientX
      downY = e.clientY
    }
    const up = (e: PointerEvent) => {
      if (e.button !== 0 || Math.hypot(e.clientX - downX, e.clientY - downY) > TAP_SLOP) return
      const rect = canvas.getBoundingClientRect()
      const id = findBy(
        new Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        ),
      )
      if (id) onPick(id)
    }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointerup', up)
    return () => {
      canvas.removeAttribute('data-hover')
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointerup', up)
    }
  }, [enabled, canvas, findBy, onPick])

  useFrame(() => {
    const id = enabled ? findBy(present.current ? cursor.current : CENTER) : null
    canvas.toggleAttribute('data-hover', id !== null)
    if (id !== aimed.current) {
      aimed.current = id
      onAim(id)
    }
  })

  return null
}
