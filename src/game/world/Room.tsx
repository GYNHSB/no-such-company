import { useGLTF, useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import { MeshBasicMaterial, SRGBColorSpace, type Mesh, type MeshStandardMaterial } from 'three'
import { LIGHTMAP_URL, ROOM_URL } from './assets'

interface RoomProps {
  /** 그리지 않을 물체 이름. 다른 모델로 바꿔 그리는 자리 표시용 물체를 감출 때 쓴다. 배열은 컴포넌트 밖에 두고 같은 것을 넘긴다. */
  hide?: readonly string[]
}

/**
 * Blender에서 만든 원룸(room.glb)에 미리 구운 조명(room_lightmap.png)을 입혀서 보여 준다.
 * 구운 색이 톤 매핑으로 바뀌지 않게 Canvas에 flat을 준다.
 */
export function Room({ hide }: RoomProps) {
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

    for (const name of hide ?? []) {
      const object = copy.getObjectByName(name)
      if (object) object.visible = false
    }
    return copy
  }, [scene, loaded, hide])

  return <primitive object={room} />
}
