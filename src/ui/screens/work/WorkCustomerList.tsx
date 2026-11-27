// shortcut: 상자는 kit WorkComposer의 스타일을 빌려 쓴다(WorkProofread와 같은 방식). kit에 입력창 틀 부품이 생기면 그것으로 바꾼다.
import { useState } from 'react'
import { WorkButton } from '@/ui/kit/work/WorkButton'
import kit from '@/ui/kit/work/WorkComposer.module.css'
import { Icon } from '@/ui/screens/laptop/icons'
import {
  hasDuplicates,
  isDuplicated,
  isSorted,
  kindOf,
  moveTo,
  type CustomerKind,
} from './customerList'
import styles from './WorkCustomerList.module.css'

const KINDS: readonly { kind: CustomerKind; label: string }[] = [
  { kind: 'new', label: '신규' },
  { kind: 'known', label: '기존' },
]

interface Props {
  /** 명단 이름 ('고객명단_월요일') */
  title: string
  /** 받은 순서의 이름들. 겹치는 이름도 그대로 받는다 */
  names: readonly string[]
  /** 앞선 날의 명단에 있던 이름들. 비어 있으면(1일차) 신규와 기존을 나누지 않는다 */
  earlier: readonly string[]
  /** 정리 완료(`btn_work_customer_done`)를 눌렀을 때. 순서가 맞고, 겹친 줄이 없고, 분류가 모두 맞아야 누를 수 있다 */
  onDone?: () => void
}

interface Row {
  /** 받은 순서의 순번(1부터). 줄을 옮기거나 지워도 바뀌지 않는다 */
  id: number
  name: string
}

/**
 * 고객 명단 정리. 메신저의 입력창 자리에 놓는다.
 * 이름을 가나다순으로 줄 세우고, 겹치는 이름은 한 줄만 남기고 지우고,
 * 앞선 명단이 있으면 고객마다 신규와 기존을 나눈다. 틀려도 벌점은 없다.
 * 줄은 끌어서 옮기거나, 이름을 누른 뒤 옮길 자리의 이름을 눌러 옮긴다.
 * 다른 명단을 정리할 때는 key를 바꿔 새로 그린다.
 */
export function WorkCustomerList({ title, names, earlier, onDone }: Props) {
  const [rows, setRows] = useState<readonly Row[]>(() =>
    names.map((name, index) => ({ id: index + 1, name })),
  )
  // 집은 줄이 지금 몇 번째인지. null이면 아무것도 집지 않았다
  const [held, setHeld] = useState<number | null>(null)
  // 줄 id별 분류. 맞게 고른 것만 담긴다
  const [kinds, setKinds] = useState<Readonly<Record<number, CustomerKind>>>({})
  // 방금 한 조작을 받아들이지 않은 까닭. null이면 받아들였다
  const [refusal, setRefusal] = useState<string | null>(null)

  const current = rows.map((row) => row.name)
  const hasKinds = earlier.length > 0
  const isOrdered = isSorted(current)
  const isDeduped = !hasDuplicates(current)
  const isReady = isOrdered && isDeduped && (!hasKinds || rows.every((row) => row.id in kinds))

  const drop = (index: number) => {
    if (held === null) return
    setRows(moveTo(rows, held, index))
    setHeld(null)
  }
  const pick = (index: number) => {
    setRefusal(null)
    if (held === null) setHeld(index)
    else drop(index)
  }
  const choose = (row: Row, kind: CustomerKind) => {
    const isRight = kind === kindOf(row.name, earlier)
    setRefusal(isRight ? null : '그 고객은 그쪽이 아니에요. 다시 골라 보세요.')
    if (isRight) setKinds({ ...kinds, [row.id]: kind })
  }
  const remove = (row: Row, index: number) => {
    setHeld(null)
    if (!isDuplicated(current, row.name)) {
      setRefusal('한 줄뿐인 이름은 지울 수 없어요. 겹치는 이름만 지우세요.')
      return
    }
    // 지운 줄의 버튼이 사라지므로, 키보드로 하던 사람이 이어서 할 수 있게 옆 줄로 초점을 옮긴다
    const neighbor = rows[index + 1] ?? rows[index - 1]
    document.getElementById(`btn_work_customer_row_${neighbor.id}`)?.focus()
    setRefusal(null)
    setRows(rows.filter((other) => other.id !== row.id))
  }

  return (
    <section className={`${kit.root} ${styles.root}`} aria-label="고객 명단 정리">
      <header className={styles.title}>
        <Icon name="menu" size={16} />
        {title}
      </header>
      <ol className={styles.list}>
        {rows.map((row, index) => (
          <li
            key={row.id}
            className={styles.row}
            onDragOver={(event) => {
              if (held !== null) event.preventDefault()
            }}
            onDrop={(event) => {
              event.preventDefault()
              drop(index)
            }}
          >
            <span className={styles.order}>{index + 1}</span>
            {/* 버튼은 브라우저에 따라 끌리지 않아서 role만 버튼으로 준다 (WorkFileComposer의 파일과 같은 이유) */}
            <span
              role="button"
              tabIndex={0}
              id={`btn_work_customer_row_${row.id}`}
              className={styles.name}
              aria-pressed={held === index}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', row.name)
                event.dataTransfer.effectAllowed = 'move'
                setHeld(index)
              }}
              onDragEnd={() => setHeld(null)}
              onClick={() => pick(index)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                pick(index)
              }}
            >
              {row.name}
            </span>
            {hasKinds && (
              <span className={styles.kinds} role="group" aria-label={`${row.name} 분류`}>
                {KINDS.map(({ kind, label }) => (
                  <button
                    key={kind}
                    type="button"
                    id={`btn_work_customer_${kind}_${row.id}`}
                    className={styles.kind}
                    aria-pressed={kinds[row.id] === kind}
                    onClick={() => choose(row, kind)}
                  >
                    {label}
                  </button>
                ))}
              </span>
            )}
            <button
              type="button"
              id={`btn_work_customer_remove_${row.id}`}
              className={styles.remove}
              aria-label={`${row.name} 지우기`}
              onClick={() => remove(row, index)}
            >
              <Icon name="trash" size={12} />
              지우기
            </button>
          </li>
        ))}
      </ol>
      <div className={styles.footer}>
        <p className={styles.guide} aria-live="polite">
          {guideFor({ isReady, isHolding: held !== null, refusal, isOrdered, isDeduped })}
        </p>
        <WorkButton id="btn_work_customer_done" disabled={!isReady} onClick={onDone}>
          정리 완료
        </WorkButton>
      </div>
    </section>
  )
}

/** 지금 무엇을 하면 되는지 알려 주는 한 줄 */
function guideFor(state: {
  isReady: boolean
  isHolding: boolean
  refusal: string | null
  isOrdered: boolean
  isDeduped: boolean
}): string {
  if (state.isReady) return '정리가 끝났어요. 정리를 마치세요.'
  if (state.isHolding) return '옮길 자리의 이름을 누르세요.'
  if (state.refusal) return state.refusal
  if (!state.isOrdered)
    return '이름을 가나다순으로 줄 세우세요. 끌어서 옮기거나, 이름을 누른 뒤 옮길 자리의 이름을 누르세요.'
  if (!state.isDeduped) return '같은 이름이 겹쳐 있어요. 한 줄만 남기고 지우세요.'
  return '고객마다 신규인지 기존인지 고르세요. 지난 명단에 있던 이름이면 기존이에요.'
}
