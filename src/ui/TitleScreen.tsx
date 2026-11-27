import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import styles from './TitleScreen.module.css'

// 개발 서버에서만 팀원별 테스트 페이지(src/sandbox/)로 가는 버튼을 보여 준다. 배포 빌드에서는 이 코드가 빠진다.
const SandboxLinks = import.meta.env.DEV ? lazy(() => import('@/sandbox/SandboxLinks')) : null

/** 펜이 "sign"을 쓰고 제목이 나오는 영상(1920 x 1080, 18초) */
const INTRO_VIDEO = `${import.meta.env.BASE_URL}videos/title_sign_night.mp4`
/**
 * 영상의 부제가 나오기 직전 이 초에서 영상을 멈추고 시작 화면 그림으로 바꾼다.
 * 영상의 부제 글꼴 대신 그림 속 손글씨 부제를 쓰려고 그렇게 한다(13.1초부터 부제가 나온다).
 */
const INTRO_CUT_SEC = 12.95
/** 시작 화면 그림. 왼쪽에 제목 "sign"과 손글씨 부제, 오른쪽에 서명하는 손. 글씨가 그림 안에 들어 있다. */
const TITLE_IMAGE = `${import.meta.env.BASE_URL}images/title_sign_night.webp`

/** 이름 칸에 넣을 수 있는 최대 글자 수 */
const NAME_MAX = 12

const prefersStill = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * 첫 화면. 영상이 제목까지 쓰고 나면 시작 화면 그림으로 바뀌고, 왼쪽 검은 자리에 이름 칸과 시작하기가 나온다.
 * 영상은 클릭이나 아무 키로 건너뛸 수 있다. 움직임 줄이기 설정이거나 영상을 못 틀면 그림부터 보여 준다.
 * 문구는 대본 v1-2의 "시작 화면"을 그대로 쓴다. 이름은 기본값이 없고 비어 있으면 시작할 수 없다.
 * 입력한 이름은 gameStore에만 두고 어디에도 보내지 않는다.
 */
export function TitleScreen() {
  const start = useGameStore((s) => s.start)
  const [intro, setIntro] = useState(() => !prefersStill())
  const [name, setName] = useState('')
  const video = useRef<HTMLVideoElement>(null)
  const ready = name.trim() !== ''

  useEffect(() => {
    if (!intro) return
    const end = () => {
      video.current?.pause()
      setIntro(false)
    }
    // 부제가 나오기 직전에서 끊는다. timeupdate는 띄엄띄엄 와서 매 화면마다 시간을 본다.
    let frame = requestAnimationFrame(function watch() {
      const v = video.current
      if (v && v.currentTime >= INTRO_CUT_SEC) return end()
      frame = requestAnimationFrame(watch)
    })
    // 클릭이나 아무 키로 건너뛴다
    window.addEventListener('keydown', end)
    window.addEventListener('pointerdown', end)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', end)
      window.removeEventListener('pointerdown', end)
    }
  }, [intro])

  return (
    <main className={styles.root}>
      <div className={styles.stage}>
        {!prefersStill() && (
          <video
            ref={video}
            className={styles.media}
            src={INTRO_VIDEO}
            autoPlay
            muted
            playsInline
            onError={() => setIntro(false)}
          />
        )}
        {/* 영상 위로 천천히 떠올라, 손글씨 부제와 서명하는 손이 나타난다 */}
        {!intro && <img className={`${styles.media} ${styles.still}`} src={TITLE_IMAGE} alt="" />}

        {/* 제목은 그림 안에 그려져 있어서, 화면 낭독기용 제목만 따로 둔다 */}
        <h1 className={styles.srOnly}>sign : 사인해 주세요</h1>

        {!intro && (
          <div className={styles.menu}>
            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault()
                if (ready) start(name)
              }}
            >
              <label htmlFor="player-name" className={styles.label}>
                이름을 입력해 주세요.
              </label>
              <input
                id="player-name"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={NAME_MAX}
                autoComplete="off"
                spellCheck={false}
                aria-describedby="player-name-note"
              />
              <p id="player-name-note" className={styles.note}>
                이 이름은 게임 속 메일, 우편, 문자에 그대로 쓰여요.
                <br />
                브라우저 밖으로는 나가지 않아요.
              </p>
              <button type="submit" className={styles.start} disabled={!ready}>
                시작하기
              </button>
            </form>
            <ul className={styles.controls} aria-label="조작 안내">
              <li>화면을 클릭하면 마우스로 둘러볼 수 있어요.</li>
              <li>
                <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>로 걸어요.
              </li>
              <li>가운데 점을 물건에 맞추고 클릭하면 살펴볼 수 있어요.</li>
            </ul>
          </div>
        )}
      </div>

      {intro && (
        <p className={styles.skip} aria-hidden="true">
          클릭하면 건너뛰어요
        </p>
      )}

      {SandboxLinks && !intro && (
        <div className={styles.dev}>
          <Suspense fallback={null}>
            <SandboxLinks label="테스트 페이지 (개발 서버 전용)" />
          </Suspense>
        </div>
      )}
    </main>
  )
}
