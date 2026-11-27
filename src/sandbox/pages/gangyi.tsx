import { useState } from 'react'
import type { Message } from '@/data/types'
import { PhoneCloseup } from '@/ui/kit/phone/PhoneCloseup'
import { LockScreen } from '@/ui/screens/phone/LockScreen'
import styles from './gangyi.module.css'

/**
 * 강이의 테스트 페이지. 개발 서버에서 `?sandbox=gangyi` 주소로 연다.
 * 휴대폰 화면(#35)을 하나씩 띄워 본다. 지금은 잠금 화면 알림(#49).
 */

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'] as const
type Weekday = (typeof WEEKDAYS)[number]

interface Scene {
  id: string
  label: string
  /** 입사 N주 차와 요일. 잠금 화면 날짜를 정하는 데 쓴다 */
  week: number
  weekday: Weekday
  /** 항의 문자가 쏟아질 때처럼 손이 떨리는 장면 */
  shaking?: boolean
  messages: Message[]
}

/** 견본 데이터. 문구는 대본 v1-2(docs/261126_대본_v1-2.md) 그대로다 */
const SCENES: Scene[] = [
  {
    id: 'd1s3',
    label: '1일차 장면 3',
    week: 1,
    weekday: '월', // 대본: 고객명단_월요일
    messages: [
      {
        id: 'd1-sms-hr',
        channel: 'sms',
        from: '오버레이 인사팀',
        time: '10:11',
        body: '[오버레이] {name} 님, 서류 전형 결과를 메일로 보내 드렸습니다. 확인 부탁드립니다.',
      },
    ],
  },
  {
    id: 'd2s4',
    label: '2일차 장면 4',
    week: 3,
    weekday: '수', // 대본: 고객명단_수요일
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
    id: 'd4s5',
    label: '4일차 장면 5',
    week: 6,
    weekday: '화', // 대본에 요일이 없어 임시로 정했다
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

/** 누른 알림이 여는 앱. 앱 화면은 다른 이슈(#50 문자, #51 은행)에서 만든다 */
const APP_NAMES: Partial<Record<Message['channel'], string>> = { sms: '문자 앱', bank: '은행 앱' }

// 손 이미지(협성 님 테스트 페이지와 같은 파일)와 그 안의 화면 자리. 이미지의 검은 화면 영역을 픽셀로 잰 값이다
const HAND_URL = `${import.meta.env.BASE_URL}images/hand_phone_day.webp`
const IMAGE_SIZE = { width: 1239, height: 1269 }
const SCREEN = { left: 418, top: 149, right: 818, bottom: 1000, radius: 41 }

/**
 * 플레이어의 이번 주 월요일을 입사 1주 차 월요일로 보고, 주 차와 요일에 맞는 날짜를 돌려준다.
 * 대본의 요일(1일차 월, 2일차 수, 3일차 금)과 잠금 화면 요일을 맞추기 위해서다.
 */
const dateOf = (week: number, weekday: Weekday) => {
  const date = new Date()
  const sinceMonday = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - sinceMonday + (week - 1) * 7 + WEEKDAYS.indexOf(weekday))
  return date
}

export default function SandboxPage() {
  const [sceneId, setSceneId] = useState(SCENES[0].id)
  const [arrived, setArrived] = useState(0)
  const [name, setName] = useState('홍길동')
  const [opened, setOpened] = useState('')

  const scene = SCENES.find((s) => s.id === sceneId) ?? SCENES[0]
  // 이름 바꾸기는 화면 밖에서 한다. 화면은 받은 글을 그대로 보여 준다
  const messages = scene.messages
    .slice(0, arrived)
    .map((m) => ({ ...m, body: m.body.replaceAll('{name}', name) }))
  const time = (messages.at(-1) ?? scene.messages[0]).time

  const pickScene = (id: string) => {
    setSceneId(id)
    setArrived(0)
    setOpened('')
  }

  return (
    <main>
      <PhoneCloseup
        handSrc={HAND_URL}
        imageSize={IMAGE_SIZE}
        screen={SCREEN}
        shaking={scene.shaking && arrived > 0}
      >
        <LockScreen
          time={time}
          date={dateOf(scene.week, scene.weekday)}
          messages={messages}
          onOpen={(m) =>
            setOpened(`${APP_NAMES[m.channel] ?? m.channel} 열기 (${m.from} ${m.time})`)
          }
        />
      </PhoneCloseup>

      <aside className={styles.panel}>
        <strong>잠금 화면 알림 (#49)</strong>
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
            onClick={() => setArrived((n) => n + 1)}
          >
            다음 알림 도착 ({arrived}/{scene.messages.length})
          </button>
          <button type="button" onClick={() => pickScene(scene.id)}>
            처음으로
          </button>
        </div>
        <label className={styles.row}>
          이름
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <p className={styles.log}>누른 알림: {opened || '없음'}</p>
      </aside>
    </main>
  )
}
