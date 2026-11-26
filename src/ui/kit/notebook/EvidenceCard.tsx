import type { EvidenceCard as Card } from '../../../data/types'
import styles from './EvidenceCard.module.css'

interface Props {
  card: Card
  /** 클릭으로 골라 둔 상태(끌어다 놓기 대신 클릭 → 빈칸 클릭으로도 놓을 수 있게) */
  selected?: boolean
  /** 이미 빈칸에 놓였으면 흐리게 */
  used?: boolean
  onSelect?: (id: string) => void
}

/** 메모장의 증거 카드. 끌어다 빈칸에 놓는다 */
export function EvidenceCard({ card, selected, used, onSelect }: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/evidence-id', card.id)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      onClick={() => onSelect?.(card.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(card.id)
        }
      }}
      aria-pressed={selected}
      className={`${styles.card} ${selected ? styles.selected : ''} ${used ? styles.used : ''}`}
    >
      {card.image && <img className={styles.image} src={card.image} alt="" draggable={false} />}
      <span className={styles.title}>{card.title}</span>
      <span className={styles.detail}>{card.detail}</span>
    </div>
  )
}
