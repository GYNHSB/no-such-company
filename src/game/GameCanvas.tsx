import { KeyboardControls, PerformanceMonitor, StatsGl } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Joystick, VirtualButton } from 'ecctrl/input'
import { Suspense, useState } from 'react'
import { JUMP_BUTTON_ID, keyboardMap } from '@/game/input/controls'
import { Player } from '@/game/player/Player'
import { World } from '@/game/world/World'

// 해상도 배율 상한. 고해상도 폰에서 3배 이상으로 렌더링하지 않도록 2로 제한한다.
const MAX_DPR = Math.min(2, window.devicePixelRatio)

/** 3D 월드. App에서 lazy import되므로 default export를 쓴다. */
export default function GameCanvas() {
  // 기기 성능에 따라 해상도 배율을 자동으로 조절한다.
  const [dpr, setDpr] = useState(Math.min(1.5, MAX_DPR))

  return (
    <>
      <div className="game-canvas">
        <Canvas dpr={dpr} camera={{ position: [0, 3, 6], fov: 60 }}>
          <PerformanceMonitor onIncline={() => setDpr(MAX_DPR)} onDecline={() => setDpr(1)} />
          <color attach="background" args={['#0b0d12']} />
          <KeyboardControls map={keyboardMap}>
            {/* Rapier는 WASM을 비동기로 불러오므로 Suspense로 감싼다 */}
            <Suspense fallback={null}>
              <Physics>
                <World />
                <Player />
              </Physics>
            </Suspense>
          </KeyboardControls>
          {/* 개발 모드에서만 FPS·CPU·GPU 표시 (프로덕션 번들에서는 제거됨) */}
          {import.meta.env.DEV && <StatsGl className="dev-stats" />}
        </Canvas>
      </div>

      {/* 터치 기기에서만 보이는 가상 조이스틱과 점프 버튼 */}
      <div className="touch-only">
        <Joystick
          joystickWrapperStyle={{
            left: 'calc(16px + env(safe-area-inset-left))',
            bottom: 'calc(16px + env(safe-area-inset-bottom))',
          }}
        />
        <VirtualButton
          id={JUMP_BUTTON_ID}
          label="점프"
          buttonWrapperStyle={{
            position: 'fixed',
            right: 'calc(32px + env(safe-area-inset-right))',
            bottom: 'calc(48px + env(safe-area-inset-bottom))',
          }}
        />
      </div>
    </>
  )
}
