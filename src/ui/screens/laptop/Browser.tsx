import { useContext, useState, type ReactNode } from 'react'
import styles from './Browser.module.css'
import { BrowserTabsContext } from './browserTabs'
import { Icon } from './icons'

interface Props {
  /** 탭 제목 */
  title: string
  /** 주소창에 보이는 주소. 가상 주소는 `.example`로 끝나게 쓴다 */
  url: string
  /** 탭의 사이트 아이콘 글자 (사이트 이름 첫 글자) */
  favicon: string
  /** 버튼 id의 화면 이름. 버튼 id는 `btn_{screen}_close`, `_back`, `_forward`, `_reload` */
  screen: string
  /** 탭의 닫기 버튼을 눌렀을 때. 없으면 닫기 버튼을 숨긴다 */
  onClose?: () => void
  /** 뒤로·앞으로. 없으면 버튼이 흐려지고 눌리지 않는다 */
  onBack?: () => void
  onForward?: () => void
  children: ReactNode
}

/**
 * 개인 노트북의 브라우저 틀. 탭, 창 버튼, 뒤로·앞으로·새로고침, 주소창, 본문.
 * BrowserTabsContext 안에서는 열린 탭을 모두 탭 줄에 그린다. 다른 탭의 버튼 id는 `btn_tab_{화면}`(앞으로 가져오기),
 * `btn_{화면}_close`(닫기)이고 새 탭 단추는 `btn_browser_newtab`이다.
 * 앞에 있지 않은 탭의 Browser는 틀을 그리지 않고 본문만 숨긴 채 둔다. 다시 앞으로 왔을 때 보던 곳이 그대로다.
 */
export function Browser({
  title,
  url,
  favicon,
  screen,
  onClose,
  onBack,
  onForward,
  children,
}: Props) {
  // 새로고침하면 본문을 다시 그려 맨 위로 돌아간다
  const [reloads, setReloads] = useState(0)
  const strip = useContext(BrowserTabsContext)
  // 탭이 여럿일 때 이 Browser가 앞에 있는 탭인지. 아니면 틀을 그리지 않는다
  const shown = !strip || strip.active === screen

  /** 이 Browser의 탭. 제목은 지금 보는 페이지에 따라 바뀐다 */
  const mine = (
    <div key={screen} className={styles.tab} aria-current={strip ? 'page' : undefined}>
      <span className={styles.favicon} aria-hidden="true">
        {favicon}
      </span>
      <span className={styles.tabTitle}>{title}</span>
      {onClose && (
        <button
          id={`btn_${screen}_close`}
          className={styles.close}
          type="button"
          aria-label="탭 닫기"
          onClick={onClose}
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  )

  return (
    <div className={styles.window} hidden={!shown}>
      {shown && (
        <div className={styles.tabs}>
          {strip
            ? strip.tabs.map((tab) =>
                tab.id === screen ? (
                  mine
                ) : (
                  <div key={tab.id} className={`${styles.tab} ${styles.behind}`}>
                    <button
                      id={`btn_tab_${tab.id}`}
                      className={styles.tabOpen}
                      type="button"
                      onClick={() => strip.onFocus(tab.id)}
                    >
                      <span className={styles.favicon} aria-hidden="true">
                        {tab.favicon}
                      </span>
                      <span className={styles.tabTitle}>{tab.title}</span>
                    </button>
                    <button
                      id={`btn_${tab.id}_close`}
                      className={styles.close}
                      type="button"
                      aria-label={`${tab.title} 탭 닫기`}
                      onClick={() => strip.onClose(tab.id)}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                ),
              )
            : mine}
          {strip ? (
            <button
              id="btn_browser_newtab"
              className={`${styles.newTab} ${styles.newTabButton}`}
              type="button"
              aria-label="새 탭"
              onClick={strip.onNewTab}
            >
              <Icon name="plus" size={16} />
            </button>
          ) : (
            // 탭이 하나뿐일 때는 진짜 브라우저처럼 보이게 하는 장식이다. 누를 수 없다
            <span className={styles.newTab} aria-hidden="true">
              <Icon name="plus" size={16} />
            </span>
          )}
          {/* 아래는 진짜 브라우저처럼 보이게 하는 장식. 누를 수 없다 */}
          <span className={styles.windowButtons} aria-hidden="true">
            <Icon name="minus" size={16} />
            <Icon name="square" size={14} />
            <Icon name="close" size={16} />
          </span>
        </div>
      )}
      {shown && (
        <div className={styles.bar}>
          <nav className={styles.nav} aria-label="페이지 이동">
            <button
              id={`btn_${screen}_back`}
              className={styles.navButton}
              type="button"
              aria-label="뒤로"
              disabled={!onBack}
              onClick={onBack}
            >
              <Icon name="back" />
            </button>
            <button
              id={`btn_${screen}_forward`}
              className={styles.navButton}
              type="button"
              aria-label="앞으로"
              disabled={!onForward}
              onClick={onForward}
            >
              <Icon name="forward" />
            </button>
            <button
              id={`btn_${screen}_reload`}
              className={styles.navButton}
              type="button"
              aria-label="새로고침"
              onClick={() => setReloads((n) => n + 1)}
            >
              <Icon name="reload" />
            </button>
          </nav>
          <div className={styles.address}>
            <Icon name="lock" size={14} />
            <span className={styles.url}>{url}</span>
            <Icon name="star" size={16} />
          </div>
          <span className={styles.profile} aria-hidden="true" />
          <span className={styles.menu} aria-hidden="true">
            <Icon name="more" />
          </span>
        </div>
      )}
      <div key={reloads} className={styles.body}>
        {children}
      </div>
    </div>
  )
}
