import { useEffect, useRef, useState } from 'react'
import { VideoCall } from './VideoCall'
import { fillName, INTERVIEW_LINES, lineAt, type TimedLine } from './videoScript'

interface Props {
  /** 플레이어가 입력한 이름. 자막의 {name}을 바꾼다 */
  playerName: string
  /** 면접관 영상. 없으면 정지 화면과 타이머로 진행한다 */
  videoSrc?: string
  /** 자막. 기본값은 대본 v1-2의 면접관 대사 */
  lines?: readonly TimedLine[]
  /** 영상이 없을 때 면접 길이(초) */
  durationSec?: number
  /** 면접이 끝났을 때 한 번 부른다. 다음 장면으로 넘긴다 */
  onEnd: () => void
}

/** 1일차 장면 5. 보안 화상면접 앱의 면접 화면 (약 30초) */
export function VideoInterview({
  playerName,
  videoSrc,
  lines = INTERVIEW_LINES,
  durationSec = 30,
  onEnd,
}: Props) {
  const [sec, setSec] = useState(0)
  const [ended, setEnded] = useState(false)
  const onEndRef = useRef(onEnd)
  useEffect(() => {
    onEndRef.current = onEnd
  })

  // 영상이 없으면 타이머로 시간을 흘린다
  useEffect(() => {
    if (videoSrc || ended) return
    const start = performance.now()
    const timer = setInterval(() => {
      const now = (performance.now() - start) / 1000
      setSec(now)
      if (now >= durationSec) setEnded(true)
    }, 250)
    return () => clearInterval(timer)
  }, [videoSrc, ended, durationSec])

  useEffect(() => {
    if (ended) onEndRef.current()
  }, [ended])

  const line = lineAt(lines, sec)

  return (
    <VideoCall
      title="보안 화상면접 · 모레온 1차 면접"
      remoteName="김아영 · 모레온"
      videoSrc={videoSrc}
      onVideoTime={setSec}
      onVideoEnded={() => setEnded(true)}
      recording
      caption={line && fillName(line.text, playerName)}
    />
  )
}
