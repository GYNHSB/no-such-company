import type { Message } from '@/data/types'
import { useGameStore } from '@/stores/gameStore'
import { dateOfDay, lockNotifications, messagesOf, usePhoneStore } from '@/stores/phoneStore'
import { useStoryStore } from '@/stores/storyStore'
import { PhoneCloseup } from '@/ui/kit/phone/PhoneCloseup'
import { useFlowingClock } from './clock'
import { HomeScreen } from './HomeScreen'
import { LockScreen } from './LockScreen'
import { MessagesApp } from './MessagesApp'

// 손 이미지와 그 안의 화면 자리(px). gangyi 테스트 페이지와 같은 값이다
const HAND_URL = `${import.meta.env.BASE_URL}images/hand_phone_day.webp`
const IMAGE_SIZE = { width: 1239, height: 1269 }
const SCREEN = { left: 418, top: 149, right: 818, bottom: 1000, radius: 41 }
const CARRIER = 'DT'
/** 아직 아무 문자도 없을 때 시계가 시작하는 시각 */
const MORNING = '09:58'

/**
 * 본편에서 휴대폰을 볼 때의 클로즈업. 잠금 화면 → 홈 → 문자 앱.
 * 받은 메시지와 읽음은 phoneStore에 있고, 메시지를 넣는 건 storyStore(엔진)가 한다.
 * shortcut: 1일차에 쓰는 문자 앱만 홈에 놓았다. 은행·메모 앱은 그 앱이 나오는 날을 이을 때 더한다.
 */
export function PhoneView() {
  const name = useGameStore((s) => s.playerName)
  const info = useStoryStore((s) => s.script.info)
  const received = usePhoneStore((s) => s.received)
  const readIds = usePhoneStore((s) => s.readIds)
  const app = usePhoneStore((s) => s.app)
  const thread = usePhoneStore((s) => s.thread)
  const weekOne = usePhoneStore((s) => s.weekOne)
  const markRead = usePhoneStore((s) => s.markRead)
  const openApp = usePhoneStore((s) => s.openApp)

  const today = dateOfDay(weekOne, info)
  const texts = messagesOf(received, weekOne, 'sms')
  const withName = <T extends Message>(m: T): T => ({
    ...m,
    body: m.body.replaceAll('{name}', name),
  })
  const time = useFlowingClock(received.at(-1)?.message.time ?? MORNING)
  const goHome = () => openApp('home')

  return (
    <PhoneCloseup handSrc={HAND_URL} imageSize={IMAGE_SIZE} screen={SCREEN}>
      {app === 'lock' ? (
        <LockScreen
          time={time}
          carrier={CARRIER}
          date={today}
          messages={lockNotifications(received, readIds, info.day).map(withName)}
          onOpen={(m) => m.channel === 'sms' && openApp('messages', m.from)}
          onUnlock={goHome}
        />
      ) : app === 'messages' ? (
        <MessagesApp
          key={thread ?? ''}
          time={time}
          today={today}
          messages={texts.map(withName)}
          readIds={readIds}
          onRead={markRead}
          defaultThread={thread ?? undefined}
          onHome={goHome}
        />
      ) : (
        <HomeScreen
          time={time}
          apps={[]}
          dock={[
            {
              id: 'messages',
              label: '메시지',
              icon: 'message',
              badge: texts.filter((m) => !readIds.includes(m.id)).length,
            },
          ]}
          onOpen={(id) => openApp(id)}
        />
      )}
    </PhoneCloseup>
  )
}
