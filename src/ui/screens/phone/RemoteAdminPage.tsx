import { useEffect, useRef } from 'react'
import { formatDate } from './clock'
import styles from './RemoteAdminPage.module.css'

/** 원격으로 관리받는 기기 하나 */
export interface ManagedDevice {
  /** 기기 이름. "○○의 노트북" */
  name: string
  kind: 'laptop' | 'phone'
}

interface Props {
  /** 원격 관리 프로그램 이름. 노트북에 보이는 이름과 같아야 한다 */
  program: string
  /** 관리받고 있는 기기 전부 */
  devices: ManagedDevice[]
  /** 관리자 계정 주소. 5일차 취임식 초대 메일의 보낸 주소와 같은 값을 넘긴다 */
  admin: string
  /** 기기가 등록된 날 */
  registeredOn: Date
  /** 관리자가 이 기기에서 할 수 있는 일. 프로그램을 설치할 때 허용한 것과 같다 */
  permissions: string[]
  /** 이 페이지가 보였을 때. 본 것으로 무엇을 할지는 받는 쪽이 정한다 */
  onSee?: () => void
}

/** 방패 */
const SHIELD = 'M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z'

/** 기기 그림. 노트북과 휴대폰 */
const DEVICE_GLYPHS = {
  laptop: 'M5.5 6h13v9h-13zM3 18.5h18',
  phone: 'M8 3.5h8v17H8zM11 17.5h2',
} as const

/**
 * 원격 관리 프로그램의 기기 정보 페이지. 휴대폰 브라우저(BrowserApp) 안에 넣는다.
 * 내 기기들을 누가 원격으로 관리하는지(관리자 계정)를 보여 준다.
 * 피해자가 보는 만큼만 보여 준다. 원격 관리가 어떻게 동작하는지는 적지 않는다.
 */
export function RemoteAdminPage({
  program,
  devices,
  admin,
  registeredOn,
  permissions,
  onSee,
}: Props) {
  const onSeeRef = useRef(onSee)
  useEffect(() => {
    onSeeRef.current = onSee
  })
  useEffect(() => {
    onSeeRef.current?.()
  }, [])

  return (
    <main className={styles.page}>
      <header className={styles.brand}>
        <svg className={styles.shield} viewBox="0 0 24 24" aria-hidden="true">
          <path d={SHIELD} />
        </svg>
        {program}
      </header>

      <h1 className={styles.title}>기기 관리 정보</h1>
      <p className={styles.status}>
        <i aria-hidden="true" />
        기기 {devices.length}대가 원격으로 관리되고 있습니다
      </p>

      <dl className={styles.card}>
        <div>
          <dt>관리자 계정</dt>
          <dd className={styles.admin}>{admin}</dd>
        </div>
        <div>
          <dt>등록일</dt>
          <dd>{formatDate(registeredOn)}</dd>
        </div>
      </dl>

      <section aria-labelledby="remote-devices">
        <h2 id="remote-devices" className={styles.heading}>
          관리 중인 기기
        </h2>
        <ul className={styles.devices}>
          {devices.map((device) => (
            <li key={device.name}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={DEVICE_GLYPHS[device.kind]} />
              </svg>
              {device.name}
              <span>관리 중</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="remote-permissions">
        <h2 id="remote-permissions" className={styles.heading}>
          관리자에게 허용된 것
        </h2>
        <ul className={styles.permissions}>
          {permissions.map((permission) => (
            <li key={permission}>{permission}</li>
          ))}
        </ul>
      </section>

      <p className={styles.note}>
        기기에 프로그램을 설치할 때 동의한 내용입니다. 관리자만 바꿀 수 있습니다.
      </p>
    </main>
  )
}
