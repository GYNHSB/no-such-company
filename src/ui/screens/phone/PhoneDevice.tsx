import { useEffect, useRef, useState } from 'react'
import { day1 } from '@/data/days/day1'
import type { BlankSentence, DayInfo, EvidenceCard, Message } from '@/data/types'
import {
  dateOfDay,
  lockNotifications,
  messagesOf,
  type PhoneApp,
  usePhoneStore,
} from '@/stores/phoneStore'
import type { SentenceStatus } from '@/ui/screens/common/Notebook'
import { INVITE_SENDER_ADDRESS } from '@/ui/screens/work/mailScript'
import { BankApp } from './BankApp'
import { BlablaApp } from './BlablaApp'
import { BrowserApp } from './BrowserApp'
import { CallApp } from './CallApp'
import { type HomeApp, HomeScreen } from './HomeScreen'
import { LockScreen } from './LockScreen'
import { MessagesApp } from './MessagesApp'
import { NotesApp } from './NotesApp'
import {
  accountsFrom,
  BANK,
  BLABLA,
  BLABLA_FROM_DAY,
  BLABLA_POSTS,
  BLABLA_SUGGESTIONS,
  CARDS,
  CARRIER,
  CONTACTS,
  MY_COMPANY,
  REMOTE,
  REPORT_NUMBERS,
  SEARCH_SITE,
  SNS,
  SNS_POSTS,
} from './phoneContent'
import { PhotosApp, type PhotoVideo } from './PhotosApp'
import { RemoteAdminPage } from './RemoteAdminPage'
import { SnsApp } from './SnsApp'

/** 휴대폰 화면에서 플레이어가 한 일. 받는 쪽(엔진, 테스트 페이지)이 이걸 보고 다음 일을 정한다 */
export type PhoneEvent =
  /** 잠금 화면에서 알림을 눌렀다 */
  | { type: 'openNotification'; message: Message }
  /** 문자나 은행 알림이 화면에 보였다 */
  | { type: 'read'; ids: string[] }
  /** 전화를 걸었다. 숫자만 온다 */
  | { type: 'call'; number: string }
  /** 건 전화가 연결됐다 */
  | { type: 'callConnected'; number: string }
  | { type: 'hangUp'; number: string }
  /** 사진 앱에서 영상을 재생하기 시작했다, 끝까지 봤다 */
  | { type: 'playVideo'; id: string }
  | { type: 'endVideo'; id: string }
  /** SNS 게시물의 사진이 보였다. index는 0부터 */
  | { type: 'seePhoto'; postId: string; index: number }
  /** 블라블라나 인터넷에서 검색했다 */
  | { type: 'search'; app: 'blabla' | 'browser'; query: string }
  /** 블라블라 글 본문을 열었다 */
  | { type: 'readPost'; id: string }
  /** 원격 관리 프로그램의 기기 정보 페이지가 보였다 */
  | { type: 'seeRemoteAdmin' }

interface Props {
  /** 지금 시각 "10:11" */
  time: string
  /** 오늘이 몇 일차인지 */
  info: DayInfo
  /** 플레이어가 입력한 이름. 글 속의 {name} 자리에 들어간다 */
  name: string
  /** 사진 앱에 들어 있는 영상. 면접을 보기 전에는 비워서 넘긴다 */
  videos: PhotoVideo[]
  /** 메모 앱에 넘길 것. 맞춰 보기의 판정은 받는 쪽이 한다 */
  notes: {
    cards: EvidenceCard[]
    sentences: BlankSentence[]
    status: Record<string, SentenceStatus | undefined>
    onSubmit: (sentenceId: string, cardIds: string[]) => void
  }
  onEvent?: (event: PhoneEvent) => void
}

/** 전화를 건 뒤 신고처가 받을 때까지의 시간(ms) */
const ANSWER_MS = 2000

/**
 * 휴대폰 화면 하나를 골라 그린다. 잠금 화면, 홈 화면, 그리고 앱들.
 * 어느 화면이 떠 있는지, 받은 메시지, 읽음, 통화 기록은 phoneStore에 있고, 앱에 들어가는 내용은 phoneContent에 있다.
 * PhoneCloseup(손 이미지) 안에 넣어 쓴다. 본편(PhoneView)과 테스트 페이지가 함께 쓴다.
 */
export function PhoneDevice({ time, info, name, videos, notes, onEvent }: Props) {
  const received = usePhoneStore((s) => s.received)
  const readIds = usePhoneStore((s) => s.readIds)
  const calls = usePhoneStore((s) => s.calls)
  const app = usePhoneStore((s) => s.app)
  const thread = usePhoneStore((s) => s.thread)
  const weekOne = usePhoneStore((s) => s.weekOne)
  const markRead = usePhoneStore((s) => s.markRead)
  const logCall = usePhoneStore((s) => s.logCall)
  const openApp = usePhoneStore((s) => s.openApp)

  // shortcut: 건 전화가 연결됐는지는 엔진이 정해야 한다. 그 전까지는 신고처 번호만 잠시 뒤에 연결된 것으로 친다
  const [connected, setConnected] = useState(false)
  const answer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(answer.current), [])

  const today = dateOfDay(weekOne, info)
  const fill = (text: string) => text.replaceAll('{name}', name)
  // 이름 바꾸기는 화면에 넘길 때 한다. 스토어에는 대본 그대로({name}) 들어 있다
  const withName = <T extends Message>(m: T): T => ({ ...m, body: fill(m.body) })
  const texts = messagesOf(received, weekOne, 'sms')
  const notices = messagesOf(received, weekOne, 'bank')
  const unread = (list: Message[]) => list.filter((m) => !readIds.includes(m.id)).length
  const goHome = () => openApp('home')
  const read = (ids: string[]) => {
    markRead(ids)
    onEvent?.({ type: 'read', ids })
  }

  // 홈 화면에는 화면이 있는 앱만 놓는다. 블라블라는 입사한 뒤(2일차부터)에 생긴다
  const apps: HomeApp<PhoneApp>[] = [
    { id: 'photos', label: '사진', icon: 'photos' },
    { id: 'sns', label: SNS, icon: 'sns' },
    ...(info.day >= BLABLA_FROM_DAY
      ? [{ id: 'blabla' as const, label: BLABLA, icon: 'blabla' as const }]
      : []),
    { id: 'notes', label: '메모', icon: 'notes' },
    { id: 'bank', label: BANK, icon: 'bank', badge: unread(notices) },
  ]
  const dock: HomeApp<PhoneApp>[] = [
    { id: 'phone', label: '전화', icon: 'phone' },
    { id: 'messages', label: '메시지', icon: 'message', badge: unread(texts) },
    { id: 'browser', label: '인터넷', icon: 'browser' },
  ]

  switch (app) {
    case 'lock':
      return (
        <LockScreen
          time={time}
          carrier={CARRIER}
          date={today}
          messages={lockNotifications(received, readIds, info.day).map(withName)}
          onOpen={(message) => {
            onEvent?.({ type: 'openNotification', message })
            if (message.channel === 'sms') openApp('messages', message.from)
            if (message.channel === 'bank') {
              // 누른 알림은 읽은 것으로 친다. 나머지는 은행 앱의 알림 탭에서 읽는다
              read([message.id])
              openApp('bank')
            }
          }}
          onUnlock={goHome}
        />
      )
    case 'messages':
      return (
        <MessagesApp
          key={thread ?? ''}
          time={time}
          today={today}
          messages={texts.map(withName)}
          readIds={readIds}
          onRead={read}
          defaultThread={thread ?? undefined}
          onHome={goHome}
        />
      )
    case 'bank':
      return (
        <BankApp
          time={time}
          today={today}
          bank={BANK}
          owner={name}
          accounts={accountsFrom(notices)}
          cards={CARDS}
          notices={notices.map(withName)}
          readIds={readIds}
          onRead={read}
          onHome={goHome}
        />
      )
    case 'photos':
      return (
        <PhotosApp
          time={time}
          today={today}
          videos={videos}
          onPlay={(id) => onEvent?.({ type: 'playVideo', id })}
          onEnded={(id) => onEvent?.({ type: 'endVideo', id })}
          onHome={goHome}
        />
      )
    case 'sns':
      return (
        <SnsApp
          time={time}
          app={SNS}
          author={name}
          followers={23}
          following={41}
          posts={SNS_POSTS}
          onSeePhoto={(postId, index) => onEvent?.({ type: 'seePhoto', postId, index })}
          onHome={goHome}
        />
      )
    case 'blabla':
      return (
        <BlablaApp
          time={time}
          app={BLABLA}
          myCompany={MY_COMPANY}
          posts={BLABLA_POSTS}
          suggestions={BLABLA_SUGGESTIONS}
          onSearch={(query) => onEvent?.({ type: 'search', app: 'blabla', query })}
          onRead={(id) => onEvent?.({ type: 'readPost', id })}
          onHome={goHome}
        />
      )
    case 'browser':
      return (
        <BrowserApp
          time={time}
          search={SEARCH_SITE}
          sites={[
            {
              id: 'remote',
              title: REMOTE.program,
              address: REMOTE.address,
              description: '이 계정에 등록된 기기와 관리자 계정을 확인합니다.',
              content: (
                <RemoteAdminPage
                  program={REMOTE.program}
                  devices={[
                    { name: `${name}의 노트북`, kind: 'laptop' },
                    { name: `${name}의 휴대폰`, kind: 'phone' },
                  ]}
                  admin={INVITE_SENDER_ADDRESS}
                  registeredOn={dateOfDay(weekOne, day1.info)}
                  permissions={REMOTE.permissions}
                  onSee={() => onEvent?.({ type: 'seeRemoteAdmin' })}
                />
              ),
            },
          ]}
          onSearch={(query) => onEvent?.({ type: 'search', app: 'browser', query })}
          onHome={goHome}
        />
      )
    case 'phone':
      return (
        <CallApp
          time={time}
          today={today}
          contacts={CONTACTS}
          calls={calls}
          connected={connected}
          onCall={(number) => {
            // 건 전화를 통화 기록에 남긴다
            logCall({ number, kind: 'out', date: today, time })
            setConnected(false)
            onEvent?.({ type: 'call', number })
            if (REPORT_NUMBERS.includes(number)) {
              answer.current = setTimeout(() => {
                setConnected(true)
                onEvent?.({ type: 'callConnected', number })
              }, ANSWER_MS)
            }
          }}
          onHangUp={(number) => {
            clearTimeout(answer.current)
            setConnected(false)
            onEvent?.({ type: 'hangUp', number })
          }}
          onHome={goHome}
        />
      )
    case 'notes':
      return (
        <NotesApp
          time={time}
          cards={notes.cards.map((card) => ({ ...card, detail: fill(card.detail) }))}
          sentences={notes.sentences}
          status={notes.status}
          onSubmit={notes.onSubmit}
          onHome={goHome}
        />
      )
    case 'home':
      return <HomeScreen time={time} apps={apps} dock={dock} onOpen={(id) => openApp(id)} />
  }
}
