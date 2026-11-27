import { useEffect, useState } from 'react'
import type { Choice } from '@/data/types'
import styles from './ChoiceMenu.module.css'

/** 고른 칸을 잠깐 밝혀 보여 준 뒤 알린다(ms) */
const CONFIRM_MS = 200

interface Props {
  /** 질문. 대본의 "선택: 팀장에게 뭐라고 답할까"에서 "선택:" 뒤 글 */
  prompt: string
  /** 선택지. 자료(types.ts)의 Choice를 그대로 넘겨도 된다. 화면에는 label만 쓴다. */
  choices: Pick<Choice, 'id' | 'label'>[]
  /** 고른 선택지의 id를 엔진에 알린다. 경계심과 기록은 엔진이 바꾸고, 이 화면은 부모가 닫는다. */
  onChoose: (id: string) => void
}

/**
 * 화면 아래쪽에 뜨는 선택지. 누르거나 숫자 키(1, 2, 3)로 고른다.
 * 고르면 그 줄이 잠깐 밝아진 뒤 onChoose를 부르고, 그동안 다른 줄은 누를 수 없다.
 */
export function ChoiceMenu({ prompt, choices, onChoose }: Props) {
  const [chosen, setChosen] = useState<string | null>(null)

  // 한 번만 고를 수 있다. 고른 줄을 잠깐 보여 준 뒤 알린다.
  const choose = (id: string) => {
    if (chosen) return
    setChosen(id)
    setTimeout(() => onChoose(id), CONFIRM_MS)
  }

  useEffect(() => {
    if (chosen) return
    const pick = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea')
      const choice = choices[Number(e.key) - 1]
      if (!choice || typing || e.repeat) return
      setChosen(choice.id)
      setTimeout(() => onChoose(choice.id), CONFIRM_MS)
    }
    window.addEventListener('keydown', pick)
    return () => window.removeEventListener('keydown', pick)
  }, [choices, chosen, onChoose])

  return (
    <div className={styles.scrim}>
      <section className={styles.menu} aria-label={prompt}>
        <h2 className={styles.prompt}>{prompt}</h2>
        <ol className={styles.list}>
          {choices.map((choice, i) => (
            <li key={choice.id}>
              <button
                type="button"
                className={`${styles.choice} ${chosen === choice.id ? styles.chosen : ''}`}
                disabled={chosen !== null}
                onClick={() => choose(choice.id)}
                aria-keyshortcuts={String(i + 1)}
              >
                <kbd className={styles.key} aria-hidden="true">
                  {i + 1}
                </kbd>
                <span>{choice.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
