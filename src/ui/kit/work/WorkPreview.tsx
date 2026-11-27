import { useState } from 'react'
import type { Choice } from '../../../data/types'
import { WorkChannel, type WorkChannelMessage } from './WorkChannel'
import { WorkComposer } from './WorkComposer'
import { WorkLayout, type WorkNavItem } from './WorkLayout'
import { WorkMail, type WorkMailItem } from './WorkMail'

// 확인용 미리보기. 데이터는 예시이고 게임 대본(src/data)과 무관하다.

const REJECT_OPENING = '안녕하세요. 저희 회사에 관심을 가지고 지원해 주셔서 감사합니다.'

const MAILS: WorkMailItem[] = [
  {
    id: 'offer',
    from: '오버레이 인사팀',
    subject: '[오버레이] 최종 합격을 축하드립니다',
    time: '10:12',
    body: '{name} 님, 최종 합격을 축하드립니다.\n입사 안내는 오버레이 워크로 드리겠습니다.',
    unread: true,
  },
  ...['한빛데이터', '누리소프트', '마루커머스', '다온랩스', '세솔물류'].map((company, i) => ({
    id: `reject_${i + 1}`,
    from: `${company} 채용팀`,
    subject: `[${company}] 서류 전형 결과 안내`,
    time: `11월 ${20 - i}일`,
    body: `${REJECT_OPENING}\n아쉽게도 이번에는 함께하지 못하게 되었습니다.`,
  })),
]

const DM_MESSAGES: WorkChannelMessage[] = [
  {
    id: 'd1',
    name: '박재훈 팀장',
    time: '오후 2:02',
    text: '{name} 씨 환영해요! 노트북 받으셨죠?',
  },
  {
    id: 'd2',
    name: '박재훈 팀장',
    time: '오후 2:02',
    text: '입사 서류(신분증 사본, 등본, 통장 사본) 여기 올려주세요 :)',
    continued: true,
  },
  {
    id: 'd3',
    name: '박재훈 팀장',
    time: '오후 2:20',
    text: '보안 정책상 본인 확인 영상도 필요해요. 정면 5초, 왼쪽 5초, 오른쪽 5초!',
  },
]

const CHOICES: Choice[] = [
  { id: 'send_now', label: '네, 바로 보낼게요', effects: [] },
  { id: 'ask_why', label: '어디에 쓰이는 건가요?', effects: [] },
]

export function WorkPreview() {
  const [selectedId, setSelectedId] = useState('dm_park')
  const [mails, setMails] = useState(MAILS)
  const [openMailId, setOpenMailId] = useState<string | null>(null)
  const [messages, setMessages] = useState(DM_MESSAGES)
  const [answered, setAnswered] = useState(false)

  const unreadMail = mails.filter((mail) => mail.unread).length
  const items: WorkNavItem[] = [
    { id: 'notice', label: '공지', kind: 'channel', unread: 1 },
    { id: 'work', label: '업무', kind: 'channel' },
    { id: 'dm_park', label: '박재훈 팀장', kind: 'dm', unread: answered ? 0 : 3 },
    { id: 'mail', label: '받은 메일함', kind: 'mail', unread: unreadMail },
  ]

  const choose = (choice: Choice) => {
    setAnswered(true)
    setMessages((list) => [
      ...list,
      { id: `me_${choice.id}`, name: '{name}', time: '오후 2:21', text: choice.label },
    ])
  }

  return (
    <WorkLayout items={items} selectedId={selectedId} onSelect={setSelectedId}>
      {selectedId === 'mail' ? (
        <WorkMail
          mails={mails}
          openId={openMailId}
          onOpen={(id) => {
            setOpenMailId(id)
            setMails((list) => list.map((m) => (m.id === id ? { ...m, unread: false } : m)))
          }}
          onBack={() => setOpenMailId(null)}
        />
      ) : selectedId === 'dm_park' ? (
        <WorkChannel
          name="박재훈 팀장"
          messages={messages}
          composer={
            <WorkComposer
              choices={answered ? undefined : CHOICES}
              prompt="답장을 고르세요"
              onChoose={choose}
            />
          }
        />
      ) : (
        <WorkChannel
          name={selectedId === 'notice' ? '# 공지' : '# 업무'}
          messages={[]}
          composer={<WorkComposer />}
        />
      )}
    </WorkLayout>
  )
}
