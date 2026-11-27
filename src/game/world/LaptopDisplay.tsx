import { Html } from '@react-three/drei'
import { LAPTOP_SCREEN, type Vec3 } from '@/game/world/anchors'
import { useGameStore, type LaptopScreen } from '@/stores/gameStore'
import { InaugurationCall } from '@/ui/screens/laptop/InaugurationCall'
import { InterviewAppInstall } from '@/ui/screens/laptop/InterviewAppInstall'
import { JobSiteStatus } from '@/ui/screens/laptop/JobSiteStatus'
import {
  SAMPLE_APPLICATIONS,
  SAMPLE_PORTFOLIO,
  SAMPLE_POSTINGS,
} from '@/ui/screens/laptop/jobSiteSample'
import { RemoteWipe } from '@/ui/screens/laptop/RemoteWipe'
import { SearchScreen } from '@/ui/screens/laptop/SearchScreen'
import { VideoInterview } from '@/ui/screens/laptop/VideoInterview'

/** 노트북 화면은 이 해상도로 그리고 화면 크기에 맞춰 줄인다(px) */
const SCREEN_W = 1280
const SCREEN_H = 800
/** drei Html(transform)은 1px을 distanceFactor/400 m로 그린다. 1280px이 화면 너비가 되도록 맞춘다 */
const DISTANCE_FACTOR = (400 * LAPTOP_SCREEN.width) / SCREEN_W
/** 화면을 뒤로 젖힌 각도. +Z를 보던 판을 X축으로 돌려 facing 방향을 보게 한다 */
const TILT = -Math.asin(LAPTOP_SCREEN.facing[1])
/** UI를 빛나는 화면 면보다 앞에 띄운다(m). 같은 자리에 두면 가장자리로 화면 면이 새어 보인다(#66) */
const LIFT = 0.002
const POSITION = LAPTOP_SCREEN.center.map((v, i) => v + LAPTOP_SCREEN.facing[i] * LIFT) as Vec3

// shortcut: 플레이어 이름 칸(#57)이 생기기 전까지 쓰는 이름. 칸이 생기면 gameStore에서 읽는다.
const PLAYER_NAME = '○○'

/**
 * 노트북 앞에 앉았을 때 화면 자리에 띄우는 UI. 무엇을 띄울지는 gameStore의 laptopScreen이 정한다.
 * 방을 걸어 다닐 때는 그리지 않는다. Html은 3D 물체에 가려지지 않아서 벽 너머로 보이기 때문이다.
 */
export function LaptopDisplay({ visible }: { visible: boolean }) {
  const screen = useGameStore((s) => s.laptopScreen)
  if (!visible || screen === 'off') return null

  return (
    <Html transform position={POSITION} rotation={[TILT, 0, 0]} distanceFactor={DISTANCE_FACTOR}>
      {/* 화면 속 클릭이 .game-canvas까지 올라가면 원룸의 커서 잠금이 다시 걸리려 한다 */}
      <div style={{ width: SCREEN_W, height: SCREEN_H }} onClick={(e) => e.stopPropagation()}>
        <Screen screen={screen} />
      </div>
    </Html>
  )
}

function Screen({ screen }: { screen: Exclude<LaptopScreen, 'off'> }) {
  const go = useGameStore((s) => s.setLaptopScreen)
  switch (screen) {
    case 'jobsite':
      return (
        <JobSiteStatus
          applications={SAMPLE_APPLICATIONS}
          postings={SAMPLE_POSTINGS}
          portfolio={SAMPLE_PORTFOLIO}
          portfolioViews={0}
          onClose={() => go('off')}
        />
      )
    case 'install':
      return <InterviewAppInstall company="오버레이" host="박재훈" onJoin={() => go('interview')} />
    case 'interview':
      return <VideoInterview playerName={PLAYER_NAME} onEnd={() => go('off')} />
    case 'search':
      return <SearchScreen onClose={() => go('off')} />
    case 'inauguration':
      return <InaugurationCall playerName={PLAYER_NAME} step="sign" signed={false} />
    case 'wipe':
      // 공유기 전원 뽑기(3D)가 생기면 stopped를 잇는다
      return <RemoteWipe stopped={false} />
  }
}

const PICKS: LaptopScreen[] = [
  'off',
  'jobsite',
  'install',
  'interview',
  'search',
  'inauguration',
  'wipe',
]

/** 개발 모드에서 노트북 화면을 골라 보는 버튼. 장면 진행(엔진)이 생기면 지운다 */
export function LaptopScreenPicker() {
  const screen = useGameStore((s) => s.laptopScreen)
  const go = useGameStore((s) => s.setLaptopScreen)
  return (
    <div
      role="group"
      aria-label="노트북 화면 고르기 (개발용)"
      // drei Html은 z-index를 아주 크게 쓰므로 그보다 위에 둔다
      style={{
        position: 'fixed',
        left: 16,
        bottom: 16,
        zIndex: 2147483647,
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
      }}
    >
      {PICKS.map((p) => (
        <button key={p} type="button" aria-pressed={p === screen} onClick={() => go(p)}>
          {p}
        </button>
      ))}
    </div>
  )
}
