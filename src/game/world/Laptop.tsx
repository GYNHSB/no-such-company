import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import { MeshBasicMaterial, type Mesh, type MeshStandardMaterial } from 'three'
import { LAPTOP_AT } from './anchors'
import { LAPTOP_URL } from './assets'

/**
 * 책상 위 노트북(laptop.glb). room.glb의 옛 노트북은 Room의 hide로 감추고 같은 자리에 그린다.
 * 누르는 판정은 InteractionRay가 room.glb 원본으로 하므로 여기서는 그리기만 한다.
 * 조명을 굽지 않은 모델이라 몸체는 장면의 빛을 받고, 화면만 room.glb처럼 스스로 빛나게 한다.
 */
export function Laptop() {
  const { scene } = useGLTF(LAPTOP_URL)
  const laptop = useMemo(() => {
    const copy = scene.clone()
    copy.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      const material = mesh.material as MeshStandardMaterial
      if (material.emissive.getHex() !== 0) {
        mesh.material = new MeshBasicMaterial({ color: material.emissive })
      }
    })
    return copy
  }, [scene])

  return <primitive object={laptop} position={LAPTOP_AT} />
}
