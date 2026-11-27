import { useState } from 'react'
import type { Choice } from '../../../data/types'
import { WorkButton } from './WorkButton'
import styles from './WorkComposer.module.css'

interface Props {
  /** 있으면 자유 입력 대신 선택지 버튼을 보여 준다 */
  choices?: Choice[]
  /** 선택지 위에 보이는 안내 (Effect choice의 prompt) */
  prompt?: string
  /** 선택지를 눌렀을 때. 효과(effects) 실행은 엔진이 한다 */
  onChoose?: (choice: Choice) => void
  /** 자유 입력 모드에서 보내기를 눌렀을 때 */
  onSend?: (text: string) => void
  placeholder?: string
}

/** 대화 영역 아래 입력창. 선택지 모드와 자유 입력 모드가 있다 */
export function WorkComposer({ choices, prompt, onChoose, onSend, placeholder }: Props) {
  const [text, setText] = useState('')

  if (choices && choices.length > 0) {
    return (
      <div className={styles.root}>
        {prompt && <p className={styles.prompt}>{prompt}</p>}
        <div className={styles.choices}>
          {choices.map((choice) => (
            <WorkButton
              key={choice.id}
              id={`btn_work_choose_${choice.id}`}
              variant="secondary"
              onClick={() => onChoose?.(choice)}
            >
              {choice.label}
            </WorkButton>
          ))}
        </div>
      </div>
    )
  }

  const send = () => {
    if (!text.trim()) return
    onSend?.(text)
    setText('')
  }

  return (
    <form
      className={`${styles.root} ${styles.free}`}
      onSubmit={(event) => {
        event.preventDefault()
        send()
      }}
    >
      <input
        className={styles.input}
        value={text}
        placeholder={placeholder ?? '메시지 보내기'}
        aria-label="메시지 입력"
        onChange={(event) => setText(event.target.value)}
      />
      <WorkButton id="btn_work_send" disabled={!text.trim()} onClick={send}>
        보내기
      </WorkButton>
    </form>
  )
}
