import {
  AdditiveBlending,
  CanvasTexture,
  DoubleSide,
  MeshBasicMaterial,
  SpriteMaterial,
  SRGBColorSpace,
} from 'three'

let texture: CanvasTexture | null = null

/** 가운데가 밝고 가장자리로 갈수록 사라지는 둥근 빛 그림. 여러 빛이 같이 쓴다. */
function glowTexture() {
  if (!texture) {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const g = canvas.getContext('2d')!
    const fade = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    fade.addColorStop(0, 'rgb(255 255 255 / 1)')
    fade.addColorStop(0.35, 'rgb(255 255 255 / 0.35)')
    fade.addColorStop(1, 'rgb(255 255 255 / 0)')
    g.fillStyle = fade
    g.fillRect(0, 0, 128, 128)
    texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
  }
  return texture
}

/** 어두운 방에서 화면이 내는 빛처럼 보이는 재질. 겹치면 더 밝아지고 물건을 가리지 않는다. */
export function glowMaterial(color: string, opacity: number) {
  return new SpriteMaterial({
    map: glowTexture(),
    color,
    opacity,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  })
}

/** 바닥이나 책상 위에 눕혀 까는 둥근 빛 웅덩이 재질 */
export function glowPlaneMaterial(color: string, opacity: number) {
  return new MeshBasicMaterial({
    map: glowTexture(),
    color,
    opacity,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
  })
}
