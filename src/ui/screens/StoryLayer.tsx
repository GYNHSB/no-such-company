import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useMonologueStore } from '@/stores/monologueStore'
import { useStoryStore } from '@/stores/storyStore'
import { ChoiceMenu } from './common/ChoiceMenu'
import { DateCard } from './common/DateCard'
import { DayBadge } from './common/DayBadge'
import { GuideBanner } from './common/GuideBanner'
import { HeartRate } from './common/HeartRate'
import { Monologue } from './common/Monologue'
import { PhoneView } from './phone/PhoneView'
import styles from './StoryLayer.module.css'

/**
 * 본편 3D 방 위에 겹치는 화면 전부. 휴대폰 클로즈업, 왼쪽 위 날짜, 안내, 혼잣말, 선택지, 날짜 카드.
 * 무엇을 띄울지는 storyStore(엔진 상태)가 정한다. 그려지면 1일차를 처음부터 시작한다.
 * 노트북 화면은 3D 화면 자리에 붙어 있어서 여기가 아니라 LaptopDisplay가 그린다.
 */
export function StoryLayer() {
  const story = useStoryStore((s) => s.story)
  const pick = useStoryStore((s) => s.pick)
  const dateCardDone = useStoryStore((s) => s.dateCardDone)
  const view = useGameStore((s) => s.view)
  const line = useMonologueStore((s) => s.queue[0] ?? null)
  const next = useMonologueStore((s) => s.next)

  useEffect(() => useStoryStore.getState().begin(), [])

  // 하루를 여는 날짜 카드가 끝나기 전에는 왼쪽 위 날짜를 감춘다(카드의 날짜가 그 자리로 날아와 내려앉는다)
  const opening = story.dateCard !== null && story.fired.length === 0

  return (
    <div className={styles.layer}>
      {view === 'phone' && (
        <div className={styles.interactive}>
          <PhoneView />
        </div>
      )}
      <DayBadge text={opening ? null : `${story.day}일차`} />
      <HeartRate />
      <GuideBanner text={story.goal} />
      <Monologue line={line} onDone={next} />
      {story.choice && (
        <div className={styles.interactive}>
          <ChoiceMenu prompt={story.choice.prompt} choices={story.choice.choices} onChoose={pick} />
        </div>
      )}
      {story.dateCard && (
        <DateCard key={story.dateCard} text={story.dateCard} onDone={dateCardDone} />
      )}
    </div>
  )
}
