import { createContext } from 'react'

/** 탭 줄에 보이는 탭 하나 */
export interface BrowserTabItem {
  /** 탭의 화면 이름. Browser의 screen과 같은 값이다 */
  id: string
  title: string
  favicon: string
}

/**
 * 브라우저에 탭이 여럿일 때 넘기는 것. BrowserTabsContext로 감싸면 그 안의 Browser가 탭 줄 전체를 그리고,
 * 새 탭 단추가 눌린다. 감싸지 않으면 전처럼 자기 탭 하나만 그린다.
 */
export interface BrowserTabs {
  /** 열린 탭. 왼쪽부터 */
  tabs: BrowserTabItem[]
  /** 앞에 있는 탭의 id */
  active: string
  onFocus: (id: string) => void
  onClose: (id: string) => void
  onNewTab: () => void
}

export const BrowserTabsContext = createContext<BrowserTabs | null>(null)
