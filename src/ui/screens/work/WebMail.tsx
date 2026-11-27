import { Browser } from '@/ui/screens/laptop/Browser'
import { Icon } from '@/ui/screens/laptop/icons'
import { usePageHistory } from '@/ui/screens/laptop/pageHistory'
import type { Mail } from './WorkMailbox'
import styles from './WebMail.module.css'

// laptop/icons.tsx에 없는 메일 전용 아이콘. 같은 굵기와 크기 규칙으로 그린다 (24x24, 선만 사용)
const PATHS = {
  menu: 'M3 6h18M3 12h18M3 18h18',
  compose: 'M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4',
  inbox: 'M3 13l3-8h12l3 8v6H3v-6zM3 13h5l1 3h6l1-3h5',
  sent: 'M4 4l17 8-17 8 3-8-3-8zM7 12h14',
  spam: 'M12 3l10 18H2L12 3zM12 10v5M12 18v.01',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14',
}

function MailIcon({ name, size = 18 }: { name: keyof typeof PATHS; size?: number }) {
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

/** 목록 화면의 history 값. 메일을 열면 그 메일의 id가 된다 */
const INBOX = 'inbox'

// 받은편지함만 열린다. 나머지 메뉴와 편지쓰기, 검색창은 모양만 있다.
const FOLDERS = [
  { label: '받은편지함', icon: <MailIcon name="inbox" /> },
  { label: '별표편지함', icon: <Icon name="star" /> },
  { label: '보낸편지함', icon: <MailIcon name="sent" /> },
  { label: '임시보관함', icon: <Icon name="doc" /> },
  { label: '스팸함', icon: <MailIcon name="spam" /> },
  { label: '휴지통', icon: <MailIcon name="trash" /> },
]

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
  const { page, go, onBack, onForward } = usePageHistory(INBOX)
  const fill = (text: string) => text.replaceAll('{name}', playerName)
  const open = mails.find((mail) => mail.id === page)
  const action = open?.action
  const unreadCount = mails.filter((mail) => mail.unread).length

  return (
    <Browser
      title={unreadCount > 0 ? `받은편지함 (${unreadCount})` : '받은편지함'}
      url={open ? `mail.example/inbox/${open.id}` : 'mail.example/inbox'}
      favicon="메"
      screen="mail"
      onClose={onClose}
      onBack={onBack}
      onForward={onForward}
    >
      <div className={styles.root}>
        <header className={styles.top}>
          <span className={styles.brand}>
            <MailIcon name="menu" size={24} /> 메일
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
              <MailIcon name="compose" /> 편지쓰기
            </span>
            <ul className={styles.folders}>
              {FOLDERS.map((folder, index) => (
                <li
                  key={folder.label}
                  className={`${styles.folder} ${index === 0 ? styles.current : ''}`}
                  aria-current={index === 0 ? 'page' : undefined}
                >
                  {folder.icon}
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
                  id="btn_mail_list"
                  className={styles.back}
                  aria-label="목록으로"
                  onClick={() => go(INBOX)}
                >
                  <Icon name="back" size={20} />
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
                <Icon name="reload" />
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
                        go(mail.id)
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
