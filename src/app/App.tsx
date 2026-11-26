import { lazy, Suspense } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { TitleScreen } from '@/ui/TitleScreen'

// three, R3F, Rapier(WASM)는 용량이 커서 첫 화면 번들과 분리해 월드에 들어갈 때 불러온다.
const GameCanvas = lazy(() => import('@/game/GameCanvas'))

// 팀원별 테스트 페이지(src/sandbox/). 개발 서버에서만 `?sandbox`로 열고, 배포 빌드에서는 이 코드가 빠진다.
const SandboxScreen =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('sandbox')
    ? lazy(() => import('@/sandbox/SandboxScreen'))
    : null

export function App() {
  const screen = useGameStore((s) => s.screen)

  if (SandboxScreen) {
    return (
      <Suspense fallback={<p className="loading">불러오는 중…</p>}>
        <SandboxScreen />
      </Suspense>
    )
  }

  if (screen === 'title') return <TitleScreen />

  return (
    <Suspense fallback={<p className="loading">불러오는 중…</p>}>
      <GameCanvas />
    </Suspense>
  )
}
