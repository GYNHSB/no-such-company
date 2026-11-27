import type { ReactNode } from 'react'
import styles from './AppIcon.module.css'

export type AppIconKind =
  'message' | 'bank' | 'notes' | 'photos' | 'sns' | 'phone' | 'blabla' | 'browser'

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
  // 줄이 그어진 종이
  notes: <path d="M5 6.5h14V8H5zM5 11.25h14v1.5H5zM5 16h9v1.5H5z" />,
  // 해와 산
  photos: (
    <>
      <circle cx="8" cy="8.5" r="2.25" />
      <path d="M3.5 19l5.5-7 3.5 4.5 2.5-3 5.5 5.5z" />
    </>
  ),
  // 수화기
  phone: (
    <path d="M6.5 4.5l2.6-.6 1.6 3.9-1.9 1.4a11 11 0 0 0 6 6l1.4-1.9 3.9 1.6-.6 2.6c-.2 1-1.1 1.6-2.1 1.5C11 18.3 5.7 13 5 6.6c-.1-1 .5-1.9 1.5-2.1z" />
  ),
  // 점 세 개가 든 네모 말풍선
  blabla: (
    <path
      fillRule="evenodd"
      d="M4 5h16v11h-8.5L7 19.5V16H4zM7.4 10.5a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0-2.2 0zM10.9 10.5a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0-2.2 0zM14.4 10.5a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0-2.2 0z"
    />
  ),
  // 지구본. 선으로 그린다
  browser: (
    <path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM4 12h16M12 4c2.2 2.2 3.3 4.9 3.3 8s-1.1 5.8-3.3 8M12 4c-2.2 2.2-3.3 4.9-3.3 8s1.1 5.8 3.3 8" />
  ),
  // 겹쳐 놓은 사진 두 장
  sns: (
    <>
      <path d="M5 5h11v2H7v9H5z" />
      <path d="M8.5 8.5H19V19H8.5z" />
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
