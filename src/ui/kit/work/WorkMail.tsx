import { WorkButton } from './WorkButton'
import styles from './WorkMail.module.css'

export interface WorkMailItem {
  /** 버튼 id는 btn_mail_open_{id}가 된다 */
  id: string
  from: string
  subject: string
  time: string
  body: string
  unread?: boolean
}

interface Props {
  /** 위에서부터 보이는 순서. 합격 메일을 맨 위에 두면 불합격 메일들 위에 도착한 장면이 된다 */
  mails: WorkMailItem[]
  /** 본문을 보고 있는 메일. 없으면 목록 */
  openId?: string | null
  onOpen?: (id: string) => void
  onBack?: () => void
}

/** 메일함: 목록과 본문 보기. 읽음 처리는 부모가 unread를 바꿔서 한다 */
export function WorkMail({ mails, openId, onOpen, onBack }: Props) {
  const open = mails.find((mail) => mail.id === openId)

  if (open) {
    return (
      <article className={styles.root}>
        <header className={styles.bar}>
          <WorkButton id="btn_mail_back" variant="secondary" onClick={onBack}>
            목록
          </WorkButton>
        </header>
        <div className={styles.reader}>
          <h2 className={styles.readerSubject}>{open.subject}</h2>
          <div className={styles.readerMeta}>
            <span className={styles.from}>{open.from}</span>
            <span className={styles.time}>{open.time}</span>
          </div>
          <p className={styles.readerBody}>{open.body}</p>
        </div>
      </article>
    )
  }

  return (
    <section className={styles.root} aria-label="메일함">
      <header className={styles.bar}>
        <h2 className={styles.title}>받은 메일함</h2>
        <span className={styles.time}>{mails.length}통</span>
      </header>
      <ul className={styles.list}>
        {mails.map((mail) => (
          <li key={mail.id}>
            <button
              type="button"
              id={`btn_mail_open_${mail.id}`}
              className={`${styles.row} ${mail.unread ? styles.unread : ''}`}
              onClick={() => onOpen?.(mail.id)}
            >
              <span className={styles.dot} aria-label={mail.unread ? '안 읽음' : undefined} />
              <span className={styles.from}>{mail.from}</span>
              <span className={styles.summary}>
                <span className={styles.subject}>{mail.subject}</span>
                <span className={styles.preview}> — {mail.body}</span>
              </span>
              <span className={styles.time}>{mail.time}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
