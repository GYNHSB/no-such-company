import type { ReactNode } from 'react'
import { WorkLayout } from '@/ui/kit/work/WorkLayout'
import { WORK_NAV } from './workNav'
import styles from './WorkShell.module.css'

const LOGO_URL = `${import.meta.env.BASE_URL}images/logo_moraeon.svg`

interface Props {
  /** 선택된 사이드바 항목 (workNav.ts의 id) */
  selectedId: string
  /** 사이드바 항목을 눌렀을 때. 버튼 id는 `btn_work_open_{id}` */
  onSelect?: (id: string) => void
  /** 오른쪽 본문. 메신저, 채널, 메일함, 업무 화면 */
  children: ReactNode
}

/** 모레온 워크 전체 화면: 워크스페이스 띠 + 사이드바 + 본문 */
export function WorkShell({ selectedId, onSelect, children }: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.rail}>
        <img className={styles.logo} src={LOGO_URL} alt="모레온 워크스페이스" />
      </div>
      <div className={styles.main}>
        <WorkLayout items={WORK_NAV} selectedId={selectedId} onSelect={onSelect}>
          {children}
        </WorkLayout>
      </div>
    </div>
  )
}
