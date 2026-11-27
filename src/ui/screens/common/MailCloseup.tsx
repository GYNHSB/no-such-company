import { useEffect, useState, type ReactNode } from 'react'
import type { Message } from '@/data/types'
import styles from './MailCloseup.module.css'

/** 우편물 겉봉. 자료 양식(Message)에 칸이 없어서 따로 받는다. */
export interface Envelope {
  /** 보낸 곳 */
  from: string
  /** 받는 곳 주소. 플레이어의 원룸 주소이고, 서류의 회사 주소와 같다. */
  address: string
  /** 13자리 등기번호. 있으면 "등기" 표시와 바코드를 붙인다. */
  trackingNo?: string
}

interface Props {
  /** 우편물 속 서류(자료의 channel: 'post' 메시지). from은 보낸 곳, body는 줄바꿈으로 나눈 본문 */
  message: Pick<Message, 'from' | 'body'>
  /** 플레이어 이름. {name} 자리에 글자로 들어간다(이미지에 넣지 않는다). */
  name: string
  /** 있으면 겉봉부터 보여 주고, "열어 보기"를 누르면 서류로 넘어간다 */
  envelope?: Envelope
  /** 겉봉(envelope)과 서류(letter) 중 지금 무엇을 보는지 알린다. 혼잣말을 이 순간에 맞춘다. */
  onStage?: (stage: 'envelope' | 'letter') => void
  /** 내려놓을 때. 내려놓기 버튼이나 Esc */
  onClose: () => void
}

/** {name}을 플레이어 이름으로 바꾸고, 이름만 서류에 채워 넣은 칸처럼 보이게 한다 */
function withName(text: string, name: string): ReactNode[] {
  return text.split('{name}').flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <mark key={i} className={styles.name}>
            {name}
          </mark>,
          part,
        ],
  )
}

/** 등기번호로 그린 바코드 모양. 숫자마다 굵기가 다른 막대 두 개(읽히는 진짜 바코드는 아니다) */
function Barcode({ digits }: { digits: string }) {
  let x = 0
  const bars = [...digits].flatMap((d, i) => {
    const n = Number(d)
    const wide = 1 + (n % 3)
    const thin = 1 + ((n + i) % 2)
    const out = [
      <rect key={`${i}a`} x={x} width={wide} height="24" />,
      <rect key={`${i}b`} x={x + wide + 1} width={thin} height="24" />,
    ]
    x += wide + thin + 3
    return out
  })
  return (
    <svg
      className={styles.barcode}
      viewBox={`0 0 ${x} 24`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {bars}
    </svg>
  )
}

/**
 * 현관에서 주운 우편물을 크게 보는 화면. 장면을 어둡게 가라앉히고 가운데에 우편물을 띄운다.
 * envelope가 있으면 겉봉(받는 사람, 주소, 등기 표시)부터 보여 주고, 열면 속 서류를 보여 준다.
 * 서류 본문 첫 줄에 마침표가 없으면("출석 요구서") 제목으로 크게, "이름: 값"인 줄은 표 칸으로 쓴다.
 */
export function MailCloseup({ message, name, envelope, onStage, onClose }: Props) {
  const [stage, setStage] = useState<'envelope' | 'letter'>(envelope ? 'envelope' : 'letter')
  const lines = message.body.split('\n').filter((line) => line.trim() !== '')
  const title = lines[0] && !lines[0].includes('.') ? lines[0] : null
  const rest = title ? lines.slice(1) : lines

  useEffect(() => onStage?.(stage), [stage, onStage])

  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])

  return (
    <div className={styles.scrim}>
      {stage === 'envelope' && envelope ? (
        <article
          key="envelope"
          className={styles.envelope}
          aria-label={`${envelope.from}에서 온 우편물`}
        >
          <p className={styles.sender}>{envelope.from}</p>
          {envelope.trackingNo && (
            <div className={styles.registered}>
              <span className={styles.stamp}>등기</span>
              <Barcode digits={envelope.trackingNo} />
              <span className={styles.tracking}>
                {envelope.trackingNo.slice(0, 7)}-{envelope.trackingNo.slice(7)}
              </span>
            </div>
          )}
          <div className={styles.recipient}>
            <p className={styles.address}>{envelope.address}</p>
            <p className={styles.to}>
              <mark className={styles.name}>{name}</mark> 귀하
            </p>
          </div>
        </article>
      ) : (
        <article key="letter" className={styles.paper} aria-label={`${message.from} 서류`}>
          <header className={styles.from}>{message.from}</header>
          {title && <h2 className={styles.title}>{title}</h2>}
          <div className={styles.body}>
            {rest.map((line, i) => {
              const field = line.match(/^([^:.]{1,8}):\s*(.+)$/)
              return field ? (
                <p key={i} className={styles.field}>
                  <span className={styles.label}>{field[1]}</span>
                  <span>{withName(field[2], name)}</span>
                </p>
              ) : (
                <p key={i}>{withName(line, name)}</p>
              )
            })}
          </div>
        </article>
      )}

      <div className={styles.actions}>
        {stage === 'envelope' && (
          <button type="button" className={styles.primary} onClick={() => setStage('letter')}>
            열어 보기
          </button>
        )}
        <button type="button" className={styles.close} onClick={onClose}>
          내려놓기
        </button>
      </div>
    </div>
  )
}
