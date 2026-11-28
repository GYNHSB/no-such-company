import { useEffect, useState, type ReactNode } from 'react'
import type { DayScript } from '@/data/types'
import { balanceOf, entriesOf } from '@/engine/bank'
import { unlockedIn, type PhoneFeature } from '@/engine/phoneUnlock'
import { sentenceResult, type StoryState } from '@/engine/story'
import { useGameStore, type View } from '@/stores/gameStore'
import { useMonologueStore } from '@/stores/monologueStore'
import { usePhoneStore } from '@/stores/phoneStore'
import { useStoryLog } from '@/stores/storyLog'
import { useStoryStore } from '@/stores/storyStore'
import styles from './StoryInspector.module.css'

/** 패널을 여닫는 키. 숫자 1 왼쪽의 ` 키다 */
const TOGGLE_KEY = { code: 'Backquote', label: '`' }
/** 열어 둔 채로 새로 고쳐도 열려 있게 브라우저에 적어 둔다 */
const REMEMBER = 'story-inspector-open'

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

/** 신호 이름이 무슨 뜻인지 한마디로. 이름의 앞부분으로 가린다 */
function meaning(name: string): string {
  if (name === 'interact_laptop') return '노트북 앞에 앉기'
  if (name === 'interact_phone') return '휴대폰 보기'
  if (name.startsWith('interact_')) return '방 안의 물건 누르기'
  if (name.startsWith('btn_')) return '화면의 버튼 누르기'
  if (name.startsWith('phone_read:')) return '휴대폰에서 그 문자(알림) 읽기'
  if (name.startsWith('phone_notification:')) return '잠금 화면에서 그 알림 누르기'
  if (name.startsWith('phone_video_end:')) return '사진 앱에서 그 영상 끝까지 보기'
  if (name.startsWith('phone_video_play:')) return '사진 앱에서 그 영상 재생하기'
  if (name.startsWith('phone_photo:')) return 'SNS에서 그 사진 보기'
  if (name.startsWith('phone_post:')) return '블라블라에서 그 글 열기'
  if (name.startsWith('phone_search:')) return '휴대폰에서 그 말로 검색하기'
  if (name.startsWith('phone_call_connected:')) return '그 번호로 건 전화가 연결됨'
  if (name.startsWith('phone_call:')) return '그 번호로 전화 걸기'
  if (name.startsWith('phone_hang_up:')) return '전화 끊기'
  if (name === 'phone_remote_admin') return '휴대폰에서 원격 관리 정보 보기'
  if (name.startsWith('phone_bank_account:')) return '은행 앱에서 그 계좌의 거래 내역 보기'
  if (name.startsWith('phone_transfer:')) return '은행 앱에서 그 사람에게 송금하기'
  return '화면이 보내는 신호'
}

/** 엔진이 다음에 기다리는 것. 아직 실행하지 않은 사건 가운데 지금 일어날 수 있는 것만 고른다 */
function waiting(story: StoryState, script: DayScript) {
  const list: { id: string; need: string; hint: string }[] = []
  for (const event of script.events) {
    if (story.fired.includes(event.id)) continue
    const t = event.trigger
    if (t.type === 'interact') {
      if (t.after && !story.fired.includes(t.after)) continue
      list.push({ id: event.id, need: t.objectId, hint: meaning(t.objectId) })
    } else if (t.type === 'afterEvent') {
      if (!story.fired.includes(t.eventId)) continue
      list.push({ id: event.id, need: `${t.delaySec ?? 0}초 뒤 저절로`, hint: '기다리면 일어난다' })
    } else if (t.type === 'evidenceCollected') {
      list.push({ id: event.id, need: `증거 ${t.cardId} 획득`, hint: '그 증거를 얻으면 일어난다' })
    } else if (t.type === 'balance') {
      const range = [
        t.atLeast !== undefined ? `${t.atLeast.toLocaleString('ko-KR')}원 이상` : '',
        t.atMost !== undefined ? `${t.atMost.toLocaleString('ko-KR')}원 이하` : '',
      ]
        .filter(Boolean)
        .join(', ')
      list.push({
        id: event.id,
        need: `계좌 ${t.accountId} 잔액 ${range}`,
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
  const story = useStoryStore((s) => s.story)
  const script = useStoryStore((s) => s.script)
  const entries = useStoryLog((s) => s.entries)
  const game = useGameStore()
  const phone = usePhoneStore()
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
      </header>

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
            {story.day}일차 (대본: {script.info.title})
          </Row>
          <Row label="화면 위 안내">{story.goal ?? <span className={styles.none}>없음</span>}</Row>
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
                    <code>{sentence.id}</code> {result ? RESULT_LABELS[result] : '아직 안 맞춰 봄'}
                    {story.wrong[sentence.id] ? ` (연달아 ${story.wrong[sentence.id]}번 틀림)` : ''}
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
              {balanceOf(story.bank, account.id).toLocaleString('ko-KR')}원 · {account.day.day}일차
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
    </aside>
  )
}
