import { useEffect, useState } from 'react'
import type { BlankSentence, DayInfo, EvidenceCard, Message } from '@/data/types'
import { phoneSignalsOf } from '@/engine/phoneSignal'
import type { PhoneFeature } from '@/engine/phoneUnlock'
import { useGameStore } from '@/stores/gameStore'
import { dateOfDay, type PhoneApp, usePhoneStore } from '@/stores/phoneStore'
import { PhoneCloseup } from '@/ui/kit/phone/PhoneCloseup'
import { useFlowingClock } from '@/ui/screens/phone/clock'
import {
  HAND_SINK,
  HAND_URL,
  IMAGE_SIZE,
  interviewRecording,
  SCREEN,
  seedCalls,
} from '@/ui/screens/phone/phoneContent'
import { PhoneDevice, type PhoneEvent } from '@/ui/screens/phone/PhoneDevice'
import styles from './gangyi.module.css'

/**
 * 강이의 테스트 페이지. 개발 서버에서 `?sandbox=gangyi` 주소로 연다.
 * 휴대폰 화면(#35)을 하나씩 띄워 본다. 지금은 잠금 화면 알림(#49), 홈 화면(#101), 문자 앱(#50), 은행 앱(#51), 사진 앱(#52), SNS(#53), 블라블라(#54), 인터넷과 원격 관리 정보(#55), 전화 앱(#56), 메모 앱(#62).
 * 받은 메시지와 읽음은 phoneStore가 들고 있고, 이 페이지의 버튼이 사건 실행 코드 대신 메시지를 도착시킨다.
 * 휴대폰 화면을 고르는 부분(PhoneDevice)과 앱에 들어가는 내용(phoneContent)은 본편과 함께 쓴다.
 */

interface Scene {
  id: string
  label: string
  /** 몇 일차인지. 휴대폰에 보이는 날짜를 정한다 */
  info: DayInfo
  /** 항의 문자가 쏟아질 때처럼 손이 떨리는 장면 */
  shaking?: boolean
  messages: Message[]
  /** 도착하는 메시지가 없는 장면에서 시계가 시작하는 시각 */
  clock?: string
}

/** 견본 데이터. 문구는 대본 v1-2(docs/261126_대본_v1-2.md) 그대로다 */
const SCENES: Scene[] = [
  {
    id: 'd1s3',
    label: '1일차 장면 3',
    info: { day: 1, week: 1, weekday: '월', title: '입사' }, // 대본: 고객명단_월요일
    messages: [
      {
        id: 'd1-sms-hr',
        channel: 'sms',
        from: '모레온 인사팀',
        time: '10:11',
        body: '[모레온] {name} 님, 서류 전형 결과를 메일로 보내 드렸습니다. 확인 부탁드립니다.',
      },
    ],
  },
  {
    id: 'd2s4',
    label: '2일차 장면 4',
    info: { day: 2, week: 3, weekday: '수', title: '흔적' }, // 대본: 고객명단_수요일
    messages: [
      {
        id: 'd2-bank-open-1',
        channel: 'bank',
        from: '하나로은행',
        time: '11:27',
        body: '{name} 님 명의의 입출금 계좌가 개설되었습니다. 본인이 아니면 고객센터로 연락해 주세요.',
      },
      {
        id: 'd2-sms-cert',
        channel: 'sms',
        from: '본인인증',
        time: '11:27',
        body: '[본인인증] {name} 님의 본인 인증이 완료되었습니다.',
      },
      {
        id: 'd2-bank-open-2',
        channel: 'bank',
        from: '하나로은행',
        time: '11:31',
        body: '{name} 님 명의의 입출금 계좌가 개설되었습니다.',
      },
    ],
  },
  {
    id: 'd3s4',
    label: '3일차 장면 4',
    info: { day: 3, week: 4, weekday: '금', title: '감시' }, // 대본: 고객명단_금요일
    messages: [
      {
        id: 'd3-bank-count',
        channel: 'bank',
        from: '하나로은행',
        time: '12:40',
        body: '{name} 님 명의 계좌 3개.',
      },
    ],
  },
  {
    id: 'd4s5',
    label: '4일차 장면 5',
    info: { day: 4, week: 6, weekday: '화', title: '추리' }, // 대본에 요일이 없어 임의로 정했다
    shaking: true,
    messages: [
      {
        id: 'd4-sms-victim-1',
        channel: 'sms',
        from: '황보미진',
        time: '15:11',
        body: '세움파트너스 대표 {name} 씨 맞죠? 원금 보장이라면서요. 제 돈 돌려주세요.',
      },
      {
        id: 'd4-sms-victim-2',
        channel: 'sms',
        from: '모르는 번호',
        time: '15:13',
        body: '대표가 직접 운용한다면서요. {name} 대표님, 전화 좀 받으세요.',
      },
      {
        id: 'd4-sms-victim-3',
        channel: 'sms',
        from: '모르는 번호',
        time: '15:14',
        body: '매월 8% 확정 수익이라더니 출금이 안 됩니다. 신고합니다.',
      },
    ],
  },
  {
    id: 'd5s4',
    label: '5일차 장면 4',
    info: { day: 5, week: 8, weekday: '목', title: '결단' }, // 대본에 요일이 없어 임의로 정했다
    messages: [],
    clock: '10:06', // 취임식 중. 대본의 마지막 메신저가 10:03이다
  },
]

const VIEWS: { id: PhoneApp; label: string }[] = [
  { id: 'lock', label: '잠금 화면 (#49)' },
  { id: 'home', label: '홈 화면 (#101)' },
  { id: 'messages', label: '문자 앱 (#50)' },
  { id: 'bank', label: '은행 앱 (#51)' },
  { id: 'photos', label: '사진 앱 (#52)' },
  { id: 'sns', label: 'SNS (#53)' },
  { id: 'blabla', label: '블라블라 (#54)' },
  { id: 'browser', label: '인터넷 (#55)' },
  { id: 'phone', label: '전화 앱 (#56)' },
  { id: 'notes', label: '메모 앱 (#62)' },
]

/** 메모 앱 견본. 대본 2일차의 증거와 빈칸 문장이다 */
const NOTE_CARDS: EvidenceCard[] = [
  {
    id: 'checked_notice',
    title: '검수한 투자 안내문',
    detail: '원금 100% 보장, 매월 8% 확정 수익',
  },
  {
    id: 'registered_mail',
    title: '등기 우편',
    detail: '상호: 주식회사 세움파트너스. 대표이사: {name}',
  },
  {
    id: 'account_alert',
    title: '계좌 개설 알림',
    detail: '{name} 님 명의의 입출금 계좌가 개설되었습니다.',
  },
]
const NOTE_SENTENCES: BlankSentence[] = [
  {
    id: 'd2_ceo',
    day: 2,
    text: '세움파트너스의 대표로 등기된 사람은 [0]이다',
    answers: ['registered_mail'],
  },
]

/**
 * 장면을 처음부터 시작한다. 새 게임처럼 휴대폰을 비운 뒤,
 * 앞 장면에서 온 메시지는 이미 받아서 읽은 것으로 넣어 두고, 통화 기록 견본을 그날 기준으로 넣는다.
 */
const startScene = (id: string) => {
  const phone = usePhoneStore.getState()
  const index = Math.max(
    0,
    SCENES.findIndex((s) => s.id === id),
  )
  const earlier = SCENES.slice(0, index)
  phone.reset()
  earlier.forEach((s) => s.messages.forEach((m) => phone.receive(m, s.info)))
  phone.markRead(earlier.flatMap((s) => s.messages.map((m) => m.id)))

  seedCalls(dateOfDay(usePhoneStore.getState().weekOne, SCENES[index].info), SCENES[index].info.day)
}

/**
 * 그 날 휴대폰에 생겨 있는 것. 본편에서는 대본의 사건이 열어 주고, 여기서는 대본 문서의 흐름대로 흉내 낸다.
 * 블라블라는 입사한 뒤(2일차부터), 원격 관리 페이지는 5일차에 생긴다.
 */
const unlockedOn = (day: number): PhoneFeature[] => [
  ...(day >= 2 ? (['blabla'] as const) : []),
  ...(day >= 5 ? (['remote_admin'] as const) : []),
]

/** 휴대폰 화면에서 온 신호를 조작 패널에 보여 줄 글로 바꾼다. 실제 게임에서는 이 신호를 엔진이 받는다 */
const describe = (event: PhoneEvent): string => {
  switch (event.type) {
    case 'openNotification':
      return `알림 누름 (${event.message.from} ${event.message.time})`
    case 'read':
      return `읽음 (${event.ids.join(', ')})`
    case 'call':
      return `전화 걸기 (${event.number})`
    case 'callConnected':
      return `전화 연결됨 (${event.number})`
    case 'hangUp':
      return `전화 끊기 (${event.number})`
    case 'playVideo':
      return `영상 재생 (${event.id})`
    case 'endVideo':
      return `영상 끝까지 봄 (${event.id})`
    case 'seePhoto':
      return `SNS 사진 봄 (${event.postId} ${event.index + 1}번째)`
    case 'search':
      return `${event.app === 'blabla' ? '블라블라' : '인터넷'} 검색 (${event.query})`
    case 'readPost':
      return `블라블라 글 읽음 (${event.id})`
    case 'seeRemoteAdmin':
      return '원격 관리 정보 봄'
  }
}

export default function SandboxPage() {
  const [sceneId, setSceneId] = useState(SCENES[0].id)
  // 맞춰 본 문장의 결과. 실제 게임에서는 엔진이 판정해서 넘긴다
  const [noteStatus, setNoteStatus] = useState<Record<string, 'solved' | 'wrong'>>({})
  const [opened, setOpened] = useState('')
  const [fast, setFast] = useState(false)

  const received = usePhoneStore((s) => s.received)
  const app = usePhoneStore((s) => s.app)
  const weekOne = usePhoneStore((s) => s.weekOne)
  const receive = usePhoneStore((s) => s.receive)
  const openApp = usePhoneStore((s) => s.openApp)

  // 이름은 시작 화면에서 입력해 gameStore에 들어 있는 값을 쓴다. 이 페이지는 시작 화면을 거치지 않아 견본 이름을 넣는다
  const name = useGameStore((s) => s.playerName)
  const setName = (playerName: string) => useGameStore.setState({ playerName })

  useEffect(() => {
    startScene(SCENES[0].id)
    if (!useGameStore.getState().playerName) useGameStore.setState({ playerName: '홍길동' })
  }, [])

  const scene = SCENES.find((s) => s.id === sceneId) ?? SCENES[0]
  // 이 장면의 메시지 가운데 지금까지 도착한 수
  const arrived = scene.messages.filter((m) => received.some((r) => r.message.id === m.id)).length
  // 마지막으로 도착한 알림의 시각(대본)에서 시작해 실제 시간만큼 흐른다
  const time = useFlowingClock(
    (scene.messages[arrived - 1] ?? scene.messages[0])?.time ?? scene.clock ?? '09:00',
    fast ? 60 : 1,
  )

  const pickScene = (id: string) => {
    setSceneId(id)
    setOpened('')
    setNoteStatus({})
    startScene(id)
  }

  return (
    <main>
      <PhoneCloseup
        handSrc={HAND_URL}
        imageSize={IMAGE_SIZE}
        screen={SCREEN}
        sink={HAND_SINK}
        shaking={scene.shaking && arrived > 0}
      >
        <PhoneDevice
          key={scene.id}
          time={time}
          info={scene.info}
          name={name}
          videos={[interviewRecording(weekOne, name)]}
          notes={{
            cards: NOTE_CARDS,
            sentences: NOTE_SENTENCES,
            status: noteStatus,
            onSubmit: (sentenceId, cardIds) => {
              // 엔진 대신 정답을 견줘 본다
              const answers = NOTE_SENTENCES.find((s) => s.id === sentenceId)?.answers ?? []
              const solved = answers.every((id, i) => id === cardIds[i])
              setNoteStatus((prev) => ({ ...prev, [sentenceId]: solved ? 'solved' : 'wrong' }))
              setOpened(`맞춰 보기 (${cardIds.join(', ')})`)
            },
          }}
          unlocked={unlockedOn(scene.info.day)}
          // 본편에서는 이 이름으로 엔진에 신호가 간다. 대본의 interact 트리거에 이 이름을 쓴다
          onEvent={(event) => setOpened(`${describe(event)} → ${phoneSignalsOf(event).join(', ')}`)}
        />
      </PhoneCloseup>

      <aside className={styles.panel}>
        <strong>휴대폰 화면 (#35)</strong>
        <div className={styles.row}>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={v.id === app}
              onClick={() => openApp(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className={styles.row}>
          {SCENES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={s.id === scene.id}
              onClick={() => pickScene(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className={styles.row}>
          <button
            type="button"
            disabled={arrived >= scene.messages.length}
            onClick={() => receive(scene.messages[arrived], scene.info)}
          >
            다음 알림·문자 도착 ({arrived}/{scene.messages.length})
          </button>
          <button type="button" aria-pressed={fast} onClick={() => setFast((on) => !on)}>
            시간 빠르게 흐르기 (1초에 1분)
          </button>
          <button type="button" onClick={() => pickScene(scene.id)}>
            처음으로
          </button>
        </div>
        <label className={styles.row}>
          이름
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <p className={styles.log}>마지막으로 누른 것: {opened || '없음'}</p>
      </aside>
    </main>
  )
}
