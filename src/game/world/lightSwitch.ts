import { BoxGeometry, Mesh, MeshBasicMaterial } from 'three'
import { LIGHT_SWITCH } from './anchors'

/**
 * 전등 스위치를 누르는 판정용 상자. 스위치 판은 room.glb의 entry 안에 그려져 있어서, 그 자리에 보이지 않는 상자를 둔다.
 * 화면(GameCanvas)과 가리키기 판정(InteractionRay)이 같은 물체를 써야 해서 하나만 만들어 둔다.
 */
export const LIGHT_SWITCH_BOX = new Mesh(
  new BoxGeometry(...LIGHT_SWITCH.size),
  new MeshBasicMaterial({ visible: false }),
)
LIGHT_SWITCH_BOX.name = 'light_switch'
LIGHT_SWITCH_BOX.position.set(...LIGHT_SWITCH.center)
