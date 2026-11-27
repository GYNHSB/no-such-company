import type { ReactNode } from 'react'
import styles from './WorkLayout.module.css'

export interface WorkNavItem {
  /** 버튼 id는 btn_work_open_{id}가 된다 */
  id: string
  /** 화면에 보이는 이름. 채널은 '# ' 없이 쓴다 */
  label: string
  kind: 'channel' | 'dm' | 'mail'
  unread?: number
}

interface Props {
  /** 워크스페이스 이름 */
  workspace?: string
  items: WorkNavItem[]
  selectedId: string
  onSelect?: (id: string) => void
  /** 오른쪽 본문. 보통 WorkChannel 또는 WorkMail */
  children: ReactNode
}

const SECTIONS: { kind: WorkNavItem['kind']; title: string }[] = [
  { kind: 'channel', title: '채널' },
  { kind: 'dm', title: '다이렉트 메시지' },
  { kind: 'mail', title: '메일' },
]

/** 오버레이 워크 전체 틀: 왼쪽 사이드바 + 오른쪽 본문. 부모 크기에 맞춰 늘어난다 */
export function WorkLayout({
  workspace = '오버레이',
  items,
  selectedId,
  onSelect,
  children,
}: Props) {
  return (
    <div className={styles.root}>
      <nav className={styles.sidebar} aria-label="오버레이 워크 메뉴">
        <div className={styles.workspace}>{workspace}</div>
        {SECTIONS.map(({ kind, title }) => {
          const list = items.filter((item) => item.kind === kind)
          if (list.length === 0) return null
          return (
            <div key={kind} className={styles.section}>
              <div className={styles.sectionTitle}>{title}</div>
              {list.map((item) => {
                const selected = item.id === selectedId
                const unread = item.unread ?? 0
                return (
                  <button
                    key={item.id}
                    type="button"
                    id={`btn_work_open_${item.id}`}
                    className={`${styles.item} ${selected ? styles.selected : ''} ${unread > 0 ? styles.unread : ''}`}
                    aria-current={selected ? 'page' : undefined}
                    onClick={() => onSelect?.(item.id)}
                  >
                    <span className={styles.label}>
                      {kind === 'channel' ? `# ${item.label}` : item.label}
                    </span>
                    {unread > 0 && (
                      <span className={styles.badge} aria-label={`안 읽음 ${unread}개`}>
                        {unread}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>
      <div className={styles.body}>{children}</div>
    </div>
  )
}
