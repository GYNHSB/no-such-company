import { useMemo, useState } from 'react'
import type { BlankSentence as Sentence, EvidenceCard as Card } from '@/data/types'
import { PhoneNav } from '@/ui/kit/phone/PhoneNav'
import { PhoneScreen } from '@/ui/kit/phone/PhoneScreen'
import type { SentenceStatus } from '@/ui/screens/common/Notebook'
import styles from './NotesApp.module.css'

type Page = 'list' | 'evidence' | 'sentences'

interface Props {
  /** 지금 시각 "23:12". 상태 표시줄과 메모 목록의 시각에 쓴다 */
  time: string
  /** 지금까지 모은 증거 카드 */
  cards: Card[]
  /** 맞춰 볼 빈칸 문장(오늘까지 열린 것) */
  sentences: Sentence[]
  /** 엔진의 판정 결과. solved: 맞음, wrong: 방금 틀림, locked: 연달아 틀려 오늘 밤엔 더 못 맞춤 */
  status: Record<string, SentenceStatus | undefined>
  /** "맞춰 보기"를 눌렀을 때. 빈칸 순서대로 놓은 카드 id. 정답 판정은 엔진이 한다. */
  onSubmit: (sentenceId: string, cardIds: string[]) => void
  /** 메모 목록의 "홈"이나 아래 막대를 눌렀을 때. 홈 화면으로 돌아간다 */
  onHome?: () => void
}

/**
 * 휴대폰 메모 앱. 아이폰 메모 앱의 구조(메모 목록 → 메모 열기)를 따른다. 실제 앱의 이름, 아이콘, 고유 색은 쓰지 않는다.
 * 메모는 두 개다. "모은 증거"는 증거 카드를 적어 둔 메모, "맞춰 볼 문장"은 빈칸 문장을 맞춰 보는 메모다.
 * 빈칸을 누르면 화면 아래에서 증거를 고르는 줄이 올라오고, 증거를 누르면 그 빈칸에 들어간다. 채운 빈칸을 다시 누르면 뺀다.
 * PhoneCloseup의 화면 영역(또는 container-type: inline-size인 칸) 안에 넣는다.
 */
export function NotesApp({ time, cards, sentences, status, onSubmit, onHome }: Props) {
  const [page, setPage] = useState<Page>('list')
  const byId = useMemo(() => Object.fromEntries(cards.map((c) => [c.id, c])), [cards])
  const [values, setValues] = useState<Record<string, (string | null)[]>>({})
  /** 지금 채우려는 빈칸: [문장 id, 빈칸 번호] */
  const [active, setActive] = useState<[string, number] | null>(null)

  const valueOf = (s: Sentence) =>
    status[s.id] === 'solved' ? s.answers : (values[s.id] ?? s.answers.map(() => null))
  const solvedCount = sentences.filter((s) => status[s.id] === 'solved').length

  const put = (cardId: string) => {
    if (!active) return
    const [id, slot] = active
    const sentence = sentences.find((s) => s.id === id)
    if (!sentence) return
    const next = [...valueOf(sentence)]
    next[slot] = cardId
    setValues((v) => ({ ...v, [id]: next }))
    setActive(null)
  }

  if (page === 'list') {
    return (
      <PhoneScreen time={time} onHome={onHome}>
        <div className={styles.screen}>
          <div className={styles.top}>
            {/* 홈으로 돌아갈 곳이 없으면 아이폰 메모 앱처럼 "폴더"를 꾸밈으로 둔다 */}
            <PhoneNav backLabel={onHome ? '홈' : '폴더'} onBack={onHome} title="메모" />
          </div>
          <div className={styles.search} aria-hidden="true">
            검색
          </div>
          <p className={styles.section}>오늘</p>
          <ul className={styles.list}>
            <li>
              <button type="button" className={styles.row} onClick={() => setPage('sentences')}>
                <span className={styles.rowTitle}>맞춰 볼 문장</span>
                <span className={styles.rowMeta}>
                  <span>{time}</span>
                  <span className={styles.preview}>
                    {sentences.length === 0
                      ? '아직 없음'
                      : `${solvedCount} / ${sentences.length} 맞춤`}
                  </span>
                </span>
              </button>
            </li>
            <li>
              <button type="button" className={styles.row} onClick={() => setPage('evidence')}>
                <span className={styles.rowTitle}>모은 증거</span>
                <span className={styles.rowMeta}>
                  <span>{time}</span>
                  <span className={styles.preview}>
                    {cards.length === 0 ? '아직 없음' : cards.map((c) => c.title).join(', ')}
                  </span>
                </span>
              </button>
            </li>
          </ul>
          <footer className={styles.toolbar}>
            <span />
            <span className={styles.count}>메모 2개</span>
            <ComposeIcon />
          </footer>
        </div>
      </PhoneScreen>
    )
  }

  return (
    <PhoneScreen time={time} onHome={onHome}>
      <div className={styles.screen}>
        <div className={styles.top}>
          <PhoneNav
            backLabel="메모"
            onBack={() => {
              setActive(null)
              setPage('list')
            }}
          />
        </div>

        <article className={styles.note}>
          {page === 'evidence' ? (
            <>
              <h2 className={styles.noteTitle}>모은 증거</h2>
              {cards.length === 0 && <p className={styles.muted}>아직 모은 증거가 없다.</p>}
              <ul className={styles.bullets}>
                {cards.map((c) => (
                  <li key={c.id}>
                    <strong>{c.title}</strong>
                    <span className={styles.muted}>{c.detail}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h2 className={styles.noteTitle}>맞춰 볼 문장</h2>
              {sentences.length === 0 && (
                <p className={styles.muted}>오늘은 맞춰 볼 문장이 없다.</p>
              )}
              {sentences.map((s) => {
                const state = status[s.id]
                const value = valueOf(s)
                const full = value.every(Boolean)
                const parts = s.text.split(/(\[\d+\])/)
                return (
                  <section
                    key={s.id}
                    className={`${styles.sentence} ${state === 'wrong' ? styles.wrong : ''}`}
                  >
                    <p className={styles.sentenceText}>
                      {parts.map((part, i) => {
                        const m = part.match(/^\[(\d+)\]$/)
                        if (!m) return <span key={i}>{part}</span>
                        const slot = Number(m[1])
                        const placed = value[slot]
                        const isActive = active?.[0] === s.id && active[1] === slot
                        const fixed = state === 'solved' || state === 'locked'
                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={fixed}
                            className={`${styles.blank} ${placed ? styles.filled : ''} ${isActive ? styles.active : ''} ${state === 'solved' ? styles.solved : ''}`}
                            onClick={() => {
                              if (placed) {
                                const next = [...value]
                                next[slot] = null
                                setValues((v) => ({ ...v, [s.id]: next }))
                                setActive(null)
                              } else setActive(isActive ? null : [s.id, slot])
                            }}
                            aria-label={
                              placed
                                ? `빈칸 ${slot + 1}: ${byId[placed]?.title}. 누르면 뺀다`
                                : `빈칸 ${slot + 1}. 누르면 증거를 고른다`
                            }
                          >
                            {placed ? byId[placed]?.title : '　　　　'}
                          </button>
                        )
                      })}
                    </p>
                    <div className={styles.sentenceFoot}>
                      {state === 'solved' && <span className={styles.ok}>✓ 맞췄다</span>}
                      {state === 'wrong' && (
                        <span className={styles.no}>아니다. 다시 생각해 보자.</span>
                      )}
                      {state === 'locked' && (
                        <span className={styles.no}>오늘 밤은 더 맞춰 볼 수 없다.</span>
                      )}
                      {state !== 'solved' && state !== 'locked' && (
                        <button
                          type="button"
                          className={styles.submit}
                          disabled={!full}
                          onClick={() => onSubmit(s.id, value as string[])}
                        >
                          맞춰 보기
                        </button>
                      )}
                    </div>
                  </section>
                )
              })}
            </>
          )}
        </article>

        {/* 빈칸을 고르면 키보드 자리에서 증거 고르는 줄이 올라온다 */}
        {active && (
          <div className={styles.picker} role="group" aria-label="빈칸에 넣을 증거 고르기">
            <p className={styles.pickerHint}>빈칸에 넣을 증거</p>
            <div className={styles.chips}>
              {cards.map((c) => (
                <button key={c.id} type="button" className={styles.chip} onClick={() => put(c.id)}>
                  {c.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </PhoneScreen>
  )
}

/** 새 메모 쓰기 모양(꾸밈) */
function ComposeIcon() {
  return (
    <svg
      className={styles.compose}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
      <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" />
    </svg>
  )
}
