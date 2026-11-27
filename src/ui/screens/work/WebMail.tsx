import { useState } from 'react'
import { Browser } from '@/ui/screens/laptop/Browser'
import type { Mail } from './WorkMailbox'
import styles from './WebMail.module.css'

// 글꼴 기호는 운영체제마다 모양이 달라서 선 아이콘을 직접 그린다 (24x24, 선만 사용)
const ICONS = {
  menu: 'M3 6h18M3 12h18M3 18h18',
  search: 'M11 4a7 7 0 1 0 0 14a7 7 0 0 0 0-14zM20 20l-4-4',
  compose: 'M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4',
  inbox: 'M3 13l3-8h12l3 8v6H3v-6zM3 13h5l1 3h6l1-3h5',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  sent: 'M4 4l17 8-17 8 3-8-3-8zM7 12h14',
  draft: 'M6 3h8l4 4v14H6V3zM14 3v4h4',
  spam: 'M12 3l10 18H2L12 3zM12 10v5M12 18v.01',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  more: 'M12 4.5a.5.5 0 1 0 0 1a.5.5 0 0 0 0-1zM12 11.5a.5.5 0 1 0 0 1a.5.5 0 0 0 0-1zM12 18.5a.5.5 0 1 0 0 1a.5.5 0 0 0 0-1z',
  back: 'M20 12H4M10 6l-6 6 6 6',
}

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

// 받은편지함만 열린다. 나머지 메뉴와 편지쓰기, 검색창은 모양만 있다.
const FOLDERS = [
  { label: '받은편지함', icon: 'inbox' },
  { label: '별표편지함', icon: 'star' },
  { label: '보낸편지함', icon: 'sent' },
  { label: '임시보관함', icon: 'draft' },
  { label: '스팸함', icon: 'spam' },
  { label: '휴지통', icon: 'trash' },
] as const

interface Props {
  /** 위에서부터 보이는 순서 (새 메일이 위). 읽음 처리는 부모가 unread를 바꿔서 한다 */
  mails: readonly Mail[]
  /** 제목과 본문 속 `{name}` 자리에 들어가는 플레이어 이름 */
  playerName: string
  /** 목록에서 메일을 열었을 때. 버튼 id는 `btn_mail_open_{id}` */
  onOpen?: (id: string) => void
  /** 본문의 버튼을 눌렀을 때. 버튼 id를 넘긴다 */
  onAction?: (actionId: string) => void
  /** 탭 닫기 버튼(`btn_mail_close`)을 눌렀을 때. 없으면 닫기 버튼을 숨긴다 */
  onClose?: () => void
}

/** 개인 노트북의 웹 메일: 왼쪽 메뉴 + 메일 목록과 본문 보기. 무엇을 열고 눌렀는지만 부모에게 넘긴다 */
export function WebMail({ mails, playerName, onOpen, onAction, onClose }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const fill = (text: string) => text.replaceAll('{name}', playerName)
  const open = mails.find((mail) => mail.id === openId)
  const action = open?.action
  const unreadCount = mails.filter((mail) => mail.unread).length

  return (
    <Browser
      title={unreadCount > 0 ? `받은편지함 (${unreadCount})` : '받은편지함'}
      url="mail.example/inbox"
      screen="mail"
      onClose={onClose}
    >
      <div className={styles.root}>
        <header className={styles.top}>
          <span className={styles.brand}>
            <Icon name="menu" /> 메일
          </span>
          <span className={styles.search}>
            <Icon name="search" /> 메일 검색
          </span>
          <span className={styles.me} aria-hidden="true">
            {playerName.slice(0, 1)}
          </span>
        </header>
        <div className={styles.main}>
          <nav className={styles.side} aria-label="메일 메뉴">
            <span className={styles.compose}>
              <Icon name="compose" /> 편지쓰기
            </span>
            <ul className={styles.folders}>
              {FOLDERS.map((folder, index) => (
                <li
                  key={folder.label}
                  className={`${styles.folder} ${index === 0 ? styles.current : ''}`}
                  aria-current={index === 0 ? 'page' : undefined}
                >
                  <Icon name={folder.icon} />
                  <span>{folder.label}</span>
                  {index === 0 && unreadCount > 0 && (
                    <span className={styles.folderCount}>{unreadCount}</span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          {open ? (
            <article className={styles.panel}>
              <div className={styles.tools}>
                <button
                  type="button"
                  id="btn_mail_back"
                  className={styles.back}
                  aria-label="목록으로"
                  onClick={() => setOpenId(null)}
                >
                  <Icon name="back" />
                </button>
              </div>
              <div className={styles.reader}>
                <h2 className={styles.subject}>{fill(open.subject)}</h2>
                <div className={styles.sender}>
                  <span className={styles.avatar} aria-hidden="true">
                    {open.from.slice(0, 1)}
                  </span>
                  <strong>{open.from}</strong>
                  {open.address && <span className={styles.meta}>&lt;{open.address}&gt;</span>}
                  <span className={`${styles.meta} ${styles.when}`}>{open.time}</span>
                </div>
                <p className={styles.body}>{fill(open.body)}</p>
                {action && (
                  <button
                    type="button"
                    id={action.id}
                    className={styles.action}
                    onClick={() => onAction?.(action.id)}
                  >
                    {action.label}
                  </button>
                )}
              </div>
            </article>
          ) : (
            <section className={styles.panel} aria-label="받은편지함">
              <div className={styles.tools}>
                <span className={styles.check} aria-hidden="true" />
                <Icon name="refresh" />
                <Icon name="more" />
                <span className={styles.count}>
                  1–{mails.length} / {mails.length}
                </span>
              </div>
              <ul className={styles.list}>
                {mails.map((mail) => (
                  <li key={mail.id}>
                    <button
                      type="button"
                      id={`btn_mail_open_${mail.id}`}
                      className={`${styles.row} ${mail.unread ? styles.unread : ''}`}
                      aria-description={mail.unread ? '안 읽음' : undefined}
                      onClick={() => {
                        setOpenId(mail.id)
                        onOpen?.(mail.id)
                      }}
                    >
                      <span className={styles.check} aria-hidden="true" />
                      <span className={styles.star}>
                        <Icon name="star" />
                      </span>
                      <span className={styles.from}>{mail.from}</span>
                      <span className={styles.summary}>
                        {fill(mail.subject)}
                        <span className={styles.snippet}> - {fill(mail.body)}</span>
                      </span>
                      <span className={styles.time}>{mail.time}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </Browser>
  )
}
