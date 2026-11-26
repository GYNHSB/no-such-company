import styles from './WorkMessage.module.css'

interface Props {
  name: string
  time: string
  text: string
  avatarSrc?: string
  /** 같은 사람이 연달아 보낸 메시지면 이름과 사진을 생략 */
  continued?: boolean
  /** 몇 초 뒤 사라지는 메시지 */
  vanishing?: boolean
  /** 사라지기까지 걸리는 초 (기본 5) */
  vanishSec?: number
  /** 사라진 뒤 표시 */
  deleted?: boolean
}

/** 오버레이 워크(업무 메신저)의 메시지 한 줄 */
export function WorkMessage({
  name,
  time,
  text,
  avatarSrc,
  continued,
  vanishing,
  vanishSec = 5,
  deleted,
}: Props) {
  return (
    <div className={`${styles.row} ${continued ? styles.continued : ''}`}>
      <div className={styles.gutter}>
        {!continued &&
          (avatarSrc ? (
            <img className={styles.avatar} src={avatarSrc} alt="" />
          ) : (
            <span className={styles.avatar} aria-hidden="true" />
          ))}
      </div>
      <div className={styles.main}>
        {!continued && (
          <div className={styles.meta}>
            <span className={styles.name}>{name}</span>
            <span className={styles.time}>{time}</span>
          </div>
        )}
        {deleted ? (
          <p className={`${styles.text} ${styles.deleted}`}>삭제된 메시지입니다</p>
        ) : (
          <p
            className={`${styles.text} ${vanishing ? styles.vanishing : ''}`}
            style={vanishing ? { ['--vanish-sec' as string]: `${vanishSec}s` } : undefined}
          >
            {text}
          </p>
        )}
      </div>
    </div>
  )
}
