import { useState } from 'react'
import type { DayInfo, Message } from '@/data/types'
import { CHANNELS } from './channelScript'
import { ONBOARDING_FILES, ONBOARDING_FOLDER } from './onboardingFiles'
import { PROOFREAD_LABEL, PROOFREADS, fixTypo } from './proofread'
import { WorkChannelView } from './WorkChannelView'
import { WorkFileComposer } from './WorkFileComposer'
import { WorkMailbox } from './WorkMailbox'
import { WorkMessenger } from './WorkMessenger'
import { DM_LEAD_ID, MAIL_ID, WORK_NAV } from './workNav'
import { WorkProofread } from './WorkProofread'
import { WorkShell } from './WorkShell'
import { WorkVideoCapture } from './WorkVideoCapture'

interface Props {
  info: DayInfo
  /** 팀장에게 받은 메신저 메시지. 도착한 순서대로 */
  messages: readonly Message[]
  playerName: string
  /** 입사 서류를 보냈는지 */
  docsSent: boolean
  /** 본인 확인 영상을 보냈는지 */
  videoSent: boolean
  /** 서류 보내기(`btn_work_send`), 영상 보내기(`btn_work_video_send`)를 눌렀을 때 그 버튼 id */
  onPress: (buttonId: string) => void
}

/** 내가 보낸 메시지. 메신저가 [이름] 줄을 파일 카드로 그린다 */
const mine = (id: string, time: string, body: string): Message => ({
  id,
  channel: 'messenger',
  from: '{name}',
  time,
  body,
})
const DOCS_SENT = mine(
  'm_sent_docs',
  '14:05',
  ONBOARDING_FILES.map((f) => `[${f.name}] ${f.kind} · ${f.size}`).join('\n'),
)
const VIDEO_SENT = mine('m_sent_video', '14:22', '[본인확인_영상.mp4] 동영상 · 0:15')

/**
 * 본편 업무용 노트북의 모레온 워크. 팀장 DM에서 입사 서류와 본인 확인 영상을 보내고 안내문을 검수한다.
 * 메시지가 언제 오는지는 엔진이 정하고, 이 화면은 받은 것을 그리고 누른 버튼을 알리기만 한다.
 */
export function WorkScreen({ info, messages, playerName, docsSent, videoSent, onPress }: Props) {
  const [selectedId, setSelectedId] = useState(DM_LEAD_ID)
  const [proofreadDone, setProofreadDone] = useState<string[]>([])
  const [proofreading, setProofreading] = useState<{ id: string; sentence: string } | null>(null)

  const lastId = messages.at(-1)?.id
  const shown = messages.flatMap((m) => {
    const body = proofreadDone.includes(m.id) ? fixTypo(m.body, PROOFREADS[m.id]) : m.body
    const after =
      m.id === 'm_docs' && docsSent
        ? [DOCS_SENT]
        : m.id === 'm_face' && videoSent
          ? [VIDEO_SENT]
          : []
    return [{ ...m, body }, ...after]
  })

  const composer = proofreading ? (
    <WorkProofread
      key={proofreading.id}
      sentence={proofreading.sentence}
      proofread={PROOFREADS[proofreading.id]}
      onDone={() => {
        setProofreadDone((ids) => [...ids, proofreading.id])
        setProofreading(null)
      }}
    />
  ) : lastId === 'm_face' && !videoSent ? (
    <WorkVideoCapture onSend={() => onPress('btn_work_video_send')} />
  ) : lastId === 'm_docs' && !docsSent ? (
    <WorkFileComposer
      files={ONBOARDING_FILES}
      folder={ONBOARDING_FOLDER}
      required={ONBOARDING_FILES.map((f) => f.id)}
      placeholder="김아영 팀장에게 메시지 보내기"
      onSend={() => onPress('btn_work_send')}
    />
  ) : undefined

  return (
    <WorkShell selectedId={selectedId} onSelect={setSelectedId}>
      {selectedId === MAIL_ID ? (
        <WorkMailbox mails={[]} playerName={playerName} />
      ) : selectedId === DM_LEAD_ID ? (
        <WorkMessenger
          name="김아영 팀장"
          days={[{ info, messages: shown }]}
          playerName={playerName}
          isTaskDone={(task, m) => task.label === PROOFREAD_LABEL && proofreadDone.includes(m.id)}
          onOpenTask={(task, m) => {
            const canProofread =
              task.label === PROOFREAD_LABEL && m.id in PROOFREADS && !proofreadDone.includes(m.id)
            if (canProofread) setProofreading({ id: m.id, sentence: task.content })
          }}
          composer={composer}
        />
      ) : (
        <WorkChannelView
          name={`# ${WORK_NAV.find((item) => item.id === selectedId)?.label}`}
          topic={CHANNELS[selectedId]?.topic}
          messages={CHANNELS[selectedId]?.messages ?? []}
          playerName={playerName}
        />
      )}
    </WorkShell>
  )
}
