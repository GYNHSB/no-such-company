import type { ComponentType } from 'react'

/**
 * 미니게임 공통 계약.
 * 각 미니게임은 이 타입만 맞추면 월드에 붙일 수 있다. 팀원 간 인터페이스 합의는 이 파일로 한다.
 */

/** 미니게임이 끝났을 때 월드로 돌려주는 결과 */
export interface MiniGameResult {
  cleared: boolean
  score?: number
}

export interface MiniGameProps {
  onExit: (result: MiniGameResult) => void
}

/**
 * 미니게임 하나 = lazy import 단위 하나.
 * 미니게임이 열려 있는 동안 3D 월드는 렌더링을 멈춘다(frameloop="never").
 * WebGL을 쓰는 미니게임(PixiJS, 3D)이면 3D 월드를 언마운트한다. 렌더링 정지만으로는 WebGL 컨텍스트가 해제되지 않는다.
 */
export interface MiniGameModule {
  id: string
  dimension: '2d' | '3d'
  load: () => Promise<{ default: ComponentType<MiniGameProps> }>
}
