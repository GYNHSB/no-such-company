import type { ReactNode } from 'react'
import styles from './AppIcon.module.css'

export type AppIconKind = 'message' | 'bank'

const GLYPHS: Record<AppIconKind, ReactNode> = {
  // 말풍선
  message: (
    <path d="M12 5c-4.4 0-8 2.9-8 6.5 0 2 1.1 3.8 2.9 5-.2 1-.7 2-1.5 2.8 1.6-.1 3-.7 4.1-1.6.8.2 1.6.3 2.5.3 4.4 0 8-2.9 8-6.5S16.4 5 12 5z" />
  ),
  // 기둥이 있는 건물
  bank: (
    <>
      <path d="M12 4l8 4.5V10H4V8.5L12 4z" />
      <path d="M6 11.5h2V17H6zM11 11.5h2V17h-2zM16 11.5h2V17h-2z" />
      <path d="M4 18.5h16V20H4z" />
    </>
  ),
}

/**
 * 앱 아이콘. 색 있는 둥근 네모 안에 단순한 모양만 그린다. 실제 앱의 아이콘은 쓰지 않는다.
 * 크기는 감싸는 쪽이 정한다(가로세로를 꽉 채운다).
 */
export function AppIcon({ kind }: { kind: AppIconKind }) {
  return (
    <span className={`${styles.icon} ${styles[kind]}`} aria-hidden="true">
      <svg className={styles.glyph} viewBox="0 0 24 24">
        {GLYPHS[kind]}
      </svg>
    </span>
  )
}
