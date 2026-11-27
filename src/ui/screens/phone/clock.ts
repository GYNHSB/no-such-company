import { useEffect, useRef, useState } from 'react'

const DAY_MINUTES = 24 * 60

/** "11:27"에 분을 더한 시각. 자정을 넘기면 "00:00"부터 다시 센다 */
export function addMinutes(clock: string, minutes: number): string {
  const [hour = 0, minute = 0] = clock.split(':').map(Number)
  const total = (((hour * 60 + minute + minutes) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

const monthDay = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' })
const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' })

/** "11월 27일" */
export const formatMonthDay = (date: Date) => monthDay.format(date)

/** "11월 27일 (금)" */
export const formatDate = (date: Date) => `${monthDay.format(date)} (${weekday.format(date)})`

const DAY_MS = 24 * 60 * 60 * 1000
const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

/** date가 today에서 며칠 전인지. 같은 날이면 0, 어제면 1. 시각은 보지 않는다 */
export function daysAgo(today: Date, date: Date): number {
  return Math.round((startOfDay(today) - startOfDay(date)) / DAY_MS)
}

/**
 * 휴대폰 시계가 흐르게 한다. start("11:27")에서 시작해 실제로 1분이 지날 때마다 1분씩 올라간다.
 * start가 바뀌면(새 알림이 도착해 대본의 시각으로 맞출 때) 그 시각에서 다시 흐른다.
 * speed는 빠르기 배수다. 60이면 실제 1초에 1분씩 흐른다(테스트용).
 */
export function useFlowingClock(start: string, speed = 1): string {
  const [tick, setTick] = useState({ start, minutes: 0 })
  const speedRef = useRef(speed)

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    let flowed = 0 // 흐른 시계 시간(ms). 빠르기가 바뀌어도 이어서 쌓인다
    let last = Date.now()
    const id = setInterval(() => {
      const now = Date.now()
      flowed += (now - last) * speedRef.current
      last = now
      const minutes = Math.floor(flowed / 60_000)
      setTick((prev) =>
        prev.start === start && prev.minutes === minutes ? prev : { start, minutes },
      )
    }, 250)
    return () => clearInterval(id)
  }, [start])

  // start가 막 바뀐 첫 렌더에서는 이전 start의 분이 남아 있으므로 0으로 본다
  return addMinutes(start, tick.start === start ? tick.minutes : 0)
}
