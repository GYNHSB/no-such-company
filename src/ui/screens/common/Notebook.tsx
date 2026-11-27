import { useEffect, useMemo, useState } from 'react'
import type { BlankSentence as Sentence, EvidenceCard as Card } from '@/data/types'
import { BlankSentence } from '@/ui/kit/notebook/BlankSentence'
import { EvidenceCard } from '@/ui/kit/notebook/EvidenceCard'
import styles from './Notebook.module.css'

/** 엔진이 알려 주는 문장 하나의 판정 결과. 없으면 아직 맞추지 않은 문장 */
export type SentenceStatus = 'solved' | 'wrong' | 'locked'

interface Props {
  /** 지금까지 모은 증거 카드 */
  cards: Card[]
  /** 맞춰 볼 빈칸 문장(오늘까지 열린 것) */
  sentences: Sentence[]
  /** 엔진의 판정 결과. solved: 맞음, wrong: 방금 틀림(흔들림), locked: 연달아 틀려 오늘 밤엔 더 못 맞춤 */
  status: Record<string, SentenceStatus | undefined>
  /** "맞춰 보기"를 눌렀을 때. 빈칸 순서대로 놓은 카드 id를 넘긴다. 정답 판정은 엔진이 한다. */
  onSubmit: (sentenceId: string, cardIds: string[]) => void
  /** 닫을 때. 닫기 버튼이나 Esc */
  onClose: () => void
}

/**
 * 펼친 수첩 모양의 메모장. 왼쪽 쪽에는 모은 증거 카드, 오른쪽 쪽에는 빈칸 문장이 있다.
 * 카드를 끌어다 빈칸에 놓거나, 카드를 누른 뒤 빈칸을 눌러 놓는다. 채워진 빈칸을 누르면 뺀다.
 * 화면은 놓고 빼고 제출하는 것만 하고, 맞았는지는 엔진의 판정(status)을 받아 보여 준다.
 */
export function Notebook({ cards, sentences, status, onSubmit, onClose }: Props) {
  const byId = useMemo(() => Object.fromEntries(cards.map((c) => [c.id, c])), [cards])
  const [values, setValues] = useState<Record<string, (string | null)[]>>({})
  const [selected, setSelected] = useState<string | null>(null)

  const valueOf = (s: Sentence) => values[s.id] ?? s.answers.map(() => null)
  // 어느 빈칸에든 놓인 카드는 흐리게 보여 준다(맞춘 문장의 카드 포함)
  const used = new Set(
    sentences.flatMap((s) => (status[s.id] === 'solved' ? s.answers : valueOf(s))).filter(Boolean),
  )

  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])

  return (
    <div className={styles.scrim}>
      <section className={styles.book} aria-label="메모장">
        <div className={styles.page}>
          <h2 className={styles.heading}>모은 증거</h2>
          {cards.length === 0 ? (
            <p className={styles.empty}>아직 모은 증거가 없다.</p>
          ) : (
            <div className={styles.cards}>
              {cards.map((card) => (
                <EvidenceCard
                  key={card.id}
                  card={card}
                  selected={selected === card.id}
                  used={used.has(card.id)}
                  onSelect={(id) => setSelected((s) => (s === id ? null : id))}
                />
              ))}
            </div>
          )}
        </div>

        <div className={styles.page}>
          <h2 className={styles.heading}>맞춰 볼 문장</h2>
          {sentences.length === 0 ? (
            <p className={styles.empty}>오늘은 맞춰 볼 문장이 없다.</p>
          ) : (
            <ol className={styles.sentences}>
              {sentences.map((s) => {
                const state = status[s.id]
                const value = state === 'solved' ? s.answers : valueOf(s)
                const full = value.every(Boolean)
                return (
                  <li key={s.id} className={styles.sentence}>
                    <BlankSentence
                      sentence={s}
                      cards={byId}
                      value={value}
                      selectedCardId={selected}
                      solved={state === 'solved'}
                      wrong={state === 'wrong'}
                      onChange={(next) => {
                        if (state === 'locked') return
                        setValues((v) => ({ ...v, [s.id]: next }))
                        setSelected(null)
                      }}
                    />
                    <div className={styles.row}>
                      {state === 'solved' && <span className={styles.ok}>맞췄다</span>}
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
                  </li>
                )
              })}
            </ol>
          )}
          <p className={styles.howto}>카드를 끌어다 빈칸에 놓거나, 카드를 누르고 빈칸을 눌러요.</p>
        </div>
      </section>

      <button type="button" className={styles.close} onClick={onClose}>
        덮기
      </button>
    </div>
  )
}
