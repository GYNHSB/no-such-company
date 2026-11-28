import { useEffect, useRef, useState } from 'react'
import { useGameStore, type View } from '@/stores/gameStore'
import { useMonologueStore } from '@/stores/monologueStore'
import { goalOf, useStoryStore } from '@/stores/storyStore'
import { ChoiceMenu } from './common/ChoiceMenu'
import { DateCard } from './common/DateCard'
import { DayBadge } from './common/DayBadge'
import { GuideBanner } from './common/GuideBanner'
import { HeartRate } from './common/HeartRate'
import { Monologue } from './common/Monologue'
import { PhoneIcon, Pocket } from './common/Pocket'
import { preloadHand } from './phone/phoneContent'
import { PhoneView } from './phone/PhoneView'
import styles from './StoryLayer.module.css'

/** 방에서 고를 수 있는 물건으로 할 수 있는 일(room.glb의 물건 이름 → 화면에 보일 글) */
const AIM_LABELS: Record<string, string> = {
  interact_laptop: '노트북 보기',
  interact_phone: '휴대폰 집기',
  bed: '침대에 눕기',
  chair: '의자에 앉기',
  desk_lamp: '스탠드 켜고 끄기',
  light_switch: '전등 켜고 끄기',
}

/** 터치로 쓰는 기기인지. 터치에서는 키와 조작 안내를 보여 주지 않는다 */
const TOUCH = window.matchMedia('(pointer: coarse)').matches

/** 걷거나 도는 키(조작 안내에 적힌 키와 방향키). 한 번 누르면 조작 안내를 치운다 */
const MOVE_CODES = [
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]

/** 보던 것을 닫는 단추의 글. 노트북은 화면이 단추 자리를 가려서 Esc로만 닫는다 */
const LEAVE_LABELS: Partial<Record<View, string>> = {
  phone: '휴대폰 내려놓기',
  bed: '일어나기',
  seat: '일어나기',
}

/**
 * 본편 3D 방 위에 겹치는 화면 전부. 휴대폰 클로즈업, 왼쪽 위 날짜, 안내, 혼잣말, 선택지, 날짜 카드,
 * 그리고 오른쪽 아래의 소지품 칸과 돌아가기 단추, 커서 옆에 뜨는 고를 수 있는 물건 안내, 조작 안내.
 * 무엇을 띄울지는 storyStore(엔진 상태)가 정한다. 그려지면 1일차를 처음부터 시작한다.
 * 노트북 화면은 3D 화면 자리에 붙어 있어서 여기가 아니라 LaptopDisplay가 그린다.
 */
interface StoryLayerProps {
  /** 휴대폰을 꺼내는 키의 이름("Q"). 소지품 칸에 보여 준다. 키는 3D 쪽(src/game)에서 정해서 넘긴다 */
  phoneKeyLabel?: string
  /** 가까이에서 보고 있는 물건을 고르는 키의 이름("E"). 물건 안내에 보여 준다 */
  pickKeyLabel?: string
}

export function StoryLayer({ phoneKeyLabel, pickKeyLabel }: StoryLayerProps) {
  const story = useStoryStore((s) => s.story)
  // 하루가 끝났고 다음 날이 있으면 침대에 누우라는 말이 덧붙는다
  const goal = useStoryStore(goalOf)
  const pick = useStoryStore((s) => s.pick)
  const dateCardDone = useStoryStore((s) => s.dateCardDone)
  const view = useGameStore((s) => s.view)
  const hasPhone = useGameStore((s) => s.hasPhone)
  const aim = useGameStore((s) => s.aim)
  const openView = useGameStore((s) => s.openView)
  const closeView = useGameStore((s) => s.closeView)
  /** 방을 걸어 다니거나 의자에 앉아 둘러보는 중인지. 이때 물건을 고르고 휴대폰을 꺼낼 수 있다 */
  const around = view === 'room' || view === 'seat'
  const aimLabel = around && aim ? AIM_LABELS[aim] : undefined
  const leaveLabel = LEAVE_LABELS[view]
  const line = useMonologueStore((s) => s.queue[0] ?? null)
  const next = useMonologueStore((s) => s.next)
  // 고를 수 있는 물건의 안내는 커서 옆에 띄운다. 커서가 움직일 때마다 다시 그리지 않도록 자리만 CSS 변수로 넘긴다.
  // 커서가 없으면(터치 기기, 커서가 창 밖에 있을 때) 화면 가운데에 띄운다.
  const layer = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = layer.current
    if (!element) return
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      element.style.setProperty('--cursor-x', `${e.clientX}px`)
      element.style.setProperty('--cursor-y', `${e.clientY}px`)
      element.toggleAttribute('data-cursor', true)
    }
    const leave = () => element.removeAttribute('data-cursor')
    window.addEventListener('pointermove', move)
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [])

  /** 플레이어가 한 번이라도 걷거나 돌았는지. 그 뒤에는 조작 안내를 보이지 않는다 */
  const [moved, setMoved] = useState(false)
  useEffect(() => {
    if (moved) return
    const press = (e: KeyboardEvent) => {
      if (MOVE_CODES.includes(e.code)) setMoved(true)
    }
    window.addEventListener('keydown', press)
    return () => window.removeEventListener('keydown', press)
  }, [moved])

  useEffect(() => useStoryStore.getState().begin(), [])
  // 휴대폰을 처음 들 때 손 이미지가 늦게 뜨지 않게 미리 받아 둔다
  useEffect(preloadHand, [])

  // 하루를 여는 날짜 카드가 끝나기 전에는 왼쪽 위 날짜를 감춘다(카드의 날짜가 그 자리로 날아와 내려앉는다)
  const opening = story.dateCard !== null && story.fired.length === 0

  return (
    <div ref={layer} className={styles.layer}>
      {view === 'phone' && (
        <div className={styles.interactive}>
          <PhoneView />
        </div>
      )}
      {aimLabel && (
        <p className={styles.aim}>
          {!TOUCH && pickKeyLabel && <kbd aria-hidden="true">{pickKeyLabel}</kbd>}
          {aimLabel}
        </p>
      )}
      {view === 'room' && !TOUCH && !moved && !story.choice && (
        <p className={styles.hint}>
          <kbd>W</kbd>
          <kbd>S</kbd> 걷기
          <kbd>A</kbd>
          <kbd>D</kbd> 돌기
          <span>마우스를 움직이면 그쪽을 봐요</span>
        </p>
      )}
      <div className={styles.hud}>
        {around && (
          <Pocket
            items={
              hasPhone
                ? [
                    {
                      id: 'phone',
                      label: '휴대폰',
                      keyLabel: phoneKeyLabel,
                      icon: <PhoneIcon />,
                      onOpen: () => openView('phone'),
                    },
                  ]
                : []
            }
          />
        )}
        {leaveLabel && (
          <button
            type="button"
            className={
              view === 'seat' && hasPhone ? `${styles.leave} ${styles.above}` : styles.leave
            }
            onClick={closeView}
          >
            {leaveLabel}
            <kbd aria-hidden="true">Esc</kbd>
          </button>
        )}
      </div>
      <DayBadge text={opening ? null : `${story.day}일차`} />
      <HeartRate />
      <GuideBanner text={goal} />
      <Monologue line={line} onDone={next} place={view === 'phone' ? 'top' : 'bottom'} />
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
