import { useEffect, useRef, useState } from 'react'
import styles from './VideoPlayer.module.css'

/** 임시 화면의 사람이 눈을 깜빡이는 간격(초). 대본: "하나, 둘, 셋, 넷, 다섯. 깜빡." */
const BLINK_EVERY = 5
/** 눈을 감고 있는 시간(초) */
const BLINK_FOR = 0.2

/** 자막 한 줄. at은 영상 시작부터 이 줄이 나오는 시각(초) */
export interface Caption {
  at: number
  text: string
}

interface Props {
  /** 영상 파일 주소. 없으면 임시 화면을 같은 길이만큼 재생한다 */
  src?: string
  /** 영상이 없을 때의 길이(초). 영상이 있으면 영상의 길이를 쓴다 */
  duration: number
  /** 영상에 나오는 사람. 임시 화면과 화면 낭독기에 쓴다 */
  label: string
  /** 자막. 영상에 자막이 박혀 있으면 넘기지 않는다 */
  captions?: readonly Caption[]
  /** 재생을 시작했을 때 */
  onPlay?: () => void
  /** 끝까지 봤을 때 */
  onEnded?: () => void
}

const clock = (sec: number) => {
  const whole = Math.floor(sec)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

/**
 * 휴대폰에서 영상을 보는 화면. 화면을 누르면 재생하고 멈추고, 아래 줄을 끌어 원하는 곳으로 간다.
 * 영상 파일이 아직 없으면 임시 화면이 같은 길이만큼 흐른다. 임시 화면의 사람은 일정한 간격으로 눈을 깜빡인다.
 */
export function VideoPlayer({ src, duration, label, captions = [], onPlay, onEnded }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [sec, setSec] = useState(0)
  const [length, setLength] = useState(duration)
  const ended = sec >= length
  // 타이머 안에서 최신 값을 읽으려고 따로 들고 있다
  const secRef = useRef(0)
  const onEndedRef = useRef(onEnded)
  useEffect(() => {
    onEndedRef.current = onEnded
  })

  const moveTo = (to: number) => {
    secRef.current = to
    setSec(to)
  }

  // 영상이 없으면 타이머로 시간을 흘린다. 끝까지 가면 멈추고 알린다
  useEffect(() => {
    if (src || !playing) return
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      const next = Math.min(length, secRef.current + (now - last) / 1000)
      last = now
      moveTo(next)
      if (next >= length) {
        setPlaying(false)
        onEndedRef.current?.()
      }
    }, 100)
    return () => clearInterval(id)
  }, [src, playing, length])

  const seek = (to: number) => {
    moveTo(to)
    if (video.current) video.current.currentTime = to
  }

  const toggle = () => {
    if (playing) {
      setPlaying(false)
      video.current?.pause()
      return
    }
    // 끝까지 본 뒤에 다시 누르면 처음부터 본다
    if (ended) seek(0)
    setPlaying(true)
    onPlay?.()
    void video.current?.play()
  }

  let caption: Caption | undefined
  for (const line of captions) {
    if (line.at <= sec) caption = line
  }
  const eyesClosed = sec > 1 && sec % BLINK_EVERY < BLINK_FOR

  return (
    <div className={styles.player}>
      <button
        type="button"
        className={styles.stage}
        onClick={toggle}
        aria-label={playing ? '멈춤' : '재생'}
      >
        <span className={styles.frame}>
          {src ? (
            <video
              ref={video}
              className={styles.video}
              src={src}
              playsInline
              onLoadedMetadata={(e) => setLength(e.currentTarget.duration)}
              onTimeUpdate={(e) => moveTo(e.currentTarget.currentTime)}
              onPause={() => setPlaying(false)}
              onEnded={() => {
                setPlaying(false)
                onEnded?.()
              }}
            />
          ) : (
            <span className={styles.temp} role="img" aria-label={`${label} 영상 자리`}>
              <span className={`${styles.face} ${eyesClosed ? styles.blink : ''}`}>
                <i />
                <i />
              </span>
              <span className={styles.name}>{label}</span>
            </span>
          )}
          {caption && <span className={styles.caption}>{caption.text}</span>}
        </span>
        {!playing && (
          <span className={styles.play} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
        )}
      </button>
      <div className={styles.bar}>
        <span className={styles.clock}>{clock(sec)}</span>
        <input
          className={styles.scrub}
          type="range"
          min={0}
          max={length}
          step={0.1}
          value={sec}
          onChange={(e) => seek(Number(e.currentTarget.value))}
          aria-label="재생 위치"
          aria-valuetext={`${clock(sec)} / ${clock(length)}`}
        />
        <span className={styles.clock}>{clock(length)}</span>
      </div>
    </div>
  )
}
