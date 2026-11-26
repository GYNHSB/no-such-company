import { lazy, Suspense } from 'react'
import { useGameStore } from '@/stores/gameStore'
import styles from './TitleScreen.module.css'

// 개발 서버에서만 팀원별 테스트 페이지(src/sandbox/)로 가는 버튼을 보여 준다. 배포 빌드에서는 이 코드가 빠진다.
const SandboxLinks = import.meta.env.DEV ? lazy(() => import('@/sandbox/SandboxLinks')) : null

/**
 * 첫 화면. 사용자의 탭/클릭으로 게임에 진입한다.
 * 모바일 브라우저는 사용자 입력이 있어야 오디오 재생을 허용하므로, 사운드를 붙일 때 이 시점에 잠금을 해제한다.
 */
export function TitleScreen() {
  const start = useGameStore((s) => s.start)

  return (
    <main className={styles.root}>
      <h1 className={styles.title}>no-such-company</h1>
      <button type="button" className={styles.start} onClick={start}>
        시작하기
      </button>
      {SandboxLinks && (
        <Suspense fallback={null}>
          <SandboxLinks label="테스트 페이지 (개발 서버 전용)" />
        </Suspense>
      )}
    </main>
  )
}
