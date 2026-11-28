import { useState } from 'react'
import type { DayScript, GameEvent } from '@/data/types'
import type { StoryState } from '@/engine/story'
import { effectText, triggerText } from './describe'
import styles from './StoryInspector.module.css'

/** 사건 하나의 진행 상태. done: 이미 실행됨, next: 지금 일어날 수 있음, later: 아직 차례가 아님 */
type Status = 'done' | 'next' | 'later'

const STATUS_LABELS: Record<Status, string> = {
  done: '실행됨',
  next: '지금 가능',
  later: '아직',
}

/** 지금 그 사건이 어디까지 왔는지. 지금 날의 사건에만 쓴다 */
function statusOf(event: GameEvent, story: StoryState): Status {
  if (story.fired.includes(event.id)) return 'done'
  const t = event.trigger
  // 앞선 사건이 일어나야 하는 것은 그 사건이 일어난 뒤에만 가능하다
  if (t.type === 'interact') return !t.after || story.fired.includes(t.after) ? 'next' : 'later'
  if (t.type === 'afterEvent') return story.fired.includes(t.eventId) ? 'next' : 'later'
  if (t.type === 'dayStart') return 'later'
  return 'next'
}

interface Props {
  story: StoryState
  /** 진행할 날의 대본 전부 */
  days: readonly DayScript[]
  /** 지금 날 */
  today: number
}

/**
 * 대본에 적힌 사건을 순서대로 보여 준다. 사건마다 무엇이 일어나면 실행되는지, 실행되면 무슨 일이 생기는지,
 * 지금 어디까지 왔는지가 보인다. 테스트할 때 그날에 무슨 사건이 예정돼 있는지 한눈에 보려는 것이다.
 * 날을 골라 다른 날의 대본도 볼 수 있다. 진행 상태는 지금 날에만 표시한다.
 */
export function ScriptTimeline({ story, days, today }: Props) {
  const [picked, setPicked] = useState<number | null>(null)
  const day = picked ?? today
  const script = days.find((d) => d.info.day === day) ?? days[0]
  const isToday = script.info.day === today
  const cards = days.flatMap((d) => d.evidence)
  const done = script.events.filter((event) => story.fired.includes(event.id)).length

  return (
    <div className={styles.timeline}>
      <div className={styles.days} role="group" aria-label="볼 날 고르기">
        {days.map((d) => (
          <button
            key={d.info.day}
            type="button"
            aria-pressed={d.info.day === script.info.day}
            onClick={() => setPicked(d.info.day === today ? null : d.info.day)}
          >
            {d.info.day}일차{d.info.day === today ? ' (지금)' : ''}
          </button>
        ))}
      </div>
      <p className={styles.about}>
        {script.info.day}일차 · 입사 {script.info.week}주 차 {script.info.weekday}요일 ·{' '}
        {script.info.title} · 사건 {script.events.length}개
        {isToday ? ` 가운데 ${done}개 실행됨` : ''}. 대본에 적힌 순서대로예요.
      </p>
      {!isToday && (
        <p className={styles.about}>지금 진행 중인 날이 아니라서 진행 상태는 표시하지 않아요.</p>
      )}
      <ol className={styles.events}>
        {script.events.map((event, index) => {
          const status = isToday ? statusOf(event, story) : null
          return (
            <li key={event.id} className={styles.event} data-status={status ?? undefined}>
              <div className={styles.eventHead}>
                <span className={styles.order}>{index + 1}</span>
                <code>{event.id}</code>
                {status && <span className={styles.status}>{STATUS_LABELS[status]}</span>}
              </div>
              <p className={styles.when}>
                <strong>언제</strong> {triggerText(event.trigger)}
              </p>
              <ul className={styles.effects}>
                {event.effects.map((effect, i) => (
                  // 순서가 바뀌지 않는 목록이라 자리 번호를 key로 쓴다
                  <li key={i}>{effectText(effect, cards)}</li>
                ))}
              </ul>
              {event.note && <p className={styles.note}>메모: {event.note}</p>}
            </li>
          )
        })}
      </ol>
      {script.sentences.length > 0 && (
        <>
          <p className={styles.about}>이 날의 빈칸 문장 {script.sentences.length}개</p>
          <ul className={styles.effects}>
            {script.sentences.map((sentence) => (
              <li key={sentence.id}>
                <code>{sentence.id}</code> {sentence.text} → 정답 {sentence.answers.join(', ')}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
