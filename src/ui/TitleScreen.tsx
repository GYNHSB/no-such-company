import { useGameStore } from '@/stores/gameStore'
import styles from './TitleScreen.module.css'

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
    </main>
  )
}
