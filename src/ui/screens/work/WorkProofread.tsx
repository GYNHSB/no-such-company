// shortcut: 상자는 kit WorkComposer의 스타일을 빌려 쓴다(WorkVideoCapture와 같은 방식). kit에 입력창 틀 부품이 생기면 그것으로 바꾼다.
import { useEffect, useState } from 'react'
import { WorkButton } from '@/ui/kit/work/WorkButton'
import kit from '@/ui/kit/work/WorkComposer.module.css'
import { Icon } from '@/ui/screens/laptop/icons'
import { fixTypo, splitWords, typoIndex, type Proofread } from './proofread'
import styles from './WorkProofread.module.css'

const DONE_ID = 'btn_work_proofread_done'

interface Props {
  /** 검수할 문장. `{name}`은 플레이어 이름으로 이미 바뀐 것을 받는다 */
  sentence: string
  /** 이 문장에 든 오타와 고를 후보 */
  proofread: Proofread
  /** 검수 완료(`btn_work_proofread_done`)를 눌렀을 때. 오타를 고쳐야 누를 수 있다 */
  onDone?: () => void
}

/**
 * 안내문 맞춤법 검수. 메신저의 입력창 자리에 놓는다.
 * 틀린 낱말을 누르고 후보 중에서 바른 표기를 골라 고친다. 잘못 눌러도 벌점은 없다.
 * 다른 문장을 검수할 때는 key를 바꿔 새로 그린다.
 */
export function WorkProofread({ sentence, proofread, onDone }: Props) {
  // 누른 낱말의 순번. null이면 아직 누르지 않았다
  const [picked, setPicked] = useState<number | null>(null)
  // 누른 낱말에서 마지막으로 고른 후보
  const [chosen, setChosen] = useState<string | null>(null)
  const words = splitWords(sentence)
  const typoAt = typoIndex(words, proofread)
  const isFixed = chosen === proofread.answer
  const isChoosing = picked === typoAt && !isFixed

  // 고치고 나면 후보 버튼이 사라지므로, 키보드로 하던 사람이 이어서 누를 수 있게 초점을 옮긴다
  useEffect(() => {
    if (isFixed) document.getElementById(DONE_ID)?.focus()
  }, [isFixed])

  return (
    <section className={`${kit.root} ${styles.root}`} aria-label="안내문 검수">
      <header className={styles.title}>
        <Icon name="pencil" size={16} />
        안내문 검수
      </header>
      <p className={styles.sentence}>
        {words.map((word, index) => {
          const isFixedWord = isFixed && index === typoAt
          return (
            <button
              key={index}
              type="button"
              id={`btn_work_proofread_word_${index + 1}`}
              className={`${styles.word} ${isFixedWord ? styles.fixed : ''}`}
              aria-pressed={picked === index}
              disabled={isFixed}
              onClick={() => {
                setPicked(index)
                setChosen(null)
              }}
            >
              {isFixedWord ? fixTypo(word, proofread) : word}
            </button>
          )
        })}
      </p>
      {isChoosing && (
        <div className={styles.options} role="group" aria-label="고칠 표기">
          {proofread.options.map((option, index) => (
            <WorkButton
              key={option}
              id={`btn_work_proofread_option_${index + 1}`}
              variant="secondary"
              onClick={() => setChosen(option)}
            >
              {option}
            </WorkButton>
          ))}
        </div>
      )}
      <div className={styles.footer}>
        <p className={styles.guide} aria-live="polite">
          {guideFor({
            isFixed,
            isChoosing,
            hasPicked: picked !== null,
            hasChosen: chosen !== null,
          })}
        </p>
        <WorkButton id={DONE_ID} disabled={!isFixed} onClick={onDone}>
          검수 완료
        </WorkButton>
      </div>
    </section>
  )
}

/** 지금 무엇을 하면 되는지 알려 주는 한 줄 */
function guideFor(state: {
  isFixed: boolean
  isChoosing: boolean
  hasPicked: boolean
  hasChosen: boolean
}): string {
  if (state.isFixed) return '틀린 곳을 고쳤어요. 검수를 마치세요.'
  if (!state.hasPicked) return '틀린 낱말을 찾아 누르세요.'
  if (!state.isChoosing) return '이 낱말은 바르게 쓰였어요. 다른 낱말을 눌러 보세요.'
  if (!state.hasChosen) return '바른 표기를 고르세요.'
  return '그 표기는 맞지 않아요. 다시 골라 보세요.'
}
