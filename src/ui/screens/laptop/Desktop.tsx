import { AppIcon } from '@/ui/kit/phone/AppIcon'
import styles from './Desktop.module.css'

interface Props {
  /** 인터넷 아이콘을 눌렀을 때. 브라우저 창이 열린다 */
  onOpenInternet: () => void
}

/**
 * 노트북의 바탕화면. 열린 창이 없을 때 보인다. 인터넷 아이콘을 누르면 브라우저가 열린다.
 * 버튼 id는 `btn_desktop_internet`이다. 실제 운영체제의 이름, 로고, 배경은 쓰지 않는다.
 */
export function Desktop({ onOpenInternet }: Props) {
  return (
    <div className={styles.desktop}>
      <ul className={styles.icons}>
        <li>
          <button
            id="btn_desktop_internet"
            type="button"
            className={styles.shortcut}
            onClick={onOpenInternet}
          >
            <span className={styles.icon}>
              <AppIcon kind="browser" />
            </span>
            인터넷
          </button>
        </li>
      </ul>
    </div>
  )
}
