// shortcut: 본문 보기는 kit WorkMail의 스타일을 빌려 다시 그린다. kit WorkMail이 보낸 주소와 본문 버튼을 받게 되면 kit 부품만 쓴다.
import { useState } from 'react'
import { WorkButton } from '@/ui/kit/work/WorkButton'
import { WorkMail, type WorkMailItem } from '@/ui/kit/work/WorkMail'
import kit from '@/ui/kit/work/WorkMail.module.css'

export interface Mail extends WorkMailItem {
  /** 보낸 주소. 본문 보기에서 이름 옆에 보인다 */
  address?: string
  /** 본문 아래 버튼. id는 대본의 interact 트리거가 가리키는 값 */
  action?: { id: string; label: string }
}

interface Props {
  /** 위에서부터 보이는 순서 (새 메일이 위). 읽음 처리는 부모가 unread를 바꿔서 한다 */
  mails: readonly Mail[]
  /** 제목과 본문 속 `{name}` 자리에 들어가는 플레이어 이름 */
  playerName: string
  /** 목록에서 메일을 열었을 때. 버튼 id는 `btn_mail_open_{id}` */
  onOpen?: (id: string) => void
  /** 본문의 버튼을 눌렀을 때. 버튼 id를 넘긴다 */
  onAction?: (actionId: string) => void
}

/** 메일함: 목록(kit WorkMail)과 본문 보기. 무엇을 열고 눌렀는지만 부모에게 넘긴다 */
export function WorkMailbox({ mails, playerName, onOpen, onAction }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const named = mails.map((mail) => ({
    ...mail,
    subject: mail.subject.replaceAll('{name}', playerName),
    body: mail.body.replaceAll('{name}', playerName),
  }))
  const open = named.find((mail) => mail.id === openId)

  if (!open) {
    return (
      <WorkMail
        mails={named}
        onOpen={(id) => {
          setOpenId(id)
          onOpen?.(id)
        }}
      />
    )
  }

  const { action } = open
  return (
    <article className={kit.root}>
      <header className={kit.bar}>
        <WorkButton id="btn_mail_back" variant="secondary" onClick={() => setOpenId(null)}>
          목록
        </WorkButton>
      </header>
      <div className={kit.reader}>
        <h2 className={kit.readerSubject}>{open.subject}</h2>
        <div className={kit.readerMeta}>
          <span className={kit.from}>{open.from}</span>
          {open.address && <span className={kit.time}>&lt;{open.address}&gt;</span>}
          <span className={kit.time}>{open.time}</span>
        </div>
        <p className={kit.readerBody}>{open.body}</p>
        {action && (
          <div className={kit.readerBody}>
            <WorkButton id={action.id} onClick={() => onAction?.(action.id)}>
              {action.label}
            </WorkButton>
          </div>
        )}
      </div>
    </article>
  )
}
