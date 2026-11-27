import { AppIcon, type AppIconKind } from '@/ui/kit/phone/AppIcon'
import { PhoneScreen } from '@/ui/kit/phone/PhoneScreen'
import styles from './HomeScreen.module.css'

/** 홈 화면에 놓는 앱 하나 */
export interface HomeApp<Id extends string = string> {
  id: Id
  /** 아이콘 아래에 보이는 이름 */
  label: string
  icon: AppIconKind
  /** 아이콘 오른쪽 위 빨간 동그라미의 수(읽지 않은 것). 0이거나 없으면 그리지 않는다 */
  badge?: number
}

interface Props<Id extends string> {
  /** 지금 시각 "10:11". 상태 표시줄에 쓴다 */
  time: string
  /** 화면 위쪽부터 네 개씩 놓이는 앱 */
  apps: HomeApp<Id>[]
  /** 화면 아래 받침대에 놓이는 앱. 이름은 보이지 않는다 */
  dock?: HomeApp<Id>[]
  /** 앱을 눌렀을 때. 어떤 화면을 띄울지는 받는 쪽이 정한다 */
  onOpen: (id: Id) => void
}

/** 휴대폰 홈 화면. 잠금 화면과 같은 배경 위에 앱 아이콘을 놓는다 */
export function HomeScreen<Id extends string>({ time, apps, dock = [], onOpen }: Props<Id>) {
  const button = (app: HomeApp<Id>, showLabel: boolean) => (
    <button
      type="button"
      className={styles.app}
      onClick={() => onOpen(app.id)}
      aria-label={app.badge ? `${app.label}, 읽지 않은 것 ${app.badge}개` : app.label}
    >
      <span className={styles.icon}>
        <AppIcon kind={app.icon} />
        {!!app.badge && (
          <span className={styles.badge} aria-hidden="true">
            {app.badge}
          </span>
        )}
      </span>
      {showLabel && (
        <span className={styles.label} aria-hidden="true">
          {app.label}
        </span>
      )}
    </button>
  )

  return (
    <div className={styles.wallpaper}>
      <PhoneScreen time={time}>
        <div className={styles.home}>
          <ul className={styles.grid} aria-label="앱">
            {apps.map((app) => (
              <li key={app.id}>{button(app, true)}</li>
            ))}
          </ul>
          {dock.length > 0 && (
            <ul className={styles.dock} aria-label="자주 쓰는 앱">
              {dock.map((app) => (
                <li key={app.id}>{button(app, false)}</li>
              ))}
            </ul>
          )}
        </div>
      </PhoneScreen>
    </div>
  )
}
