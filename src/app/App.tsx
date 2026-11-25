import { lazy, Suspense } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { TitleScreen } from '@/ui/TitleScreen'

// three, R3F, Rapier(WASM)는 용량이 커서 첫 화면 번들과 분리해 월드에 들어갈 때 불러온다.
const GameCanvas = lazy(() => import('@/game/GameCanvas'))

export function App() {
  const screen = useGameStore((s) => s.screen)

  if (screen === 'title') return <TitleScreen />

  return (
    <Suspense fallback={<p className="loading">불러오는 중…</p>}>
      <GameCanvas />
    </Suspense>
  )
}
