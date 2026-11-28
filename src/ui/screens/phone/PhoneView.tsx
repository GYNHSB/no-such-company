import { useEffect } from 'react'
import { phoneSignalsOf, type PhoneEvent } from '@/engine/phoneSignal'
import { unlockedIn } from '@/engine/phoneUnlock'
import { sentenceResult } from '@/engine/story'
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
 * 휴대폰에서 한 일(읽음, 영상 재생, 검색, 전화 등)은 신호 이름으로 바꿔 엔진에 알리고, 빈칸 문장도 엔진이 판정한다.
 * 어느 화면을 그릴지는 PhoneDevice가 정한다. 테스트 페이지(?sandbox=gangyi)도 같은 것을 쓴다.
 */
export function PhoneView() {
  const name = useGameStore((s) => s.playerName)
  const script = useStoryStore((s) => s.script)
  const story = useStoryStore((s) => s.story)
  const send = useStoryStore((s) => s.send)
  const submit = useStoryStore((s) => s.submit)
  const { evidence } = story
  const received = usePhoneStore((s) => s.received)
  const weekOne = usePhoneStore((s) => s.weekOne)
  const { info } = script

  const time = useFlowingClock(received.at(-1)?.message.time ?? MORNING)

  // shortcut: 통화 기록 견본을 넣어 줄 곳이 엔진에 없다. 새로 시작한 뒤 휴대폰을 처음 볼 때 그날 기준으로 넣는다
  useEffect(() => {
    if (usePhoneStore.getState().calls.length === 0) seedCalls(dateOfDay(weekOne, info), info.day)
  }, [weekOne, info])

  /** 오늘까지 열린 빈칸 문장 */
  const sentences = script.sentences.filter((sentence) => sentence.day <= story.day)
  const notify = (event: PhoneEvent) => {
    for (const objectId of phoneSignalsOf(event)) send({ type: 'interact', objectId })
  }

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
          sentences,
          status: Object.fromEntries(sentences.map((s) => [s.id, sentenceResult(story, s.id)])),
          onSubmit: submit,
        }}
        // 블라블라 앱과 원격 관리 페이지는 대본의 사건이 열어 준 뒤에 생긴다
        unlocked={unlockedIn(story.flags)}
        onEvent={notify}
      />
    </PhoneCloseup>
  )
}
