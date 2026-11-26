import styles from './Bubble.module.css'

interface Props {
  /** 받은 문자(in) / 내가 보낸 문자(out) */
  side: 'in' | 'out'
  text: string
  /** 묶음의 마지막 말풍선이면 꼬리를 그린다 */
  tail?: boolean
}

/** 아이폰 문자 말풍선 */
export function Bubble({ side, text, tail = true }: Props) {
  return <p className={`${styles.bubble} ${styles[side]} ${tail ? styles.tail : ''}`}>{text}</p>
}
