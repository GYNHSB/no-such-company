import { type ReactNode, useEffect, useState } from 'react'
import { PhoneScreen } from '@/ui/kit/phone/PhoneScreen'
import styles from './CallApp.module.css'
import { daysAgo, formatMonthDay } from './clock'

/** 연락처 하나 */
export interface Contact {
  id: string
  name: string
  /** 숫자만. "01000001234" */
  number: string
}

/** 통화 기록 하나 */
export interface CallRecord {
  id: string
  /** 숫자만. 연락처에 있는 번호면 이름으로 보인다 */
  number: string
  /** 받은 전화(in), 건 전화(out), 못 받은 전화(missed) */
  kind: 'in' | 'out' | 'missed'
  date: Date
  /** "15:12" */
  time: string
}

export type CallTab = 'recents' | 'contacts' | 'keypad'

interface Props {
  /** 지금 시각 "15:14". 상태 표시줄에 쓴다 */
  time: string
  /** 오늘 날짜. 통화한 날이 오늘인지 가린다 */
  today: Date
  contacts: Contact[]
  /** 통화한 순서대로 넘긴다. 화면에는 새 것이 위에 온다 */
  calls: CallRecord[]
  /** 처음에 보여 줄 탭 */
  defaultTab?: CallTab
  /** 지금 건 전화가 연결됐는지. 받는 쪽이 정한다. 연결되면 통화 시간이 흐른다 */
  connected?: boolean
  /** 전화를 걸었을 때. 숫자만 넘긴다. 실제 전화는 걸리지 않는다 */
  onCall?: (number: string) => void
  /** 전화를 끊었을 때 */
  onHangUp?: (number: string) => void
  /** 왼쪽 위 "홈"이나 아래 막대를 눌렀을 때. 홈 화면으로 돌아간다 */
  onHome?: () => void
}

const KEYS: [digit: string, letters: string][] = [
  ['1', ''],
  ['2', 'ABC'],
  ['3', 'DEF'],
  ['4', 'GHI'],
  ['5', 'JKL'],
  ['6', 'MNO'],
  ['7', 'PQRS'],
  ['8', 'TUV'],
  ['9', 'WXYZ'],
  ['*', ''],
  ['0', '+'],
  ['#', ''],
]

const TABS: { id: CallTab; label: string }[] = [
  { id: 'recents', label: '통화' },
  { id: 'contacts', label: '연락처' },
  { id: 'keypad', label: '키패드' },
]

/** 수화기 */
const HANDSET =
  'M6.5 4.5l2.6-.6 1.6 3.9-1.9 1.4a11 11 0 0 0 6 6l1.4-1.9 3.9 1.6-.6 2.6c-.2 1-1.1 1.6-2.1 1.5C11 18.3 5.7 13 5 6.6c-.1-1 .5-1.9 1.5-2.1z'

/** 속을 채운 그림. 색은 글자색을 따른다 */
function Solid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg className={className ?? styles.solid} viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  )
}

/** 선으로 그린 그림 */
function Line({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={className ?? styles.line} viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

/** 아래 탭의 그림. 시계, 사람, 점 아홉 개 */
const TAB_ICONS: Record<CallTab, ReactNode> = {
  recents: (
    <path
      fillRule="evenodd"
      d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm-.9 4.5h1.8v5.4H8.4v-1.8h2.7z"
    />
  ),
  contacts: (
    <path
      fillRule="evenodd"
      d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4a3.2 3.2 0 1 1 0 6.4A3.2 3.2 0 0 1 12 7zm0 12.2a7.2 7.2 0 0 1-5.5-2.55c.9-1.55 3-2.65 5.5-2.65s4.6 1.1 5.5 2.65A7.2 7.2 0 0 1 12 19.2z"
    />
  ),
  keypad: (
    <>
      {[5.5, 12, 18.5].flatMap((cy) =>
        [5.5, 12, 18.5].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.4" />),
      )}
    </>
  ),
}

/** 통화 중 화면의 단추. 모양만 있고 눌리지 않는다 */
const CALL_KEYS: { label: string; icon: ReactNode }[] = [
  {
    label: '소리 끔',
    // 빗금 그은 마이크
    icon: (
      <Line d="M12 4.5A2.5 2.5 0 0 0 9.5 7v4.5a2.5 2.5 0 0 0 5 0V7A2.5 2.5 0 0 0 12 4.5zM6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v2.5M5 5l14 14" />
    ),
  },
  { label: '키패드', icon: <Solid>{TAB_ICONS.keypad}</Solid> },
  {
    label: '스피커',
    icon: (
      <Line d="M5 10v4h3l4.5 3.5v-11L8 10zM15.5 9.5a3.5 3.5 0 0 1 0 5M17.8 7.2a7 7 0 0 1 0 9.6" />
    ),
  },
  { label: '통화 추가', icon: <Line d="M12 5.5v13M5.5 12h13" /> },
  { label: '영상 통화', icon: <Line d="M4.5 8h10v8h-10zM14.5 11l5-3v8l-5-3z" /> },
  {
    label: '연락처',
    icon: <Line d="M12 12a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2zM5 19.5a7 7 0 0 1 14 0" />,
  },
]

/** 사람 모양(연락처에 없는 번호의 사진 자리) */
const PERSON = (
  <>
    <circle cx="12" cy="9.3" r="3.9" />
    <path d="M4.5 19.8a7.5 6.2 0 0 1 15 0a12 12 0 0 1-15 0z" />
  </>
)

/** "01000001234" → "010-0000-1234". 휴대전화 번호가 아니면 그대로 둔다 */
const pretty = (number: string) =>
  /^01\d{8,9}$/.test(number)
    ? `${number.slice(0, 3)}-${number.slice(3, -4)}-${number.slice(-4)}`
    : number

/** 한글 이름의 첫소리. 연락처를 묶는 데 쓴다 */
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const initialOf = (name: string) => {
  const code = name.charCodeAt(0) - 0xac00
  return code >= 0 && code < 11172 ? CHO[Math.floor(code / 588)] : '#'
}

/** 사진 자리에 적는 글자. 두 글자 이름은 그대로, 더 길면 첫 글자만 */
const badgeOf = (name: string) => (name.length <= 2 ? name : name[0])

const duration = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'long' })

/** 통화한 때: 오늘이면 시각, 어제면 "어제", 한 주 안이면 요일, 그 전이면 날짜 */
const whenOf = (today: Date, record: CallRecord) => {
  const ago = daysAgo(today, record.date)
  if (ago <= 0) return record.time
  if (ago === 1) return '어제'
  return ago < 7 ? weekday.format(record.date) : formatMonthDay(record.date)
}

const KIND_LABEL = { in: '받은 전화', out: '건 전화', missed: '부재중 전화' } as const

/** 동그란 사진 자리. 이름이 있으면 글자를, 없으면 사람 모양을 넣는다 */
function Avatar({ name, big }: { name?: string; big?: boolean }) {
  return (
    <span className={`${styles.avatar} ${big ? styles.avatarBig : ''}`} aria-hidden="true">
      {name ? badgeOf(name) : <Solid className={styles.avatarPerson}>{PERSON}</Solid>}
    </span>
  )
}

/**
 * 휴대폰 전화 앱. 아이폰 전화 앱의 구조(통화 기록, 연락처, 키패드, 통화 중 화면)를 따른다.
 * 전화를 걸면 받는 쪽에 번호만 알린다. 실제 전화는 걸리지 않는다.
 */
export function CallApp({
  time,
  today,
  contacts,
  calls,
  defaultTab = 'recents',
  connected = false,
  onCall,
  onHangUp,
  onHome,
}: Props) {
  const [tab, setTab] = useState<CallTab>(defaultTab)
  const [digits, setDigits] = useState('')
  const [openContact, setOpenContact] = useState<string | null>(null)
  /** 지금 걸고 있는 번호 */
  const [calling, setCalling] = useState<string | null>(null)
  const [talked, setTalked] = useState(0)

  // 연결된 동안 통화 시간을 센다
  useEffect(() => {
    if (!calling || !connected) return
    const id = setInterval(() => setTalked((sec) => sec + 1), 1000)
    return () => clearInterval(id)
  }, [calling, connected])

  const nameOf = (number: string) => contacts.find((c) => c.number === number)?.name
  const call = (number: string) => {
    if (!number) return
    setTalked(0)
    setCalling(number)
    onCall?.(number)
  }
  const hangUp = () => {
    if (calling) onHangUp?.(calling)
    setCalling(null)
  }

  if (calling) {
    return (
      <div className={styles.callBack}>
        <PhoneScreen time={time}>
          <div className={styles.call}>
            <p className={styles.callStatus} role="status">
              {connected ? duration(talked) : '전화 거는 중…'}
            </p>
            <h1 className={styles.callName}>{nameOf(calling) ?? pretty(calling)}</h1>
            {/* 통화 중 단추. 모양만 있고 눌리지 않는다 */}
            <ul className={styles.callKeys} aria-hidden="true">
              {CALL_KEYS.map(({ label, icon }) => (
                <li key={label}>
                  <i>{icon}</i>
                  {label}
                </li>
              ))}
            </ul>
            <button type="button" className={styles.end} onClick={hangUp} aria-label="전화 끊기">
              <Solid className={styles.endGlyph}>
                <path d={HANDSET} />
              </Solid>
            </button>
          </div>
        </PhoneScreen>
      </div>
    )
  }

  const contact = contacts.find((c) => c.id === openContact)
  const sorted = contacts.toSorted((a, b) => a.name.localeCompare(b.name, 'ko'))

  /** 위쪽 줄. 왼쪽 둥근 단추, 가운데 제목, 오른쪽 둥근 꾸밈 단추 */
  const top = (title: string, back?: { label: string; onClick: () => void }) => (
    <header className={styles.top}>
      {back ? (
        <button type="button" className={styles.pill} onClick={back.onClick}>
          <Line d="M14.5 5.5L8 12l6.5 6.5" className={styles.pillChevron} />
          {back.label}
        </button>
      ) : (
        <span />
      )}
      <h1 className={styles.title}>{title}</h1>
      {/* 목록 거르기 단추. 모양만 있고 눌리지 않는다 */}
      <span className={styles.round} aria-hidden="true">
        <Line d="M5 8h14M7.5 12h9M10 16h4" />
      </span>
    </header>
  )
  const home = onHome && { label: '홈', onClick: onHome }

  return (
    <PhoneScreen time={time} onHome={onHome}>
      <div className={styles.app}>
        <div className={styles.page}>
          {tab === 'recents' && (
            <>
              {top('통화', home)}
              {calls.length === 0 ? (
                <p className={styles.empty}>통화 기록 없음</p>
              ) : (
                <ul className={styles.list}>
                  {calls.toReversed().map((record) => {
                    const name = nameOf(record.number)
                    const who = name ?? pretty(record.number)
                    return (
                      <li key={record.id} className={styles.row}>
                        <Avatar name={name} />
                        <span className={styles.rowText}>
                          <span className={record.kind === 'missed' ? styles.missed : styles.who}>
                            {who}
                          </span>
                          <span className={styles.rowSub}>
                            <Line
                              className={styles.arrow}
                              d={
                                record.kind === 'out' ? 'M7 17L17 7M9 7h8v8' : 'M17 7L7 17M7 9v8h8'
                              }
                            />
                            <span className={styles.srOnly}>{KIND_LABEL[record.kind]}, </span>
                            {name
                              ? '휴대전화'
                              : record.number.startsWith('0')
                                ? '대한민국'
                                : '알 수 없음'}
                          </span>
                        </span>
                        <span className={styles.when}>{whenOf(today, record)}</span>
                        <button
                          type="button"
                          className={styles.callButton}
                          onClick={() => call(record.number)}
                          aria-label={`${who}에 전화 걸기`}
                        >
                          <Solid>
                            <path d={HANDSET} />
                          </Solid>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          )}

          {tab === 'contacts' &&
            (contact ? (
              <>
                {top('', { label: '연락처', onClick: () => setOpenContact(null) })}
                <div className={styles.card}>
                  <Avatar name={contact.name} big />
                  <h1 className={styles.cardName}>{contact.name}</h1>
                  <button
                    type="button"
                    className={styles.cardCall}
                    onClick={() => call(contact.number)}
                    aria-label={`${contact.name}에 전화 걸기`}
                  >
                    <Solid className={styles.cardGlyph}>
                      <path d={HANDSET} />
                    </Solid>
                    통화
                  </button>
                  <dl className={styles.cardInfo}>
                    <dt>휴대전화</dt>
                    <dd>{pretty(contact.number)}</dd>
                  </dl>
                </div>
              </>
            ) : (
              <>
                {top('연락처', home)}
                {sorted.length === 0 ? (
                  <p className={styles.empty}>연락처 없음</p>
                ) : (
                  <ul className={styles.list}>
                    {sorted.map((c, i) => {
                      const initial = initialOf(c.name)
                      const first = i === 0 || initialOf(sorted[i - 1].name) !== initial
                      return (
                        <li key={c.id}>
                          {first && <p className={styles.section}>{initial}</p>}
                          <button
                            type="button"
                            className={styles.contact}
                            onClick={() => setOpenContact(c.id)}
                          >
                            <Avatar name={c.name} />
                            <span className={styles.who}>{c.name}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </>
            ))}

          {tab === 'keypad' && (
            <div className={styles.keypad}>
              {top('', home)}
              <p className={styles.digits} aria-live="polite" aria-label="입력한 번호">
                {pretty(digits) || ' '}
              </p>
              <ul className={styles.keys}>
                {KEYS.map(([digit, letters]) => (
                  <li key={digit}>
                    <button
                      type="button"
                      className={styles.key}
                      onClick={() => setDigits((d) => (d.length < 15 ? d + digit : d))}
                      aria-label={digit}
                    >
                      <span className={styles.keyDigit}>{digit}</span>
                      <span className={styles.keyLetters}>{letters}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className={styles.dial}>
                <span />
                <button
                  type="button"
                  className={styles.send}
                  onClick={() => call(digits)}
                  disabled={!digits}
                  aria-label="전화 걸기"
                >
                  <Solid className={styles.sendGlyph}>
                    <path d={HANDSET} />
                  </Solid>
                </button>
                {digits ? (
                  <button
                    type="button"
                    className={styles.erase}
                    onClick={() => setDigits((d) => d.slice(0, -1))}
                    aria-label="한 글자 지우기"
                  >
                    <Line d="M9 6h10.5v12H9l-5.5-6zM12.5 9.5l4 5M16.5 9.5l-4 5" />
                  </button>
                ) : (
                  <span />
                )}
              </div>
            </div>
          )}
        </div>

        {/* 떠 있는 유리 탭과, 그 옆의 모양만 있는 검색 단추 */}
        <div className={styles.dock}>
          <nav className={styles.tabs} aria-label="전화 앱 메뉴">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={styles.tab}
                aria-current={tab === t.id ? 'page' : undefined}
                onClick={() => {
                  setTab(t.id)
                  setOpenContact(null)
                }}
              >
                <Solid className={styles.tabGlyph}>{TAB_ICONS[t.id]}</Solid>
                {t.label}
              </button>
            ))}
          </nav>
          <span className={styles.search} aria-hidden="true">
            <Line d="M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13zM15.5 15.5L20 20" />
          </span>
        </div>
      </div>
    </PhoneScreen>
  )
}
