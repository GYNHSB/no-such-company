import type { CSSProperties, ReactNode } from 'react'
import { PhoneScreen } from '@/ui/kit/phone/PhoneScreen'

/**
 * 테스트용 휴대폰 홈 화면. 메모 앱만 열린다. 다른 아이콘은 자리만 보여 주는 꾸밈이다.
 * 진짜 홈 화면은 휴대폰 묶음(#35, 김강이) 담당이라, 이 파일은 협성 테스트 페이지에서만 쓴다.
 */
export function PhoneHomeTest({ time, onOpenNotes }: { time: string; onOpenNotes: () => void }) {
  return (
    <PhoneScreen time={time}>
      <div style={grid}>
        {['메시지', '은행', 'SNS', '블라블라', '전화', '설정'].map((name) => (
          <App key={name} name={name} dim>
            <span style={{ ...tile, background: 'var(--phone-surface-2)' }} />
          </App>
        ))}
        <App name="메모" onOpen={onOpenNotes}>
          <span style={{ ...tile, ...notesTile }}>
            <span style={notesBar} />
            <span style={notesLines} />
          </span>
        </App>
      </div>
    </PhoneScreen>
  )
}

function App({
  name,
  dim,
  onOpen,
  children,
}: {
  name: string
  dim?: boolean
  onOpen?: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={dim}
      style={{ ...appButton, opacity: dim ? 0.35 : 1 }}
      aria-label={dim ? `${name} (테스트에서는 열리지 않음)` : `${name} 열기`}
    >
      {children}
      <span style={appName}>{name}</span>
    </button>
  )
}

const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 'calc(var(--pt) * 24) calc(var(--pt) * 12)',
  padding: 'calc(var(--pt) * 24) calc(var(--pt) * 8)',
}
const appButton: CSSProperties = {
  display: 'grid',
  justifyItems: 'center',
  gap: 'calc(var(--pt) * 6)',
  padding: 0,
  border: 0,
  background: 'none',
  color: 'var(--phone-ink)',
  font: 'inherit',
  cursor: 'pointer',
}
const tile: CSSProperties = {
  position: 'relative',
  display: 'block',
  width: 'calc(var(--pt) * 60)',
  height: 'calc(var(--pt) * 60)',
  overflow: 'hidden',
  borderRadius: 'calc(var(--pt) * 14)',
}
// 메모 아이콘: 흰 종이에 주황 띠와 줄(실제 앱 아이콘을 베끼지 않은 일반적인 메모 모양)
const notesTile: CSSProperties = { background: 'var(--phone-ink)' }
const notesBar: CSSProperties = {
  position: 'absolute',
  inset: '0 0 auto',
  height: '26%',
  background: 'var(--phone-orange)',
}
const notesLines: CSSProperties = {
  position: 'absolute',
  inset: '38% 14% 12%',
  background:
    'repeating-linear-gradient(to bottom, var(--phone-faint) 0 calc(var(--pt) * 1.5), transparent calc(var(--pt) * 1.5) calc(var(--pt) * 9))',
}
const appName: CSSProperties = { fontSize: 'calc(var(--pt) * 12)' }
