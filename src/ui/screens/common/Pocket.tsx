import type { ReactNode } from 'react'
import styles from './Pocket.module.css'

export interface PocketItem {
  id: string
  /** 소리 내어 읽을 이름과 마우스를 올렸을 때 보이는 이름 ("휴대폰") */
  label: string
  /** 칸 오른쪽 아래 자판 모양으로 보여 줄 단축키 ("Q") */
  keyLabel?: string
  icon: ReactNode
  onOpen: () => void
}

/**
 * 화면 오른쪽 아래의 소지품 칸. 집은 물건이 칸에 하나씩 들어가고, 누르거나 단축키로 꺼낸다.
 * 물건이 하나도 없으면 보이지 않는다.
 */
export function Pocket({ items }: { items: PocketItem[] }) {
  if (items.length === 0) return null
  return (
    <nav className={styles.pocket} aria-label="소지품">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={styles.slot}
          onClick={item.onOpen}
          title={item.keyLabel ? `${item.label} (${item.keyLabel})` : item.label}
          aria-label={item.label}
          aria-keyshortcuts={item.keyLabel}
        >
          {item.icon}
          {item.keyLabel && (
            <kbd className={styles.key} aria-hidden="true">
              {item.keyLabel}
            </kbd>
          )}
        </button>
      ))}
    </nav>
  )
}

/** 소지품 칸에 넣는 휴대폰 그림. 글자색을 따라간다. */
export function PhoneIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="6.5" y="2.75" width="11" height="18.5" rx="2.5" />
      <path d="M10.5 18h3" />
    </svg>
  )
}
