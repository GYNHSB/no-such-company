import { useEffect, useState } from 'react'
import type { Message } from '@/data/types'
import { CHANNELS } from '@/ui/screens/work/channelScript'
import { DAY1_MAILS, DAY5_MAILS, REJECTION_MAILS } from '@/ui/screens/work/mailScript'
import { MESSENGER_DAYS } from '@/ui/screens/work/messengerScript'
import { WebMail } from '@/ui/screens/work/WebMail'
import { WorkChannelView } from '@/ui/screens/work/WorkChannelView'
import { WorkMessenger, type MessengerDay } from '@/ui/screens/work/WorkMessenger'
import { ONBOARDING_FILES, ONBOARDING_FOLDER } from '@/ui/screens/work/onboardingFiles'
import { WorkFileComposer } from '@/ui/screens/work/WorkFileComposer'
import { WorkMailbox, type Mail } from '@/ui/screens/work/WorkMailbox'
import { DM_LEAD_ID, MAIL_ID, WORK_NAV } from '@/ui/screens/work/workNav'
import { WorkShell } from '@/ui/screens/work/WorkShell'

// 노트북 화면은 고정 해상도로 그리고 통째로 축소한다 (inae.tsx와 같은 크기)
const SCREEN_W = 1280
const SCREEN_H = 800

const TOTAL = MESSENGER_DAYS.reduce((sum, day) => sum + day.messages.length, 0)

/** 앞에서부터 count개의 메시지만 도착한 상태 */
function daysUpTo(count: number): MessengerDay[] {
  let left = count
  return MESSENGER_DAYS.map((day) => {
    const messages = day.messages.slice(0, left)
    left -= messages.length
    return { ...day, messages }
  })
}

/**
 * 성범의 테스트 페이지. 개발 서버에서 `?sandbox=seongbeom` 주소로 연다.
 * 주인이 자유롭게 고친다. 이 페이지만 따로 불러오므로 three·R3F·src/game을 import해도 된다.
 */
export default function SandboxPage() {
  const [playerName, setPlayerName] = useState('○○')
  const [count, setCount] = useState(1)
  const [clicked, setClicked] = useState('')
  const [selectedId, setSelectedId] = useState(DM_LEAD_ID)
  const [scale, setScale] = useState(1)
  // 'mail1': 1일차 개인 노트북의 메일함(브라우저 틀), 'work': 모레온 워크(5일차 메일함 포함)
  const [view, setView] = useState<'work' | 'mail1'>('work')
  const [mailCount, setMailCount] = useState(0)
  const [read, setRead] = useState<string[]>([])
  // 입사 서류(#39): 입력창에서 첨부해 보낸 파일 묶음. 보낼 때마다 내 메시지가 하나 생긴다
  const [sent, setSent] = useState<string[][]>([])
  const sentMessages: Message[] = sent.map((ids, index) => ({
    id: `m_sent_${index + 1}`,
    channel: 'messenger',
    from: '{name}',
    time: '14:05',
    // 메신저가 [이름] 줄을 카드로 그리므로 보낸 파일도 같은 모양으로 보인다
    body: ONBOARDING_FILES.filter((file) => ids.includes(file.id))
      .map((file) => `[${file.name}] ${file.kind} · ${file.size}`)
      .join('\n'),
  }))

  const withUnread = (mails: readonly Mail[]) =>
    mails.map((mail) => ({ ...mail, unread: !read.includes(mail.id) }))
  const mailProps = {
    playerName,
    onOpen: (id: string) => {
      setRead((ids) => [...ids, id])
      setClicked(`메일 열기 · ${id}`)
    },
    onAction: setClicked,
  }

  useEffect(() => {
    const fit = () =>
      setScale(Math.min((innerWidth * 0.9) / SCREEN_W, (innerHeight * 0.8) / SCREEN_H))
    fit()
    addEventListener('resize', fit)
    return () => removeEventListener('resize', fit)
  }, [])

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        gap: 12,
        padding: 12,
        background: 'var(--game-bg)',
        color: 'var(--game-ink)',
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" disabled={view === 'work'} onClick={() => setView('work')}>
          모레온 워크 (#37 · #38 5일차)
        </button>
        <button type="button" disabled={view === 'mail1'} onClick={() => setView('mail1')}>
          1일차 메일함 (#38)
        </button>
        <label>
          이름 <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} />
        </label>
        {view === 'work' ? (
          <>
            <button
              type="button"
              onClick={() => {
                setCount(1)
                setSent([])
              }}
            >
              처음부터
            </button>
            <button
              type="button"
              disabled={count >= TOTAL}
              onClick={() => setCount((value) => value + 1)}
            >
              다음 메시지 ({count}/{TOTAL})
            </button>
            <button type="button" onClick={() => setCount(TOTAL)}>
              전부 보기
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setMailCount(0)}>
              처음부터
            </button>
            <button
              type="button"
              disabled={mailCount >= DAY1_MAILS.length}
              onClick={() => setMailCount((value) => value + 1)}
            >
              다음 메일 ({mailCount}/{DAY1_MAILS.length})
            </button>
          </>
        )}
        <span>누른 것: {clicked || '없음'}</span>
      </div>

      <div style={{ width: SCREEN_W * scale, height: SCREEN_H * scale }}>
        <div
          style={{
            width: SCREEN_W,
            height: SCREEN_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {view === 'mail1' ? (
            <WebMail
              mails={[...withUnread(DAY1_MAILS.slice(0, mailCount)).reverse(), ...REJECTION_MAILS]}
              {...mailProps}
            />
          ) : (
            <WorkShell selectedId={selectedId} onSelect={setSelectedId}>
              {selectedId === MAIL_ID ? (
                <WorkMailbox mails={withUnread(DAY5_MAILS)} {...mailProps} />
              ) : selectedId === DM_LEAD_ID ? (
                <WorkMessenger
                  name="김아영 팀장"
                  days={daysUpTo(count).map((day, index) =>
                    index === 0 ? { ...day, messages: [...day.messages, ...sentMessages] } : day,
                  )}
                  playerName={playerName}
                  onOpenTask={(task, message) => setClicked(`${message.id} · ${task.label}`)}
                  composer={
                    <WorkFileComposer
                      files={ONBOARDING_FILES}
                      folder={ONBOARDING_FOLDER}
                      required={ONBOARDING_FILES.map((file) => file.id)}
                      placeholder="김아영 팀장에게 메시지 보내기"
                      onSend={(ids) => {
                        setSent((all) => [...all, ids])
                        setClicked(`서류 보내기 · ${ids.join(', ')}`)
                      }}
                    />
                  }
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
          )}
        </div>
      </div>
    </main>
  )
}
