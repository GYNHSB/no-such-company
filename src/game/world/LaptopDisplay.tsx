import { Html } from '@react-three/drei'
import { LAPTOP_SCREEN, type Vec3 } from '@/game/world/anchors'
import { useGameStore, type LaptopScreen } from '@/stores/gameStore'
import { useStoryStore } from '@/stores/storyStore'
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
import { DAY1_MAILS, REJECTION_MAILS } from '@/ui/screens/work/mailScript'
import { WebMail } from '@/ui/screens/work/WebMail'
import { WorkScreen } from '@/ui/screens/work/WorkScreen'

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

/**
 * 노트북 앞에 앉았을 때 화면 자리에 띄우는 UI. 무엇을 띄울지는 gameStore의 laptopScreen이 정하고,
 * 본편에서는 엔진(storyStore)이 그 값을 바꾼다. 화면 속 버튼은 엔진에 그 버튼 id로 알린다.
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
  const name = useGameStore((s) => s.playerName)
  const story = useStoryStore((s) => s.story)
  const info = useStoryStore((s) => s.script.info)
  const send = useStoryStore((s) => s.send)
  const press = (objectId: string) => send({ type: 'interact', objectId })
  const arrived = (channel: string) =>
    new Set(story.messages.filter((m) => m.channel === channel).map((m) => m.id))
  switch (screen) {
    case 'jobsite':
      return (
        <JobSiteStatus
          applications={SAMPLE_APPLICATIONS}
          postings={SAMPLE_POSTINGS}
          portfolio={SAMPLE_PORTFOLIO}
          portfolioViews={0}
          onClose={() => press('btn_jobsite_close')}
        />
      )
    case 'install':
      return (
        <InterviewAppInstall
          company="모레온"
          host="김아영"
          onJoin={() => press('btn_interview_join')}
        />
      )
    case 'interview':
      // 면접 영상이 끝나면 화면이 보내는 신호. 누르는 버튼은 아니다
      return <VideoInterview playerName={name} onEnd={() => press('interview_end')} />
    case 'mail': {
      const got = arrived('mail')
      return (
        <WebMail
          // 새 메일이 위로. 불합격 메일 53통은 처음부터 있다
          mails={[...DAY1_MAILS.filter((m) => got.has(m.id)).reverse(), ...REJECTION_MAILS]}
          playerName={name}
          onAction={press}
          onClose={() => press('btn_mail_close')}
        />
      )
    }
    case 'work':
      return (
        <WorkScreen
          info={info}
          messages={story.messages.filter((m) => m.channel === 'messenger')}
          playerName={name}
          // shortcut: 1일차 사건 id로 보냈는지 본다. 다른 날 서류·영상 요청이 생기면 엔진 기록(flag)으로 바꾼다
          docsSent={story.fired.includes('d1_documents_sent')}
          videoSent={story.fired.includes('d1_first_work')}
          onPress={press}
        />
      )
    case 'search':
      return <SearchScreen onClose={() => go('off')} />
    case 'inauguration':
      return <InaugurationCall playerName={name} step="sign" signed={false} />
    case 'wipe':
      // 공유기 전원 뽑기(3D)가 생기면 stopped를 잇는다
      return <RemoteWipe stopped={false} />
  }
}

const PICKS: LaptopScreen[] = [
  'off',
  'jobsite',
  'mail',
  'install',
  'interview',
  'work',
  'search',
  'inauguration',
  'wipe',
]

/** 개발 모드에서 노트북 화면을 골라 보는 버튼. 엔진 순서를 건너뛰고 화면만 바꾼다 */
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
