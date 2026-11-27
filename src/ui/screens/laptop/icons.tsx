// 노트북 웹 화면에서 쓰는 선 아이콘. 글꼴마다 모양이 달라지는 특수 문자 대신 SVG로 그린다

const PATHS = {
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4.3-4.3',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zm4 3a2 2 0 0 0 4 0',
  bookmark: 'M7 4h10v16l-5-4-5 4z',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
  star: 'm12 4 2.4 5 5.6.7-4.1 3.8 1 5.5-4.9-2.7L7.1 19l1-5.5L4 9.7 9.6 9z',
  more: 'M12 5v.01M12 12v.01M12 19v.01',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  square: 'M6 6h12v12H6z',
  close: 'M6 6l12 12M18 6 6 18',
  back: 'M15 5l-7 7 7 7',
  forward: 'M9 5l7 7-7 7',
  reload: 'M19 12a7 7 0 1 1-2-5M19 4v4h-4',
  down: 'm6 9 6 6 6-6',
  mic: 'M12 4a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v3',
  video: 'M4 7h11v10H4zm11 4 5-3v8l-5-3',
  share: 'M4 5h16v11H4zM9 20h6M12 13V8m-3 3 3-3 3 3',
  users:
    'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 19a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5',
  chat: 'M4 5h16v11H9l-5 4z',
  shield: 'M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z',
  check: 'm5 12 5 5 9-10',
  doc: 'M7 3h7l4 4v14H7zM14 3v4h4',
  menu: 'M3 6h18M3 12h18M3 18h18',
  pencil: 'M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4',
  inbox: 'M3 13l3-8h12l3 8v6H3v-6zM3 13h5l1 3h6l1-3h5',
  send: 'M4 4l17 8-17 8 3-8-3-8zM7 12h14',
  warning: 'M12 3l10 18H2L12 3zM12 10v5M12 18v.01',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
