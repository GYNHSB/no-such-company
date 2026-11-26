import type { BlankSentence as Sentence, EvidenceCard } from '../../../data/types'
import styles from './BlankSentence.module.css'

interface Props {
  sentence: Sentence
  cards: Record<string, EvidenceCard>
  /** 빈칸마다 놓인 증거 카드 id (없으면 null) */
  value: (string | null)[]
  /** 클릭으로 골라 둔 카드. 빈칸을 누르면 거기 놓인다 */
  selectedCardId?: string | null
  solved?: boolean
  /** 오답 직후 흔들림 */
  wrong?: boolean
  onChange: (value: (string | null)[]) => void
}

/**
 * 빈칸 문장. text의 [0], [1] 자리에 증거 카드를 끌어다 놓는다.
 * 정답 판정은 엔진(src/engine)이 한다. 이 부품은 놓고 빼는 것만 맡는다.
 */
export function BlankSentence({
  sentence,
  cards,
  value,
  selectedCardId,
  solved,
  wrong,
  onChange,
}: Props) {
  const parts = sentence.text.split(/(\[\d+\])/)
  const put = (slot: number, id: string | null) => {
    if (solved) return
    const next = [...value]
    next[slot] = id
    onChange(next)
  }
  return (
    <p className={`${styles.sentence} ${solved ? styles.solved : ''} ${wrong ? styles.wrong : ''}`}>
      {parts.map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/)
        if (!m) return <span key={i}>{part}</span>
        const slot = Number(m[1])
        const placed = value[slot]
        return (
          <button
            key={i}
            type="button"
            className={`${styles.slot} ${placed ? styles.filled : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              put(slot, e.dataTransfer.getData('text/evidence-id') || null)
            }}
            onClick={() => put(slot, placed ? null : (selectedCardId ?? null))}
            aria-label={
              placed ? `빈칸 ${slot + 1}: ${cards[placed]?.title}. 누르면 뺀다` : `빈칸 ${slot + 1}`
            }
          >
            {placed ? cards[placed]?.title : '　　　'}
          </button>
        )
      })}
    </p>
  )
}
