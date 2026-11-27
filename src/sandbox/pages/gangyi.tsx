import { useEffect, useRef, useState } from 'react'
import type { BlankSentence, DayInfo, EvidenceCard, Message } from '@/data/types'
import { useGameStore } from '@/stores/gameStore'
import {
  dateOfDay,
  lockNotifications,
  messagesOf,
  type PhoneApp,
  usePhoneStore,
} from '@/stores/phoneStore'
import { PhoneCloseup } from '@/ui/kit/phone/PhoneCloseup'
import { INTERVIEW_LINES } from '@/ui/screens/laptop/videoScript'
import { type BankAccount, BankApp, type BankCard } from '@/ui/screens/phone/BankApp'
import { CallApp, type CallRecord, type Contact } from '@/ui/screens/phone/CallApp'
import { useFlowingClock } from '@/ui/screens/phone/clock'
import { type HomeApp, HomeScreen } from '@/ui/screens/phone/HomeScreen'
import { LockScreen } from '@/ui/screens/phone/LockScreen'
import { MessagesApp } from '@/ui/screens/phone/MessagesApp'
import { NotesApp } from '@/ui/screens/phone/NotesApp'
import { PhotosApp, type PhotoVideo } from '@/ui/screens/phone/PhotosApp'
import { SnsApp, type SnsPost } from '@/ui/screens/phone/SnsApp'
import styles from './gangyi.module.css'

/**
 * 강이의 테스트 페이지. 개발 서버에서 `?sandbox=gangyi` 주소로 연다.
 * 휴대폰 화면(#35)을 하나씩 띄워 본다. 지금은 잠금 화면 알림(#49), 홈 화면(#101), 문자 앱(#50), 은행 앱(#51), 사진 앱(#52), SNS(#53), 전화 앱(#56), 메모 앱(#62).
 * 받은 메시지와 읽음은 phoneStore가 들고 있고, 이 페이지의 버튼이 사건 실행 코드 대신 메시지를 도착시킨다.
 */

interface Scene {
  id: string
  label: string
  /** 몇 일차인지. 휴대폰에 보이는 날짜를 정한다 */
  info: DayInfo
  /** 항의 문자가 쏟아질 때처럼 손이 떨리는 장면 */
  shaking?: boolean
  messages: Message[]
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
]

/** 잠금 화면 왼쪽 위에 보이는 가상 통신망 이름(도담텔레콤의 줄임말). 실존 통신사 이름은 쓰지 않는다 */
const CARRIER = 'DT'

/** 대본의 은행 이름. 실존 은행과 겹치지 않는지 팀 확인이 필요하다 */
const BANK = '하나로은행'

/**
 * 내 명의 계좌 견본. 대본에는 "계좌 3개"와 "내가 만든 건 하나뿐"만 있어서,
 * 원래 계좌 하나에 2일차 개설 알림 두 건이 올 때마다 하나씩 늘어나게 했다.
 * 계좌 번호와 잔액은 대본에 없어 임의로 넣었다.
 */
const ACCOUNTS: (Omit<BankAccount, 'opened'> & { openedBy?: string })[] = [
  { id: 'mine', label: '입출금통장', number: '412-208-173904', balance: 847_200 },
  {
    id: 'opened-1',
    label: '입출금통장',
    number: '412-208-518327',
    balance: 0,
    openedBy: 'd2-bank-open-1',
  },
  {
    id: 'opened-2',
    label: '입출금통장',
    number: '412-208-518401',
    balance: 0,
    openedBy: 'd2-bank-open-2',
  },
]

/** 내 카드 견본. 대본에 없어 임의로 넣었다 */
const CARDS: BankCard[] = [{ id: 'check', label: '하나로 체크카드', last4: '2917', spent: 128_400 }]

/**
 * 사진 앱에 들어 있는 면접 녹화(1일차 장면 5, 약 30초). 영상 파일은 아직 없어서 임시 화면으로 재생된다.
 * 자막은 노트북의 화상 면접 화면과 같은 대사다.
 */
const RECORDING = { id: 'interview_recording', label: '김아영 · 모레온', duration: 30 }

/** 가상 SNS 이름. 대본에는 "SNS"라고만 있어 임시로 지었다. 팀 확인이 필요하다 */
const SNS = '픽담'

/**
 * 내 SNS 게시물(4일차 장면 3). 글은 대본 그대로다.
 * 사진 일곱 장은 아직 없어 임시 그림이 나오고, 대본대로 세 번째 사진(3/7)부터 보인다.
 * 좋아요, 팔로워, 팔로잉 수는 대본에 없어 임의로 넣었다.
 */
const SNS_POSTS: SnsPost[] = [
  {
    id: 'sns_handwriting',
    ago: '2년 전',
    photos: Array.from({ length: 7 }, () => undefined),
    photoLabel: '손글씨 메뉴판·안내문',
    startAt: 2,
    lines: ['동네 가게들의 손글씨 메뉴판·안내문', '삐뚤빼뚤한 글씨인데 이상하게 제일 잘 읽힌다.'],
    likes: 4,
  },
]

/**
 * 연락처 견본. 대본에는 "엄마한테 전화해야 하는데"만 있어서 엄마를 넣었고, 나머지는 임의로 넣었다.
 * 번호는 실제로 쓰이지 않게 010-0000으로 시작한다.
 */
const CONTACTS: Contact[] = [
  { id: 'mom', name: '엄마', number: '01000000412' },
  { id: 'dad', name: '아빠', number: '01000000413' },
  { id: 'landlord', name: '집주인', number: '01000002207' },
  { id: 'office', name: '관리실', number: '01000003301' },
  { id: 'friend', name: '서준', number: '01000005128' },
  { id: 'senior', name: '박 대리', number: '01000007744' },
]

/**
 * 최근 통화 견본. 대본에 없어 임의로 넣었다. 4일차의 부재중 전화는
 * 항의 문자의 "전화 좀 받으세요"에 맞춘 것이다. day는 그 통화가 있었던 날(몇 일차)이다.
 */
const CALLS: (Omit<CallRecord, 'date'> & { day: DayInfo })[] = [
  { id: 'c1', number: '01000000412', kind: 'in', time: '19:42', day: SCENES[0].info },
  { id: 'c2', number: '01000005128', kind: 'out', time: '21:05', day: SCENES[1].info },
  { id: 'c3', number: '01000000412', kind: 'missed', time: '20:17', day: SCENES[2].info },
  { id: 'c4', number: '01000009031', kind: 'missed', time: '15:09', day: SCENES[3].info },
  { id: 'c5', number: '01000006618', kind: 'missed', time: '15:12', day: SCENES[3].info },
]

/** 신고처 번호. 엔딩 화면의 안내와 같은 번호(경찰 112, 금융감독원 1332)만 연결된다 */
const REPORT_NUMBERS = ['112', '1332']

/** 누른 알림이 여는 앱 */
const APP_NAMES: Partial<Record<Message['channel'], string>> = { sms: '문자 앱', bank: '은행 앱' }

const VIEWS: { id: PhoneApp; label: string }[] = [
  { id: 'lock', label: '잠금 화면 (#49)' },
  { id: 'home', label: '홈 화면 (#101)' },
  { id: 'messages', label: '문자 앱 (#50)' },
  { id: 'bank', label: '은행 앱 (#51)' },
  { id: 'photos', label: '사진 앱 (#52)' },
  { id: 'sns', label: 'SNS (#53)' },
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

// 손 이미지(협성 님 테스트 페이지와 같은 파일)와 그 안의 화면 자리. 이미지의 검은 화면 영역을 픽셀로 잰 값이다
const HAND_URL = `${import.meta.env.BASE_URL}images/hand_phone_day.webp`
const IMAGE_SIZE = { width: 1239, height: 1269 }
const SCREEN = { left: 418, top: 149, right: 818, bottom: 1000, radius: 41 }

/**
 * 장면을 처음부터 시작한다. 새 게임처럼 휴대폰을 비운 뒤,
 * 앞 장면에서 온 메시지는 이미 받아서 읽은 것으로 넣어 둔다.
 */
const startScene = (id: string) => {
  const phone = usePhoneStore.getState()
  const earlier = SCENES.slice(
    0,
    SCENES.findIndex((s) => s.id === id),
  )
  phone.reset()
  earlier.forEach((s) => s.messages.forEach((m) => phone.receive(m, s.info)))
  phone.markRead(earlier.flatMap((s) => s.messages.map((m) => m.id)))
}

export default function SandboxPage() {
  const [sceneId, setSceneId] = useState(SCENES[0].id)
  // 지금 건 전화가 연결됐는지. 실제 게임에서는 엔진이 정한다
  const [connected, setConnected] = useState(false)
  const connectTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // 맞춰 본 문장의 결과. 실제 게임에서는 엔진이 판정해서 넘긴다
  const [noteStatus, setNoteStatus] = useState<Record<string, 'solved' | 'wrong'>>({})
  const [opened, setOpened] = useState('')
  const [fast, setFast] = useState(false)

  const received = usePhoneStore((s) => s.received)
  const readIds = usePhoneStore((s) => s.readIds)
  const app = usePhoneStore((s) => s.app)
  const thread = usePhoneStore((s) => s.thread)
  const weekOne = usePhoneStore((s) => s.weekOne)
  const receive = usePhoneStore((s) => s.receive)
  const markRead = usePhoneStore((s) => s.markRead)
  const openApp = usePhoneStore((s) => s.openApp)

  // 이름은 시작 화면에서 입력해 gameStore에 들어 있는 값을 쓴다. 이 페이지는 시작 화면을 거치지 않아 견본 이름을 넣는다
  const name = useGameStore((s) => s.playerName)
  const setName = (playerName: string) => useGameStore.setState({ playerName })

  useEffect(() => {
    startScene(SCENES[0].id)
    if (!useGameStore.getState().playerName) useGameStore.setState({ playerName: '홍길동' })
  }, [])

  const scene = SCENES.find((s) => s.id === sceneId) ?? SCENES[0]
  const today = dateOfDay(weekOne, scene.info)
  // 이 장면의 메시지 가운데 지금까지 도착한 수
  const arrived = scene.messages.filter((m) => received.some((r) => r.message.id === m.id)).length
  // 이름 바꾸기는 화면에 넘길 때 한다. 스토어에는 대본 그대로({name}) 들어 있다
  const fill = (text: string) => text.replaceAll('{name}', name)
  const texts = messagesOf(received, weekOne, 'sms')
  const goHome = () => openApp('home')
  // 홈 화면의 앱. 화면이 있는 앱만 놓는다
  const notices = messagesOf(received, weekOne, 'bank')
  // 개설 알림이 온 계좌만 보인다. 만들어진 때는 그 알림을 받은 때다
  const accounts: BankAccount[] = ACCOUNTS.flatMap(({ openedBy, ...account }) => {
    if (!openedBy) return [account]
    const notice = notices.find((n) => n.id === openedBy)
    return notice ? [{ ...account, opened: { date: notice.date, time: notice.time } }] : []
  })
  // 면접 녹화는 1일차에 찍힌 것이다
  const videos: PhotoVideo[] = [
    {
      ...RECORDING,
      date: dateOfDay(weekOne, SCENES[0].info),
      captions: INTERVIEW_LINES.map((line) => ({ ...line, text: fill(line.text) })),
    },
  ]
  // 이 장면의 날까지 있었던 통화만 보인다
  const calls: CallRecord[] = CALLS.filter((c) => c.day.day <= scene.info.day).map(
    ({ day, ...record }) => ({ ...record, date: dateOfDay(weekOne, day) }),
  )
  const homeApps: HomeApp<PhoneApp>[] = [
    { id: 'photos', label: '사진', icon: 'photos' },
    { id: 'sns', label: SNS, icon: 'sns' },
    { id: 'notes', label: '메모', icon: 'notes' },
    {
      id: 'bank',
      label: BANK,
      icon: 'bank',
      badge: notices.filter((n) => !readIds.includes(n.id)).length,
    },
  ]
  const dockApps: HomeApp<PhoneApp>[] = [
    { id: 'phone', label: '전화', icon: 'phone' },
    {
      id: 'messages',
      label: '메시지',
      icon: 'message',
      badge: texts.filter((m) => !readIds.includes(m.id)).length,
    },
  ]
  const withName = <T extends Message>(m: T): T => ({ ...m, body: fill(m.body) })
  // 마지막으로 도착한 알림의 시각(대본)에서 시작해 실제 시간만큼 흐른다
  const time = useFlowingClock(
    (scene.messages[arrived - 1] ?? scene.messages[0]).time,
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
        shaking={scene.shaking && arrived > 0}
      >
        {app === 'lock' ? (
          <LockScreen
            time={time}
            carrier={CARRIER}
            date={today}
            messages={lockNotifications(received, readIds, scene.info.day).map(withName)}
            onOpen={(m) => {
              setOpened(`${APP_NAMES[m.channel] ?? m.channel} 열기 (${m.from} ${m.time})`)
              if (m.channel === 'sms') openApp('messages', m.from)
              if (m.channel === 'bank') {
                // 누른 알림은 읽은 것으로 친다. 나머지는 은행 앱의 알림 탭에서 읽는다
                markRead([m.id])
                openApp('bank')
              }
            }}
            onUnlock={goHome}
          />
        ) : app === 'home' ? (
          <HomeScreen time={time} apps={homeApps} dock={dockApps} onOpen={(id) => openApp(id)} />
        ) : app === 'bank' ? (
          <BankApp
            time={time}
            today={today}
            bank={BANK}
            owner={name}
            accounts={accounts}
            cards={CARDS}
            notices={notices.map(withName)}
            readIds={readIds}
            onRead={(ids) => {
              markRead(ids)
              setOpened(`은행 알림 읽음 (${ids.join(', ')})`)
            }}
            onHome={goHome}
          />
        ) : app === 'photos' ? (
          <PhotosApp
            key={scene.id}
            time={time}
            today={today}
            videos={videos}
            onPlay={(id) => setOpened(`영상 재생 (${id})`)}
            onEnded={(id) => setOpened(`영상 끝까지 봄 (${id})`)}
            onHome={goHome}
          />
        ) : app === 'sns' ? (
          <SnsApp
            key={scene.id}
            time={time}
            app={SNS}
            author={name}
            followers={23}
            following={41}
            posts={SNS_POSTS}
            onSeePhoto={(id, index) => setOpened(`SNS 사진 봄 (${id} ${index + 1}/7)`)}
            onHome={goHome}
          />
        ) : app === 'phone' ? (
          <CallApp
            key={scene.id}
            time={time}
            today={today}
            contacts={CONTACTS}
            calls={calls}
            connected={connected}
            onCall={(number) => {
              setConnected(false)
              setOpened(`전화 걸기 (${number})`)
              // 엔진 대신: 신고처 번호만 2초 뒤에 연결된다
              if (REPORT_NUMBERS.includes(number)) {
                connectTimer.current = setTimeout(() => {
                  setConnected(true)
                  setOpened(`신고 전화 연결됨 (${number})`)
                }, 2000)
              }
            }}
            onHangUp={(number) => {
              clearTimeout(connectTimer.current)
              setConnected(false)
              setOpened(`전화 끊기 (${number})`)
            }}
            onHome={goHome}
          />
        ) : app === 'notes' ? (
          <NotesApp
            time={time}
            cards={NOTE_CARDS.map((c) => ({ ...c, detail: fill(c.detail) }))}
            sentences={NOTE_SENTENCES}
            status={noteStatus}
            onSubmit={(sentenceId, cardIds) => {
              // 엔진 대신 정답을 견줘 본다
              const answers = NOTE_SENTENCES.find((s) => s.id === sentenceId)?.answers ?? []
              const solved = answers.every((id, i) => id === cardIds[i])
              setNoteStatus((prev) => ({ ...prev, [sentenceId]: solved ? 'solved' : 'wrong' }))
              setOpened(`맞춰 보기 (${cardIds.join(', ')})`)
            }}
            onHome={goHome}
          />
        ) : (
          <MessagesApp
            key={`${scene.id}-${thread ?? ''}`}
            time={time}
            today={today}
            messages={texts.map(withName)}
            readIds={readIds}
            onRead={(ids) => {
              markRead(ids)
              setOpened(`문자 읽음 (${ids.join(', ')})`)
            }}
            defaultThread={thread ?? undefined}
            onHome={goHome}
          />
        )}
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
