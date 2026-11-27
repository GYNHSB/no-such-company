import { useState } from 'react'
import { PhoneNav } from '@/ui/kit/phone/PhoneNav'
import { PhoneScreen } from '@/ui/kit/phone/PhoneScreen'
import { formatDate, formatDayTime, formatMonthDay } from './clock'
import styles from './PhotosApp.module.css'
import { type Caption, VideoPlayer } from './VideoPlayer'

/** 사진 앱에 들어 있는 영상 하나 */
export interface PhotoVideo {
  id: string
  /** 영상에 나오는 사람이나 내용. 임시 화면과 화면 낭독기에 쓴다 */
  label: string
  /** 영상 파일 주소. 없으면 임시 화면으로 재생한다 */
  src?: string
  /** 목록에 보이는 작은 그림. 없으면 임시 그림을 그린다 */
  poster?: string
  /** 길이(초). 영상 파일이 없을 때 이만큼 재생한다 */
  duration: number
  /** 찍은 날과 시각 */
  date: Date
  time?: string
  /** 자막. 영상에 자막이 박혀 있으면 넘기지 않는다 */
  captions?: readonly Caption[]
}

interface Props {
  /** 지금 시각 "20:14". 상태 표시줄에 쓴다 */
  time: string
  /** 오늘 날짜. 영상을 찍은 날이 오늘인지 가린다 */
  today: Date
  /** 찍은 순서대로 넘긴다 */
  videos: PhotoVideo[]
  /** 영상을 재생하기 시작했을 때 */
  onPlay?: (id: string) => void
  /** 영상을 끝까지 봤을 때. 본 것으로 무엇을 할지는 받는 쪽이 정한다 */
  onEnded?: (id: string) => void
  /** 왼쪽 위 "홈"이나 아래 막대를 눌렀을 때. 홈 화면으로 돌아간다 */
  onHome?: () => void
}

const clock = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`

/**
 * 휴대폰 사진 앱. 목록에서 영상을 누르면 크게 열려 재생된다.
 * 아이폰 사진 앱의 구조(목록 → 크게 보기)를 따르고, 실제 앱의 이름과 아이콘은 쓰지 않는다.
 */
export function PhotosApp({ time, today, videos, onPlay, onEnded, onHome }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const open = videos.find((v) => v.id === openId)

  if (open) {
    return (
      <PhoneScreen time={time} onHome={onHome}>
        <div className={styles.viewer}>
          <PhoneNav backAriaLabel="사진 목록으로" onBack={() => setOpenId(null)}>
            <span className={styles.when}>
              {open.time ? formatDayTime(today, open.date, open.time) : formatDate(open.date)}
            </span>
          </PhoneNav>
          <VideoPlayer
            key={open.id}
            src={open.src}
            duration={open.duration}
            label={open.label}
            captions={open.captions}
            onPlay={onPlay && (() => onPlay(open.id))}
            onEnded={onEnded && (() => onEnded(open.id))}
          />
        </div>
      </PhoneScreen>
    )
  }

  return (
    <PhoneScreen time={time} onHome={onHome}>
      <div className={styles.library}>
        <PhoneNav title="사진" backLabel={onHome && '홈'} onBack={onHome} />
        {videos.length === 0 ? (
          <p className={styles.empty}>사진 또는 비디오 없음</p>
        ) : (
          <ul className={styles.grid}>
            {videos.map((video) => (
              <li key={video.id}>
                <button
                  type="button"
                  className={styles.tile}
                  onClick={() => setOpenId(video.id)}
                  aria-label={`${video.label} 비디오, ${clock(video.duration)}`}
                >
                  {video.poster ? (
                    <img className={styles.poster} src={video.poster} alt="" />
                  ) : (
                    <span className={styles.tempPoster} aria-hidden="true">
                      <span>
                        <i />
                        <i />
                      </span>
                    </span>
                  )}
                  <span className={styles.date} aria-hidden="true">
                    {formatMonthDay(video.date)}
                  </span>
                  <span className={styles.length} aria-hidden="true">
                    {clock(video.duration)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {videos.length > 0 && <p className={styles.count}>비디오 {videos.length}개</p>}
      </div>
    </PhoneScreen>
  )
}
