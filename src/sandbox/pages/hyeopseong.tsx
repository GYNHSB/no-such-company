import { button, Leva, useControls } from 'leva'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { BLANK_MAX_WRONG_IN_A_ROW, SUSPICION } from '@/data/rules'
import type { DayScript, EndingId } from '@/data/types'
import GameCanvas from '@/game/GameCanvas'
import { PHONE_KEY } from '@/game/input/controls'
import { useGameStore } from '@/stores/gameStore'
import { useMonologueStore } from '@/stores/monologueStore'
import { ChoiceMenu } from '@/ui/screens/common/ChoiceMenu'
import { DateCard } from '@/ui/screens/common/DateCard'
import { DayBadge } from '@/ui/screens/common/DayBadge'
import { MailCloseup } from '@/ui/screens/common/MailCloseup'
import { SignaturePad } from '@/ui/screens/common/SignaturePad'
import { InaugurationCall } from '@/ui/screens/laptop/InaugurationCall'
import { PhoneIcon, Pocket } from '@/ui/screens/common/Pocket'
import { dayLabel } from '@/ui/screens/common/dayLabel'
import { GuideBanner } from '@/ui/screens/common/GuideBanner'
import { EndingScreen, type EndingRecord } from '@/ui/screens/common/EndingScreen'
import { Notebook, type SentenceStatus } from '@/ui/screens/common/Notebook'
import { NotesApp } from '@/ui/screens/common/NotesApp'
import { Monologue } from '@/ui/screens/common/Monologue'
import { PhoneHomeTest } from './hyeopseong/PhoneHomeTest'
import { SAMPLE_CARDS, SAMPLE_SENTENCES } from './hyeopseong/notebookSample'

// 두 손으로 쥔 휴대폰 그림(1239 x 1269, 배경 투명). 소매가 그림 아래 좌우 끝에서 잘려 있다.
const HAND_URL = `${import.meta.env.BASE_URL}images/hand_phone_day.webp`

/** 화면 가운데 점이 가리키는 물건(gameStore의 aim)에 맞춰 보여 줄 안내. 켜고 끄는 물건은 지금 상태를 보고 고른다. */
function aimLabel(s: ReturnType<typeof useGameStore.getState>): string | null {
  switch (s.aim) {
    case 'interact_laptop':
      return '클릭해서 노트북 쓰기'
    case 'interact_phone':
      return '클릭해서 휴대폰 집기'
    case 'bed':
      return '클릭해서 눕기'
    case 'desk_lamp':
      return s.deskLamp ? '클릭해서 스탠드 끄기' : '클릭해서 스탠드 켜기'
    case 'light_switch':
      return s.ceilingLight ? '클릭해서 불 끄기' : '클릭해서 불 켜기'
    default:
      return null
  }
}

/** 아직 이야기 진행(엔진)이 없어서, 디테일을 켜 보는 오른쪽 위 테스트 패널. 개발 서버에서만 보인다. */
function useDetailControls() {
  const game = useGameStore.getState
  const { 성능 } = useControls('디테일 테스트', {
    // 왼쪽 위 FPS·CPU 표시(GameCanvas의 StatsGl). 날짜와 겹쳐서 평소엔 끈다.
    성능: { value: false, label: 'FPS 표시' },
    경계심: {
      value: SUSPICION.start,
      min: 0,
      max: SUSPICION.max,
      step: 1,
      onChange: (v: number) => game().setSuspicion(v),
    },
    웹캠: { value: false, onChange: (v: boolean) => game().setWebcam(v) },
    밤: { value: false, onChange: (v: boolean) => game().setNight(v) },
    '휴대폰 알림': button(() => game().buzzPhone()),
    '우편물 도착': button(() => game().dropMail()),
  })
  return { showStats: 성능 }
}

/** 대본 v1-2의 날짜 표기 5개와 시간이 건너뛸 때의 문구 */
const DATE_SAMPLES = [
  dayLabel({ day: 1, week: 1 }),
  dayLabel({ day: 2, week: 3 }),
  dayLabel({ day: 3, week: 4 }),
  dayLabel({ day: 4, week: 6 }),
  dayLabel({ day: 5, week: 8 }),
  '그날 오후',
]

/** 날짜 카드를 골라 띄워 보는 패널. 같은 카드도 다시 볼 수 있게 누를 때마다 새로 그린다. */
function useDateCard() {
  const [card, setCard] = useState<{ text: string; id: number } | null>(null)
  // 날짜 카드가 끝나면 "2일차" 부분만 왼쪽 위에 남긴다. "그날 오후"는 날짜가 아니라 그대로 둔다.
  const [day, setDay] = useState<string | null>(null)
  const closeCard = () => {
    const [main, sub] = card?.text.split(' · ') ?? []
    if (sub) setDay(main)
    setCard(null)
  }
  useControls('날짜 카드', {
    날짜: { value: DATE_SAMPLES[1], options: DATE_SAMPLES },
    보기: button((get) => {
      const text = get('날짜 카드.날짜') as string
      // 새 날짜가 날아오는 동안 왼쪽 위의 지난 날짜는 치운다. 도착하면 closeCard가 같은 자리에 새 날짜를 띄운다.
      if (text.includes(' · ')) setDay(null)
      setCard((c) => ({ text, id: (c?.id ?? 0) + 1 }))
    }),
  })
  return { card, closeCard, day }
}

/** 대본 v1-2의 선택 장면 4개. 문구는 대본 그대로(따옴표는 말, 없는 것은 행동) */
const CHOICE_SAMPLES = {
  '3일차 팀장에게 답': {
    prompt: '팀장에게 뭐라고 답할까',
    labels: [
      '"검수한 안내문에 나온 회사라 궁금해서요."',
      '"아무것도 아니에요. 오늘 업무 바로 시작할게요!"',
      '"제 이름으로 등기 우편이 왔던데요. 팀장님은 아세요?"',
    ],
  },
  '4일차 영상 다시': {
    prompt: '영상을 다시 찍어 보낼까',
    labels: [
      '찍어서 보낸다',
      '"웹캠이 고장 난 것 같아요. 내일 보내 드릴게요."',
      '"지난번에 보낸 영상으로는 안 되나요?"',
    ],
  },
  '5일차 서명': {
    prompt: '취임 승낙서에 서명할까',
    labels: ['서명한다', '"서류를 천천히 읽어 보고 서명할게요."', '"제가 왜 대표가 되는 거죠?"'],
  },
  '5일차 승낙문 읽기': {
    prompt: '카메라를 보고 승낙문을 읽을까',
    labels: [
      '카메라를 보고 읽는다',
      '"목이 잠겨서요. 물 좀 가져올게요."',
      '"마이크가 이상한 것 같아요. 잠시만요."',
    ],
  },
}
type ChoiceScene = keyof typeof CHOICE_SAMPLES

/**
 * 노트북 웹캠을 켜는 행동. 켜지면 웹캠 옆 초록 불이 들어오고 딸깍 소리가 난다.
 * 실제 게임에서는 자료의 효과({ type: 'webcam', on: true }, { type: 'scene' })로 엔진이 한다.
 * 이어서 "찍어서 보낸다"는 본인 확인 영상 찍기 화면(1번 묶음), "서명한다"는 화상 취임식의 전자 서명(2번 묶음)으로 간다.
 */
const WEBCAM_ACTIONS = new Set(['찍어서 보낸다', '카메라를 보고 읽는다'])

/**
 * 선택지를 골라 띄워 보는 패널. 대사(따옴표 있는 것)를 고르면 그 대사를 독백 창에 한 번 더 보여 준다.
 * 실제 게임에서는 엔진이 같은 일을 한다(고른 대사를 독백 창으로).
 */
function useChoiceTest({ openCall, showPad }: Pick<SignTest, 'openCall' | 'showPad'>) {
  const [scene, setScene] = useState<ChoiceScene | null>(null)
  useControls('선택지', {
    장면: { value: '3일차 팀장에게 답', options: Object.keys(CHOICE_SAMPLES) },
    보기: button((get) => {
      const picked = get('선택지.장면') as ChoiceScene
      // 5일차 선택지는 화상 취임식 화면 위에서 고른다
      if (picked === '5일차 서명') openCall('sign', false)
      if (picked === '5일차 승낙문 읽기') openCall('read', false)
      setScene(picked)
    }),
  })
  const choose = useCallback(
    (id: string) => {
      const label = scene ? CHOICE_SAMPLES[scene].labels[Number(id) - 1] : undefined
      setScene(null)
      // 대사는 독백 창에 한 번 더 보여 주고, 행동은 말 대신 그 행동을 한다
      if (label?.startsWith('"')) useMonologueStore.getState().say(label)
      else if (label && WEBCAM_ACTIONS.has(label)) useGameStore.getState().setWebcam(true)
      else if (label === '서명한다') showPad()
    },
    [scene, showPad],
  )
  return { choice: scene ? CHOICE_SAMPLES[scene] : null, choose }
}

/**
 * 주인공 원룸의 주소(가상). 우편물 받는 곳이자, 도용된 회사의 본점 주소다("…그런데 주소가 여기다").
 * 실제 지명과 겹치지 않게 지은 구·길 이름이다.
 */
const ROOM_ADDRESS = '서울특별시 은하구 솔빛로14길 23, 302호'

/**
 * 대본 v1-2의 우편물 2통. 본문은 대본 그대로, 이름 자리는 {name}.
 * 대본에 없던 것: 겉봉(보낸 곳, 주소, 등기번호)과 등기 우편의 "본점" 줄. 혼잣말 "주소가 여기다"에 맞추려고 넣었다.
 * 혼잣말은 대본 2일차 장면 2, 5일차 장면 1 그대로. 겉봉을 볼 때와 서류를 열었을 때로 나눴다.
 */
const MAIL_SAMPLES = {
  '2일차 등기 우편': {
    message: {
      from: '법인등기 안내',
      body: `법인 설립 등기가 완료되었음을 알려 드립니다.\n상호: 주식회사 세움파트너스\n본점: ${ROOM_ADDRESS}\n대표이사: {name}`,
    },
    envelope: { from: '한빛지방법원 등기국', address: ROOM_ADDRESS, trackingNo: '1873204561729' },
    say: {
      envelope: ['등기 우편? 내 앞으로?'],
      letter: [
        '주식회사 세움파트너스. 대표이사…',
        '대표이사 칸에 내 이름이 있다.',
        '동명이인이겠지.',
        '…그런데 주소가 여기다.',
      ],
    },
  },
  '5일차 출석 요구서': {
    message: {
      from: '경찰서 수사과',
      body: '출석 요구서\n{name} 님은 주식회사 세움파트너스 투자 사기 사건의 피의자로 내일 오후 2시까지 출석해 주시기 바랍니다.',
    },
    envelope: { from: '경찰서 수사과', address: ROOM_ADDRESS, trackingNo: '1873209930415' },
    say: {
      envelope: ['또 우편물이다.'],
      letter: ['출석 요구서. 피의자 {name}.', '내일 오후 두 시.'],
    },
  },
}
type MailSample = keyof typeof MAIL_SAMPLES

/** 우편물을 골라 띄워 보는 패널. 이름은 시작 화면 대신 여기서 넣는다. 겉봉과 서류를 볼 때 대본의 혼잣말을 한다. */
function useMailTest() {
  const [mail, setMail] = useState<MailSample | null>(null)
  const { 이름 } = useControls('우편물', {
    이름: '한결',
    우편물: { value: '2일차 등기 우편', options: Object.keys(MAIL_SAMPLES) },
    보기: button((get) => setMail(get('우편물.우편물') as MailSample)),
  })
  const closeMail = useCallback(() => setMail(null), [])
  const onStage = useCallback(
    (stage: 'envelope' | 'letter') => {
      if (!mail) return
      const lines = MAIL_SAMPLES[mail].say[stage].map((line) => line.replaceAll('{name}', 이름))
      // 겉봉에서 하던 말이 남아 있으면 치우고 서류의 말을 시작한다
      useMonologueStore.setState({ queue: [] })
      useMonologueStore.getState().say(...lines)
    },
    [mail, 이름],
  )
  return { mail: mail ? MAIL_SAMPLES[mail] : null, name: 이름, closeMail, onStage }
}

/**
 * 5일차 화상 취임식(2번 묶음의 InaugurationCall)에 서명 패드를 끼워 보는 패널.
 * 그 화면의 "서류 아래에 끼워 넣을 것"(children) 자리를 쓴다. 취임식 화면 파일은 고치지 않았다.
 */
function useSignTest() {
  // signature: 그린 서명 그림. 취임식 화면이 그림을 받게 되면 서명 칸에 넘긴다
  const [call, setCall] = useState<{
    step: 'sign' | 'read'
    pad: boolean
    signed: boolean
    signature?: string
  } | null>(null)
  /** 취임식 화면을 연다. pad가 true면 서명 패드까지 바로 보여 준다. */
  const openCall = useCallback(
    (step: 'sign' | 'read', pad: boolean) => setCall({ step, pad, signed: false }),
    [],
  )
  useControls('서명', {
    '5일차 취임식 서명 보기': button(() => openCall('sign', true)),
  })
  return {
    call,
    openCall,
    /** 선택지에서 "서명한다"를 골랐을 때: 서명 패드가 나온다 */
    showPad: useCallback(() => setCall((c) => c && { ...c, pad: true }), []),
    sign: (image: string) => setCall((c) => c && { ...c, signed: true, signature: image }),
    close: () => setCall(null),
  }
}
type SignTest = ReturnType<typeof useSignTest>

/** 메모장을 열 밤. 그날까지 모은 카드와 열린 문장만 보인다. */
const NOTEBOOK_NIGHTS = { '2일차 밤': 2, '4일차 밤': 4, '5일차': 5 } as const

/**
 * 메모장 패널. 엔진이 없어서 이 페이지가 엔진 대신 정답을 판정한다(부품은 판정하지 않는다).
 * 같은 문장을 연달아 BLANK_MAX_WRONG_IN_A_ROW번 틀리면 그날 밤엔 더 못 맞춘다(rules.ts).
 * 고른 밤의 카드와 문장은 휴대폰 메모 앱과 종이 메모장이 함께 쓴다.
 */
function useNotebookTest() {
  const [night, setNight] = useState<number>(4)
  const [paperOpen, setPaperOpen] = useState(false)
  const [status, setStatus] = useState<Record<string, SentenceStatus | undefined>>({})
  const [wrongs, setWrongs] = useState<Record<string, number>>({})
  useControls('메모장', {
    밤: {
      value: '4일차 밤',
      options: Object.keys(NOTEBOOK_NIGHTS),
      onChange: (v: string) => {
        setNight(NOTEBOOK_NIGHTS[v as keyof typeof NOTEBOOK_NIGHTS])
        setStatus({})
        setWrongs({})
      },
    },
    '종이 메모장 열기': button(() => setPaperOpen(true)),
  })
  const submit = (id: string, cardIds: string[]) => {
    const sentence = SAMPLE_SENTENCES.find((s) => s.id === id)
    if (!sentence) return
    if (sentence.answers.every((answer, i) => answer === cardIds[i])) {
      setStatus((s) => ({ ...s, [id]: 'solved' }))
      return
    }
    const count = (wrongs[id] ?? 0) + 1
    setWrongs((w) => ({ ...w, [id]: count }))
    // 흔들림이 다시 보이도록 잠깐 비웠다가 넣는다
    setStatus((s) => ({ ...s, [id]: undefined }))
    requestAnimationFrame(() =>
      setStatus((s) => ({
        ...s,
        [id]: count >= BLANK_MAX_WRONG_IN_A_ROW ? 'locked' : 'wrong',
      })),
    )
  }
  return {
    open: paperOpen,
    cards: SAMPLE_CARDS.filter((c) => c.day <= night),
    sentences: SAMPLE_SENTENCES.filter((s) => s.day <= night),
    status,
    submit,
    close: () => setPaperOpen(false),
  }
}

/** 엔딩 4종 견본 기록. 실제 게임에서는 엔진이 모은다. */
const ENDING_SAMPLES: Record<EndingId, EndingRecord> = {
  safe: {
    period: '5일차 · 입사 8주 차',
    evidence: [16, 16],
    sentences: [4, 4],
    signed: false,
    reported: true,
    maxSuspicion: 62,
  },
  escaped: {
    period: '5일차 · 입사 8주 차',
    evidence: [14, 16],
    sentences: [4, 4],
    signed: false,
    reported: true,
    maxSuspicion: 85,
  },
  scapegoat: {
    period: '4일차 · 입사 6주 차',
    evidence: [10, 16],
    sentences: [2, 4],
    signed: false,
    reported: false,
    maxSuspicion: 100,
  },
  accomplice: {
    period: '5일차 · 입사 8주 차',
    evidence: [12, 16],
    sentences: [3, 4],
    signed: true,
    reported: false,
    maxSuspicion: 40,
  },
}
const ENDING_LABELS = {
  '휴, 위험했다': 'safe',
  '끝내 잡지 못한 범죄조직': 'escaped',
  '서류 위의 주범': 'scapegoat',
  공범: 'accomplice',
} as const

/** 엔딩 패널 */
function useEndingTest() {
  const [ending, setEnding] = useState<EndingId | null>(null)
  useControls('엔딩', {
    결말: { value: '휴, 위험했다', options: Object.keys(ENDING_LABELS) },
    보기: button((get) => setEnding(ENDING_LABELS[get('엔딩.결말') as keyof typeof ENDING_LABELS])),
  })
  return { ending, close: () => setEnding(null) }
}

// 날짜 자료(src/data/days/dayN.ts)를 모두 읽는다. 날짜 파일이 늘어나면 여기도 저절로 늘어난다.
const DAYS = Object.values(
  import.meta.glob<Record<string, DayScript>>('/src/data/days/day*.ts', { eager: true }),
)
  .flatMap((module) => Object.values(module))
  .sort((a, b) => a.info.day - b.info.day)

const NO_GUIDE = '(없음)'
/** 자료에 적힌 안내 문구(사건의 goal) 전부. 엔진이 붙으면 엔진이 그때그때 하나를 고른다. */
const GUIDES = [
  NO_GUIDE,
  ...DAYS.flatMap((d) =>
    d.events.flatMap((e) => e.effects.flatMap((f) => (f.type === 'goal' ? [f.text] : []))),
  ),
]

/** 4번 묶음(게임 공통) 화면을 띄워 보는 패널. 엔진이 붙기 전까지 여기서 값을 바꿔 본다. */
function useCommonControls() {
  // 같은 문구도 다시 내려오게 할 때 늘리는 번호(배너를 새로 그린다)
  const [replay, setReplay] = useState(0)
  const { 안내 } = useControls('공통 화면', {
    안내: { value: GUIDES[1] ?? NO_GUIDE, options: GUIDES },
    '안내 다시 보기': button(() => setReplay((n) => n + 1)),
  })
  return { guide: 안내 === NO_GUIDE ? null : 안내, replay }
}

/** 손 그림 안에서 휴대폰 화면이 차지하는 자리. 그림 크기에 대한 비율이라 그림을 바꾸면 이 값도 바꾼다. */
const PHONE_SCREEN = { left: 0.339, top: 0.1182, width: 0.3204, height: 0.6698 }
/**
 * 휴대폰 화면이 화면 높이에서 차지할 비율. 손 그림을 이만큼 키워 휴대폰을 가까이 보이게 한다.
 * 손 그림 속 휴대폰 화면의 가운데를 화면 가운데에 맞추고, 남는 손과 소매는 화면 밖으로 잘린다.
 */
const PHONE_FILL = 0.9
const HAND_HEIGHT_VH = (PHONE_FILL / PHONE_SCREEN.height) * 100
const SCREEN_CENTER = PHONE_SCREEN.top + PHONE_SCREEN.height / 2

const panel: CSSProperties = {
  margin: 0,
  padding: '8px 12px',
  border: 0,
  borderRadius: 8,
  background: 'rgb(0 0 0 / 0.6)',
  color: '#fff',
  font: 'inherit',
}

/** 화면 가운데 점. 누를 수 있는 물건을 가리키면 커지고 무엇을 하는지 알려 준다. */
function Crosshair({ label }: { label: string | null }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        display: 'grid',
        justifyItems: 'center',
        gap: 8,
        transform: 'translate(-50%, -7px)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: label ? 14 : 6,
          height: label ? 14 : 6,
          margin: label ? 0 : 4,
          borderRadius: '50%',
          border: '2px solid rgb(0 0 0 / 0.6)',
          background: '#fff',
          // 커지고 작아지는 것을 툭 바꾸지 않고 부드럽게 보여 준다
          transition: 'width 120ms ease-out, height 120ms ease-out, margin 120ms ease-out',
        }}
      />
      {label && <span style={panel}>{label}</span>}
    </div>
  )
}

/** 휴대폰을 두 손으로 쥔 장면. 손 그림 속 화면 자리에 children(홈 화면, 앱)을 얹는다. */
function PhoneInHand({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgb(0 0 0 / 0.45)',
        backdropFilter: 'blur(6px)',
        overflow: 'hidden',
      }}
    >
      {/* 손 그림을 키워 휴대폰 화면이 화면 높이의 90%를 채우게 하고, 그 가운데를 화면 가운데에 둔다 */}
      <div
        style={{
          position: 'absolute',
          top: `calc(50vh - ${SCREEN_CENTER * HAND_HEIGHT_VH}vh)`,
          left: '50%',
          height: `${HAND_HEIGHT_VH}vh`,
          aspectRatio: '1239 / 1269',
          transform: 'translateX(-50%)',
        }}
      >
        <img
          src={HAND_URL}
          alt="두 손으로 세로로 쥔 휴대폰"
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${PHONE_SCREEN.left * 100}%`,
            top: `${PHONE_SCREEN.top * 100}%`,
            width: `${PHONE_SCREEN.width * 100}%`,
            height: `${PHONE_SCREEN.height * 100}%`,
            overflow: 'hidden',
            borderRadius: '8.8% / 4.1%',
            // PhoneScreen이 화면 너비를 390pt로 보고 크기를 맞추는 기준
            containerType: 'inline-size',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/** 실제 게임 화면처럼 보이게 평소엔 감추고, 이 키를 누르면 조작 안내와 성능 표시가 나온다 */
const HELP_KEY = { code: 'KeyH', label: 'H' }

/** 키를 누를 때마다 켜고 끈다. 글자를 입력하는 칸에서는 반응하지 않는다. */
function useToggleKey(code: string) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const toggle = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea')
      if (e.code === code && !e.repeat && !typing) setOn((v) => !v)
    }
    window.addEventListener('keydown', toggle)
    return () => window.removeEventListener('keydown', toggle)
  }, [code])
  return on
}

/**
 * 협성의 테스트 페이지. 개발 서버에서 `?sandbox=hyeopseong` 주소로 연다.
 * 주인이 자유롭게 고친다. 이 페이지만 따로 불러오므로 three·R3F·src/game을 import해도 된다.
 *
 * 방과 이동, 물건 누르기는 src/game의 GameCanvas가 하고, 무엇을 보고 있는지는 gameStore에 있다.
 * 이 페이지는 그 위에 겹치는 화면(조준점, 안내, 버튼, 손에 쥔 휴대폰, 독백)만 그린다.
 *
 * 방을 1인칭으로 걸어 다닌다. 노트북을 누르면 의자에 앉아 화면을 가득 채워 보는 시점으로 바뀐다.
 * 책상 위 휴대폰을 누르면 휴대폰을 집어 손에 쥔 장면으로 바뀌고, 책상에서는 사라진다.
 * 그 뒤로는 Q(또는 H를 눌러 나오는 오른쪽 아래 버튼)로 꺼내고, 버튼이나 Esc로 방으로 돌아온다.
 * 침대를 누르면 누워서 천장을 본다. Esc나 버튼으로 일어난다.
 */
export default function SandboxPage() {
  const { showStats } = useDetailControls()
  const { guide, replay } = useCommonControls()
  const { card, closeCard, day } = useDateCard()
  const signTest = useSignTest()
  const notebook = useNotebookTest()
  // 휴대폰 안에서 보고 있는 것. 휴대폰을 꺼낼 때마다 홈 화면부터 보인다.
  const [phoneApp, setPhoneApp] = useState<'home' | 'notes'>('home')
  const endingTest = useEndingTest()
  const { choice, choose } = useChoiceTest(signTest)
  const { mail, name, closeMail, onStage } = useMailTest()
  const help = useToggleKey(HELP_KEY.code)
  const view = useGameStore((s) => s.view)
  const hasPhone = useGameStore((s) => s.hasPhone)
  const label = useGameStore(aimLabel)
  const openView = useGameStore((s) => s.openView)
  const line = useMonologueStore((s) => s.queue[0] ?? null)
  const next = useMonologueStore((s) => s.next)

  // 방이 다 보이면 첫 독백을 한 번만 한다. 개발 모드에서 효과가 두 번 돌아도 한 번만 말하게 막는다.
  const greeted = useRef(false)
  const greet = useCallback(() => {
    if (greeted.current) return
    greeted.current = true
    useMonologueStore.getState().say('휴대폰을 어디에 뒀지...')
  }, [])

  return (
    <main style={{ position: 'fixed', inset: 0, background: '#b9c2c9' }}>
      <GameCanvas onLoad={greet} />

      {view === 'phone' && (
        <PhoneInHand>
          {phoneApp === 'notes' ? (
            <NotesApp
              time="23:12"
              cards={notebook.cards}
              sentences={notebook.sentences}
              status={notebook.status}
              onSubmit={notebook.submit}
            />
          ) : (
            <PhoneHomeTest time="23:12" onOpenNotes={() => setPhoneApp('notes')} />
          )}
        </PhoneInHand>
      )}

      {/* 휴대폰을 보는 동안에는 안내 알림과 손잡이를 감춘다(감춰도 상태는 그대로 남는다) */}
      <div style={{ display: view === 'phone' ? 'none' : 'contents' }}>
        <GuideBanner key={replay} text={guide} />
      </div>

      {/* 성능 표시(GameCanvas의 StatsGl)는 도움말 키(H)나 테스트 패널의 FPS 표시를 켰을 때만 보인다 */}
      {!help && !showStats && <style>{'.dev-stats { display: none !important; }'}</style>}

      {view === 'room' ? (
        <>
          <Crosshair label={label} />
          {help && (
            <p style={{ ...panel, position: 'absolute', left: 16, bottom: 16 }}>
              화면을 클릭하면 마우스로 둘러보고 W A S D로 걸어요. Esc를 누르면 커서가 나와요.
              <br />
              {hasPhone
                ? `가운데 점을 노트북, 침대, 스탠드, 현관 옆 스위치에 맞추고 클릭해 보세요. ${PHONE_KEY.label}를 누르면 휴대폰을 꺼내요.`
                : '가운데 점을 노트북, 휴대폰, 침대, 스탠드, 현관 옆 스위치에 맞추고 클릭해 보세요.'}
              <br />
              G를 누르면 위쪽 안내 알림을 다시 볼 수 있어요.
              <br />
              {HELP_KEY.label}를 다시 누르면 이 안내가 사라져요.
            </p>
          )}
          <Pocket
            items={
              hasPhone
                ? [
                    {
                      id: 'phone',
                      label: '휴대폰',
                      keyLabel: PHONE_KEY.label,
                      icon: <PhoneIcon />,
                      onOpen: () => openView('phone'),
                    },
                  ]
                : []
            }
          />
        </>
      ) : (
        <div style={{ position: 'absolute', left: 16, top: 16, display: 'flex', gap: 8 }}>
          <button
            type="button"
            style={{ ...panel, cursor: 'pointer' }}
            onClick={() => {
              setPhoneApp('home')
              openView('room')
            }}
          >
            {view === 'phone' ? '휴대폰 내려놓기' : '일어나기'}
          </button>
          {view === 'phone' && phoneApp !== 'home' && (
            <button
              type="button"
              style={{ ...panel, cursor: 'pointer' }}
              onClick={() => setPhoneApp('home')}
            >
              홈 화면
            </button>
          )}
        </div>
      )}

      {mail && (
        <MailCloseup
          message={mail.message}
          envelope={mail.envelope}
          name={name}
          onStage={onStage}
          onClose={closeMail}
        />
      )}

      {/* 서명 화면을 보는 동안에는 오른쪽 위 테스트 패널이 서명 완료 버튼을 가리지 않게 숨긴다 */}
      <Leva collapsed hidden={signTest.call !== null} />
      {signTest.call && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'rgb(0 0 0 / 0.7)',
          }}
        >
          <div
            style={{ width: 'min(1040px, 92vw)', height: 'min(640px, 86vh)', overflow: 'hidden' }}
          >
            <InaugurationCall
              playerName={name}
              step={signTest.call.step}
              signed={signTest.call.signed}
            >
              {signTest.call.pad && !signTest.call.signed && (
                <SignaturePad onSign={signTest.sign} />
              )}
            </InaugurationCall>
          </div>
          <button
            type="button"
            style={{ ...panel, position: 'absolute', left: 16, top: 16, cursor: 'pointer' }}
            onClick={signTest.close}
          >
            닫기 (테스트)
          </button>
        </div>
      )}

      {notebook.open && (
        <Notebook
          cards={notebook.cards}
          sentences={notebook.sentences}
          status={notebook.status}
          onSubmit={notebook.submit}
          onClose={notebook.close}
        />
      )}

      {endingTest.ending && (
        <EndingScreen
          key={endingTest.ending}
          ending={endingTest.ending}
          name={name}
          record={ENDING_SAMPLES[endingTest.ending]}
          onRestart={endingTest.close}
        />
      )}

      {/* 선택지는 화상 취임식 같은 화면 위에 뜬다 */}
      {choice && (
        <ChoiceMenu
          prompt={choice.prompt}
          choices={choice.labels.map((label, i) => ({ id: String(i + 1), label }))}
          onChoose={choose}
        />
      )}

      {/* 혼잣말은 우편물, 선택지 같은 가까이 보는 화면 위에 보인다 */}
      <Monologue line={line} onDone={next} />

      <DayBadge text={day} />

      {/* 날짜 카드는 화면 위 모든 것을 덮는다 */}
      {card && <DateCard key={card.id} text={card.text} onDone={closeCard} />}
    </main>
  )
}
