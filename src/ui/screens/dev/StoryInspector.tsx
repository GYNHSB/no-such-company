import { useEffect, useState, type ReactNode } from 'react'
import type { DayScript } from '@/data/types'
import { balanceOf, entriesOf } from '@/engine/bank'
import { unlockedIn, type PhoneFeature } from '@/engine/phoneUnlock'
import { sentenceResult, type StoryState } from '@/engine/story'
import { useGameStore, type View } from '@/stores/gameStore'
import { isBrowserSite, useLaptopStore } from '@/stores/laptopStore'
import { useMonologueStore } from '@/stores/monologueStore'
import { usePhoneStore } from '@/stores/phoneStore'
import { useStoryLog } from '@/stores/storyLog'
import { nextDayOf, useStoryStore } from '@/stores/storyStore'
import { balanceRange, meaning } from './describe'
import { ScriptTimeline } from './ScriptTimeline'
import styles from './StoryInspector.module.css'

/** 패널을 여닫는 키. 숫자 1 왼쪽의 ` 키다 */
const TOGGLE_KEY = { code: 'Backquote', label: '`' }
/** 열어 둔 채로 새로 고쳐도 열려 있게 브라우저에 적어 둔다 */
const REMEMBER = 'story-inspector-open'

/** 패널의 탭. state: 지금 엔진과 스토어에 든 값, script: 대본에 적힌 사건의 순서 */
type Tab = 'state' | 'script'

const VIEW_LABELS: Record<View, string> = {
  room: '방 (걸어 다니는 중)',
  seat: '의자에 앉음',
  laptop: '노트북 화면',
  phone: '휴대폰',
  bed: '침대에 누움',
}

const FEATURE_LABELS: Record<PhoneFeature, string> = {
  blabla: '블라블라 앱',
  remote_admin: '원격 관리 페이지',
}

const RESULT_LABELS = { solved: '맞춤', wrong: '틀림', locked: '오늘은 잠김' }

const yes = (value: boolean) => (value ? '예' : '아니오')

/** 엔진이 다음에 기다리는 것. 아직 실행하지 않은 사건 가운데 지금 일어날 수 있는 것만 고른다 */
function waiting(story: StoryState, script: DayScript) {
  const list: { id: string; need: string; hint: string }[] = []
  for (const event of script.events) {
    if (story.fired.includes(event.id)) continue
    const t = event.trigger
    if (t.type === 'interact') {
      if (t.after && !story.fired.includes(t.after)) continue
      // 여러 개를 적은 사건은 그 가운데 하나만 와도 된다. 하나씩 따로 보여 준다
      for (const objectId of [t.objectId].flat()) {
        list.push({ id: event.id, need: objectId, hint: meaning(objectId) })
      }
    } else if (t.type === 'afterEvent') {
      if (!story.fired.includes(t.eventId)) continue
      list.push({ id: event.id, need: `${t.delaySec ?? 0}초 뒤 저절로`, hint: '기다리면 일어난다' })
    } else if (t.type === 'evidenceCollected') {
      list.push({ id: event.id, need: `증거 ${t.cardId} 획득`, hint: '그 증거를 얻으면 일어난다' })
    } else if (t.type === 'balance') {
      list.push({
        id: event.id,
        need: `계좌 ${t.accountId} 잔액 ${balanceRange(t)}`,
        hint: '잔액이 그렇게 되면 일어난다',
      })
    } else if (t.type === 'sentenceSolved') {
      list.push({
        id: event.id,
        need: `문장 ${t.sentenceId} 맞춤`,
        hint: '메모 앱에서 맞추면 일어난다',
      })
    }
  }
  return list
}

function Section({
  title,
  about,
  children,
}: {
  title: string
  about: string
  children: ReactNode
}) {
  return (
    <details className={styles.section} open>
      <summary>{title}</summary>
      <p className={styles.about}>{about}</p>
      {children}
    </details>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/** 값이 여럿일 때 한 줄에 하나씩. 없으면 "없음" */
function List({ items }: { items: ReactNode[] }) {
  if (items.length === 0) return <span className={styles.none}>없음</span>
  return (
    <ul className={styles.list}>
      {items.map((item, i) => (
        // 순서가 바뀌지 않는 목록이라 자리 번호를 key로 쓴다
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

/**
 * 개발 모드에서만 보이는 "엔진 보기" 패널. 게임을 하면서 안에서 무슨 일이 일어나는지 보여 준다.
 * - 방금 엔진에 알린 일과, 그 결과 실행된 대본의 사건
 * - 엔진이 지금 기다리는 것(다음에 무엇을 하면 진행되는지)
 * - 엔진과 각 스토어에 저장된 값
 * 보기만 하고 값을 바꾸지 않는다. 배포판에는 들어가지 않는다(GameCanvas가 개발 모드에서만 불러온다).
 */
export default function StoryInspector() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER) === '1'
    } catch {
      return false
    }
  })
  const [tab, setTab] = useState<Tab>('state')
  const story = useStoryStore((s) => s.story)
  const script = useStoryStore((s) => s.script)
  const days = useStoryStore((s) => s.days)
  const nextDay = nextDayOf({ days, script })
  const entries = useStoryLog((s) => s.entries)
  const game = useGameStore()
  const phone = usePhoneStore()
  const laptop = useLaptopStore()
  const lines = useMonologueStore((s) => s.queue)

  useEffect(() => {
    try {
      localStorage.setItem(REMEMBER, open ? '1' : '0')
    } catch {
      // 적어 두지 못해도 패널은 그대로 쓴다
    }
  }, [open])

  useEffect(() => {
    const press = (e: KeyboardEvent) => {
      // 글을 쓰는 칸에서 누른 것은 여닫지 않는다
      if (e.target instanceof Element && e.target.closest('input, textarea')) return
      if (e.code === TOGGLE_KEY.code && !e.repeat) setOpen((value) => !value)
    }
    window.addEventListener('keydown', press)
    return () => window.removeEventListener('keydown', press)
  }, [])

  if (!open) {
    return (
      <button type="button" className={styles.toggle} onClick={() => setOpen(true)}>
        엔진 보기 <kbd>{TOGGLE_KEY.label}</kbd>
      </button>
    )
  }

  const cardTitle = (id: string) => script.evidence.find((card) => card.id === id)?.title
  const next = waiting(story, script)

  return (
    <aside className={styles.panel} aria-label="엔진 보기 (개발 모드)">
      <header className={styles.head}>
        <strong>엔진 보기</strong>
        <span>개발 모드에서만 보여요</span>
        <button type="button" onClick={() => setOpen(false)}>
          닫기 <kbd>{TOGGLE_KEY.label}</kbd>
        </button>
        <nav className={styles.tabs} aria-label="볼 것 고르기">
          <button type="button" aria-pressed={tab === 'state'} onClick={() => setTab('state')}>
            지금 상태
          </button>
          <button type="button" aria-pressed={tab === 'script'} onClick={() => setTab('script')}>
            대본 순서
          </button>
        </nav>
      </header>

      {tab === 'script' ? (
        <ScriptTimeline story={story} days={days} today={script.info.day} />
      ) : (
        <>
          <Section
            title={`방금 일어난 일 (${entries.length})`}
            about="내가 한 일이 엔진에 전달됐는지 여기서 봐요. 새 것이 위에 와요."
          >
            {entries.length === 0 ? (
              <p className={styles.none}>아직 엔진에 알린 일이 없어요.</p>
            ) : (
              <ol className={styles.log}>
                {entries.map((entry) => (
                  <li key={entry.id}>
                    <time>{entry.at}</time>
                    <code>{entry.what}</code>
                    {entry.fired.length > 0 ? (
                      <span className={styles.hit}>→ 사건 실행: {entry.fired.join(', ')}</span>
                    ) : (
                      <span className={styles.miss}>
                        → 받는 사건 없음 (대본에 없거나 아직 차례가 아니에요)
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Section>

          <Section
            title={`엔진이 기다리는 것 (${next.length})`}
            about="아래 가운데 하나가 일어나면 대본의 다음 사건이 실행돼요."
          >
            <List
              items={next.map((item) => (
                <>
                  <code>{item.need}</code> <span className={styles.hint}>{item.hint}</span>
                  <span className={styles.hint}> → 사건 {item.id}</span>
                </>
              ))}
            />
          </Section>

          <Section
            title="엔진이 기억하는 것"
            about="대본을 진행하면서 쌓인 값이에요(storyStore의 story). 엔딩도 이 값으로 정해요."
          >
            <dl>
              <Row label="날">
                {story.day}일차 (대본: {script.info.title}) · 전체 {days.length}일 치 대본
                {story.day !== script.info.day ? ` · ${script.info.day}일차로 넘어가는 중` : ''}
              </Row>
              <Row label="하루가 끝남">
                {story.dayOver
                  ? nextDay
                    ? `예. 침대에 누우면 ${nextDay.info.day}일차로 넘어가요`
                    : '예. 다음 날 대본이 없어 여기서 멈춰요'
                  : '아니오'}
              </Row>
              <Row label="화면 위 안내">
                {story.goal ?? <span className={styles.none}>없음</span>}
              </Row>
              <Row label="경계심">{story.suspicion} / 100</Row>
              <Row label={`실행한 사건 (${story.fired.length})`}>
                <List
                  items={story.fired.map((id) => (
                    <code key={id}>{id}</code>
                  ))}
                />
              </Row>
              <Row label={`얻은 증거 (${story.evidence.length})`}>
                <List
                  items={story.evidence.map((id) => (
                    <>
                      <code>{id}</code> {cardTitle(id)}
                    </>
                  ))}
                />
              </Row>
              <Row label="빈칸 문장">
                <List
                  items={script.sentences.map((sentence) => {
                    const result = sentenceResult(story, sentence.id)
                    return (
                      <>
                        <code>{sentence.id}</code>{' '}
                        {result ? RESULT_LABELS[result] : '아직 안 맞춰 봄'}
                        {story.wrong[sentence.id]
                          ? ` (연달아 ${story.wrong[sentence.id]}번 틀림)`
                          : ''}
                      </>
                    )
                  })}
                />
              </Row>
              <Row label="엔딩용 기록">
                <List
                  items={Object.entries(story.flags).map(([key, value]) => (
                    <>
                      <code>{key}</code> {yes(value)}
                    </>
                  ))}
                />
              </Row>
              <Row label="웹캠 켜짐">{yes(story.webcamOn)}</Row>
              <Row label="노트북 화면">{story.laptop ?? '정해지지 않음'}</Row>
              <Row label="열린 장면">{story.scene ?? '없음'}</Row>
              <Row label="떠 있는 선택지">{story.choice?.prompt ?? '없음'}</Row>
              <Row label={`도착한 메시지 (${story.messages.length})`}>
                <List
                  items={story.messages.map((message) => (
                    <>
                      <code>{message.id}</code> {message.channel} · {message.from} {message.time}
                    </>
                  ))}
                />
              </Row>
            </dl>
          </Section>

          <Section
            title={`은행 장부 (계좌 ${story.bank.accounts.length}개)`}
            about="엔진이 갖고 있는 계좌와 거래예요(story.bank). 잔액은 저장하지 않고 거래를 더해서 계산해요."
          >
            <List
              items={story.bank.accounts.map((account) => (
                <>
                  <code>{account.id}</code> {account.label} {account.number} · 잔액{' '}
                  {balanceOf(story.bank, account.id).toLocaleString('ko-KR')}원 · {account.day.day}
                  일차
                  {account.time ? ` ${account.time}` : ''} 생김
                  <List
                    items={entriesOf(story.bank, account.id).map((entry) => (
                      <>
                        <code>{entry.id}</code> {entry.amount > 0 ? '+' : ''}
                        {entry.amount.toLocaleString('ko-KR')}원 · {entry.counterparty} ·{' '}
                        {entry.day.day}
                        일차 {entry.time} · {entry.by === 'player' ? '플레이어가 보냄' : '대본'}
                      </>
                    ))}
                  />
                </>
              ))}
            />
          </Section>

          <Section title="방과 진행 상태" about="3D 방에서 지금 무엇을 하고 있는지예요(gameStore).">
            <dl>
              <Row label="보고 있는 곳">{VIEW_LABELS[game.view]}</Row>
              <Row label="의자에 앉아 있음">{yes(game.seated)}</Row>
              <Row label="휴대폰을 집음">{yes(game.hasPhone)}</Row>
              <Row label="커서가 가리키는 물건">{game.aim ?? '없음'}</Row>
              <Row label="경계심">{game.suspicion}</Row>
              <Row label="웹캠 켜짐">{yes(game.webcamOn)}</Row>
              <Row label="밤">{yes(game.night)}</Row>
              <Row label="천장등 / 스탠드">
                {game.ceilingLight ? '켜짐' : '꺼짐'} / {game.deskLamp ? '켜짐' : '꺼짐'}
              </Row>
              <Row label="노트북에 뜬 화면">{game.laptopScreen}</Row>
              <Row label="입력한 이름">{game.playerName || '없음'}</Row>
            </dl>
          </Section>

          <Section
            title="노트북 브라우저"
            about="열린 탭은 플레이어가 조작하는 화면 상태예요(laptopStore). 즐겨찾기는 대본이 띄운 적 있는 사이트예요(엔진)."
          >
            <dl>
              <Row label="열린 탭">
                <List
                  items={laptop.tabs.map((tab) =>
                    tab === laptop.active ? `${tab} (앞에 있음)` : tab,
                  )}
                />
              </Row>
              <Row label="즐겨찾기">
                <List items={[...new Set(story.laptopLog)].filter(isBrowserSite)} />
              </Row>
            </dl>
          </Section>

          <Section
            title="휴대폰"
            about="휴대폰 안에 들어 있는 것이에요(phoneStore). 대본이 열어 준 것은 엔진의 기록에서 읽어요."
          >
            <dl>
              <Row label="열린 화면">
                {phone.app}
                {phone.thread ? ` (대화: ${phone.thread})` : ''}
              </Row>
              <Row label={`받은 메시지 (${phone.received.length})`}>
                <List
                  items={phone.received.map(({ message, day }) => (
                    <>
                      <code>{message.id}</code> {day.day}일차 {message.time} ·{' '}
                      {phone.readIds.includes(message.id) ? '읽음' : '안 읽음'}
                    </>
                  ))}
                />
              </Row>
              <Row label="통화 기록">{phone.calls.length}건</Row>
              <Row label="대본이 열어 준 것">
                <List items={unlockedIn(story.flags).map((feature) => FEATURE_LABELS[feature])} />
              </Row>
            </dl>
          </Section>

          <Section title="혼잣말" about="화면 아래 창에 차례로 나올 줄이에요(monologueStore).">
            <List items={lines.map((line) => line.text)} />
          </Section>
        </>
      )}
    </aside>
  )
}
