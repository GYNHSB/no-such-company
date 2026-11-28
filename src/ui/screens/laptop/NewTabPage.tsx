import type { BrowserSite } from '@/stores/laptopStore'
import { Browser } from './Browser'
import { SITE_META } from './browserSites'
import styles from './NewTabPage.module.css'

interface Props {
  /** 즐겨찾기에 보일 사이트. 게임이 진행되면서 방문할 수 있게 된 사이트가 늘어난다 */
  bookmarks: readonly BrowserSite[]
  /** 즐겨찾기를 눌렀을 때 */
  onOpen: (site: BrowserSite) => void
  /** 탭의 닫기 버튼을 눌렀을 때 */
  onClose?: () => void
}

/**
 * 브라우저의 새 탭. 즐겨찾기가 보이고, 누르면 그 사이트가 이 탭에 열린다.
 * 버튼 id는 `btn_bookmark_{사이트}`다.
 */
export function NewTabPage({ bookmarks, onOpen, onClose }: Props) {
  return (
    <Browser
      title="새 탭"
      url="즐겨찾기에서 고르세요"
      favicon="+"
      screen="newtab"
      onClose={onClose}
    >
      <div className={styles.page}>
        <h1 className={styles.title}>즐겨찾기</h1>
        {bookmarks.length === 0 ? (
          <p className={styles.empty}>아직 즐겨찾기가 없어요.</p>
        ) : (
          <ul className={styles.list}>
            {bookmarks.map((site) => (
              <li key={site}>
                <button
                  id={`btn_bookmark_${site}`}
                  type="button"
                  className={styles.bookmark}
                  onClick={() => onOpen(site)}
                >
                  <span className={styles.icon} aria-hidden="true">
                    {SITE_META[site].favicon}
                  </span>
                  <span className={styles.name}>{SITE_META[site].name}</span>
                  <span className={styles.address}>{SITE_META[site].address}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Browser>
  )
}
