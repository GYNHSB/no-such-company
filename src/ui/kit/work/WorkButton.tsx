import type { ReactNode } from 'react'
import styles from './WorkButton.module.css'

interface Props {
  /** btn_화면_동작 규칙의 id. 대본의 interact 트리거가 이 id를 가리킨다 */
  id?: string
  /** primary: 주요(채움), secondary: 보조(테두리만) */
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  onClick?: () => void
  children: ReactNode
}

/** 오버레이 워크의 버튼 */
export function WorkButton({ id, variant = 'primary', disabled, onClick, children }: Props) {
  return (
    <button
      type="button"
      id={id}
      className={`${styles.button} ${styles[variant]}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
