import { KeyboardControls, PerformanceMonitor, StatsGl } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Suspense, useEffect, useState } from 'react'
import { RoomSounds } from '@/game/audio/RoomSounds'
import { keyboardMap } from '@/game/input/controls'
import { useViewKeys } from '@/game/input/useViewKeys'
import { InteractionRay } from '@/game/interaction/InteractionRay'
import { LaptopView } from '@/game/player/LaptopView'
import { Player } from '@/game/player/Player'
import { START } from '@/game/world/anchors'
import { DeskPhone } from '@/game/world/DeskPhone'
import { Details } from '@/game/world/Details'
import { LIGHT_SWITCH_BOX } from '@/game/world/lightSwitch'
import { Room } from '@/game/world/Room'
import { RoomColliders } from '@/game/world/RoomColliders'
import { useGameStore, type View } from '@/stores/gameStore'

// 해상도 배율 상한. 고해상도 화면에서 3배 이상으로 렌더링하지 않도록 2로 제한한다.
const MAX_DPR = Math.min(2, window.devicePixelRatio)

/** 클릭하면 커서를 잠그는 영역. 화면 위에 겹친 버튼을 누를 때는 잠기지 않게 3D 화면으로만 한정한다. */
const LOCK_SELECTOR = '.game-canvas'

/** 누르면 보는 것이 바뀌는 물건(room.glb의 interact_* 이름) */
const VIEWS: Record<string, View> = {
  interact_laptop: 'laptop',
  interact_phone: 'phone',
  bed: 'bed',
}

/** 누르면 켜고 끄는 물건 */
const SWITCHES: Record<string, () => void> = {
  desk_lamp: () => useGameStore.getState().toggleDeskLamp(),
  light_switch: () => useGameStore.getState().toggleCeilingLight(),
}

/** 책상 위 휴대폰 자리의 납작한 상자. 화면에는 DeskPhone이 대신 그리고, 집은 뒤에는 가리킬 수도 없다. */
const PHONE_SLAB = ['interact_phone']
/** 이름이 interact_*가 아니지만 누를 수 있는 물건. room.glb에서 interact_*로 이름을 바꾸면 여기서 지운다. */
const NAMED = ['bed', 'desk_lamp', 'light_switch']
/** room.glb 밖에서 코드로 만든 누를 수 있는 물체 */
const EXTRA = [LIGHT_SWITCH_BOX]

function pick(id: string) {
  const view = VIEWS[id]
  if (view) useGameStore.getState().openView(view)
  SWITCHES[id]?.()
}

/** Suspense 안에 두면 그 안의 방과 그림을 다 불러온 뒤에 한 번 알린다 */
function Loaded({ onLoad }: { onLoad: () => void }) {
  useEffect(onLoad, [onLoad])
  return null
}

interface GameCanvasProps {
  /** 방을 다 불러와 화면에 보일 때 알린다 */
  onLoad?: () => void
}

/**
 * 원룸 3D 화면. 1인칭으로 걸어 다니고, 노트북을 누르면 의자에 앉아 화면을 가득 채워 보고,
 * 책상 위 휴대폰을 누르면 집고, 침대를 누르면 눕는다. 스탠드와 현관 옆 스위치를 누르면 불을 켜고 끈다.
 * 무엇을 보고 있는지는 gameStore의 view에 있다.
 * App에서 lazy import되므로 default export를 쓴다.
 */
export default function GameCanvas({ onLoad }: GameCanvasProps) {
  // 기기 성능에 따라 해상도 배율을 자동으로 조절한다.
  const [dpr, setDpr] = useState(Math.min(1.5, MAX_DPR))
  const view = useGameStore((s) => s.view)
  const hasPhone = useGameStore((s) => s.hasPhone)
  const aimAt = useGameStore((s) => s.aimAt)
  const night = useGameStore((s) => s.night)
  const ceilingLight = useGameStore((s) => s.ceilingLight)
  const deskLamp = useGameStore((s) => s.deskLamp)
  useViewKeys()

  return (
    <div className="game-canvas">
      {/* flat: 구운 조명 색이 톤 매핑으로 바뀌지 않게 한다 */}
      <Canvas flat dpr={dpr} camera={{ position: START.position, fov: 70, near: 0.05 }}>
        <PerformanceMonitor onIncline={() => setDpr(MAX_DPR)} onDecline={() => setDpr(1)} />
        <color attach="background" args={[night ? '#0d1018' : '#b9c2c9']} />
        {/* 조명을 굽지 않은 물건(휴대폰, 우편물, 공유기 플러그)을 비추는 약한 빛. 천장등을 켜면 밝아진다. */}
        <ambientLight intensity={(night ? 0.3 : 1.2) + (ceilingLight ? (night ? 0.7 : 0.2) : 0)} />
        <KeyboardControls map={keyboardMap}>
          {/* 방 모델과 Rapier(WASM)를 비동기로 불러오므로 Suspense로 감싼다 */}
          <Suspense fallback={null}>
            <Physics>
              <Room
                hide={PHONE_SLAB}
                night={night}
                ceilingLight={ceilingLight}
                deskLamp={deskLamp}
              />
              <RoomColliders />
              {!hasPhone && <DeskPhone />}
              <Details />
              <primitive object={LIGHT_SWITCH_BOX} />
              <Player
                active={view === 'room'}
                lying={view === 'bed'}
                lockSelector={LOCK_SELECTOR}
              />
              <LaptopView seated={view === 'laptop'} />
              <InteractionRay
                enabled={view === 'room'}
                ignore={hasPhone ? PHONE_SLAB : undefined}
                named={NAMED}
                extra={EXTRA}
                onAim={aimAt}
                onPick={pick}
              />
              <RoomSounds />
              {onLoad && <Loaded onLoad={onLoad} />}
            </Physics>
          </Suspense>
        </KeyboardControls>
        {/* 개발 모드에서만 FPS·CPU·GPU 표시 (프로덕션 번들에서는 제거됨) */}
        {import.meta.env.DEV && <StatsGl className="dev-stats" />}
      </Canvas>
    </div>
  )
}
