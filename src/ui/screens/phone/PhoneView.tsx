import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { dateOfDay, usePhoneStore } from '@/stores/phoneStore'
import { useStoryStore } from '@/stores/storyStore'
import { PhoneCloseup } from '@/ui/kit/phone/PhoneCloseup'
import { useFlowingClock } from './clock'
import {
  HAND_SINK,
  HAND_URL,
  IMAGE_SIZE,
  interviewRecording,
  RECORDING,
  SCREEN,
  seedCalls,
} from './phoneContent'
import { PhoneDevice } from './PhoneDevice'

/** 아직 아무 문자도 없을 때 시계가 시작하는 시각 */
const MORNING = '09:58'

/**
 * 본편에서 휴대폰을 볼 때의 클로즈업. 뒤로는 방금까지 보던 방이 흐리게 비친다.
 * 받은 메시지와 읽음은 phoneStore에 있고, 메시지를 넣는 건 storyStore(엔진)가 한다.
 * 어느 화면을 그릴지는 PhoneDevice가 정한다. 테스트 페이지(?sandbox=gangyi)도 같은 것을 쓴다.
 */
export function PhoneView() {
  const name = useGameStore((s) => s.playerName)
  const script = useStoryStore((s) => s.script)
  const evidence = useStoryStore((s) => s.story.evidence)
  const received = usePhoneStore((s) => s.received)
  const weekOne = usePhoneStore((s) => s.weekOne)
  const { info } = script

  const time = useFlowingClock(received.at(-1)?.message.time ?? MORNING)

  // shortcut: 통화 기록 견본을 넣어 줄 곳이 엔진에 없다. 새로 시작한 뒤 휴대폰을 처음 볼 때 그날 기준으로 넣는다
  useEffect(() => {
    if (usePhoneStore.getState().calls.length === 0) seedCalls(dateOfDay(weekOne, info), info.day)
  }, [weekOne, info])

  return (
    <PhoneCloseup
      handSrc={HAND_URL}
      imageSize={IMAGE_SIZE}
      screen={SCREEN}
      sink={HAND_SINK}
      backdrop="blur"
    >
      <PhoneDevice
        time={time}
        info={info}
        name={name}
        // 면접 녹화는 1일차 면접에서 증거로 얻은 뒤에 사진 앱에 생긴다
        videos={evidence.includes(RECORDING.id) ? [interviewRecording(weekOne, name)] : []}
        notes={{
          cards: script.evidence.filter((card) => evidence.includes(card.id)),
          sentences: script.sentences,
          // shortcut: 빈칸 문장의 판정을 엔진에 넘기는 길이 아직 없다. 화면의 신호를 엔진에 잇는 일에서 한다
          status: {},
          onSubmit: () => {},
        }}
      />
    </PhoneCloseup>
  )
}
