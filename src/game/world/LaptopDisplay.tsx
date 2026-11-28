import { Html } from '@react-three/drei'
import { LAPTOP_SCREEN, type Vec3 } from '@/game/world/anchors'
import { laptopSignal } from '@/engine/laptopSignal'
import { useGameStore, type LaptopScreen } from '@/stores/gameStore'
import {
  isBrowserScreen,
  isBrowserSite,
  openBrowser,
  showOnLaptop,
  useLaptopStore,
  type BrowserSite,
  type BrowserTab,
} from '@/stores/laptopStore'
import { useStoryStore } from '@/stores/storyStore'
import { BrowserTabsContext } from '@/ui/screens/laptop/browserTabs'
import { Desktop } from '@/ui/screens/laptop/Desktop'
import { SITE_META } from '@/ui/screens/laptop/browserSites'
import { InaugurationCall } from '@/ui/screens/laptop/InaugurationCall'
import { InterviewAppInstall } from '@/ui/screens/laptop/InterviewAppInstall'
import { JobSiteStatus } from '@/ui/screens/laptop/JobSiteStatus'
import {
  SAMPLE_APPLICATIONS,
  SAMPLE_PORTFOLIO,
  SAMPLE_POSTINGS,
} from '@/ui/screens/laptop/jobSiteSample'
import { NewTabPage } from '@/ui/screens/laptop/NewTabPage'
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
 * 브라우저의 사이트(취업 사이트, 메일함, 검색)는 탭으로 뜨고, 열린 탭은 laptopStore에 있다.
 * 열린 창이 없으면(off) 바탕화면이 보이고, 인터넷 아이콘으로 브라우저를 다시 열 수 있다.
 * 방을 걸어 다닐 때는 그리지 않는다. Html은 3D 물체에 가려지지 않아서 벽 너머로 보이기 때문이다.
 */
export function LaptopDisplay({ visible }: { visible: boolean }) {
  const screen = useGameStore((s) => s.laptopScreen)
  if (!visible) return null

  return (
    <Html transform position={POSITION} rotation={[TILT, 0, 0]} distanceFactor={DISTANCE_FACTOR}>
      {/* 화면 속 클릭이 .game-canvas까지 올라가면 원룸의 커서 잠금이 다시 걸리려 한다 */}
      <div style={{ width: SCREEN_W, height: SCREEN_H }} onClick={(e) => e.stopPropagation()}>
        <Screen screen={screen} />
      </div>
    </Html>
  )
}

/** 브라우저에 뜨는 화면이 아닌 것(화면 전체를 쓰는 것) */
type AppScreen = Exclude<LaptopScreen, 'off' | 'browser' | BrowserSite>

function Screen({ screen }: { screen: LaptopScreen }) {
  const send = useStoryStore((s) => s.send)
  if (screen === 'off') {
    return (
      <Desktop
        onOpenInternet={() => {
          openBrowser()
          send({ type: 'interact', objectId: 'btn_desktop_internet' })
        }}
      />
    )
  }
  if (screen === 'browser' || isBrowserSite(screen)) return <BrowserWindow />
  return <AppWindow screen={screen} />
}

/**
 * 브라우저 창. 열린 탭을 모두 그려 두고 앞에 있는 탭만 보여 준다. 그래서 탭을 오가도 보던 곳이 그대로다.
 * 플레이어가 탭을 앞으로 가져오면 엔진에 laptop_tab:사이트로, 닫으면 btn_사이트_close로 알린다.
 */
function BrowserWindow() {
  const tabs = useLaptopStore((s) => s.tabs)
  const active = useLaptopStore((s) => s.active)
  const name = useGameStore((s) => s.playerName)
  const story = useStoryStore((s) => s.story)
  const send = useStoryStore((s) => s.send)
  const press = (objectId: string) => send({ type: 'interact', objectId })
  const got = new Set(story.messages.filter((m) => m.channel === 'mail').map((m) => m.id))
  // 대본이 한 번이라도 띄운 사이트가 즐겨찾기에 남는다. 처음 띄운 순서대로다
  const bookmarks = [...new Set(story.laptopLog)].filter(isBrowserSite)

  const focus = (tab: BrowserTab) => {
    useLaptopStore.getState().open(tab)
    if (tab !== 'newtab') press(laptopSignal.tab(tab))
  }
  const close = (tab: BrowserTab) => {
    const before = useLaptopStore.getState().active
    useLaptopStore.getState().close(tab)
    if (tab !== 'newtab') press(`btn_${tab}_close`)
    // 닫으면서 다른 사이트가 앞으로 왔으면 알린다. 대본이 그 신호로 노트북을 껐으면 보이지 않으니 알리지 않는다
    const after = useLaptopStore.getState().active
    const showing = isBrowserScreen(useGameStore.getState().laptopScreen)
    if (showing && after && after !== 'newtab' && after !== before) press(laptopSignal.tab(after))
  }
  const visit = (site: BrowserSite) => {
    useLaptopStore.getState().navigate(site)
    press(laptopSignal.tab(site))
  }

  if (!active) return null
  const page = (tab: BrowserTab) => {
    switch (tab) {
      case 'jobsite':
        return (
          <JobSiteStatus
            applications={SAMPLE_APPLICATIONS}
            postings={SAMPLE_POSTINGS}
            portfolio={SAMPLE_PORTFOLIO}
            portfolioViews={0}
            onClose={() => close('jobsite')}
          />
        )
      case 'mail':
        return (
          <WebMail
            // 새 메일이 위로. 불합격 메일 53통은 처음부터 있다
            mails={[...DAY1_MAILS.filter((m) => got.has(m.id)).reverse(), ...REJECTION_MAILS]}
            playerName={name}
            onAction={press}
            onClose={() => close('mail')}
          />
        )
      case 'search':
        return <SearchScreen onClose={() => close('search')} />
      case 'newtab':
        return <NewTabPage bookmarks={bookmarks} onOpen={visit} onClose={() => close('newtab')} />
    }
  }

  return (
    <BrowserTabsContext
      value={{
        tabs: tabs.map((tab) => ({
          id: tab,
          title: tab === 'newtab' ? '새 탭' : SITE_META[tab].name,
          favicon: tab === 'newtab' ? '+' : SITE_META[tab].favicon,
        })),
        active,
        onFocus: (id) => focus(id as BrowserTab),
        onClose: (id) => close(id as BrowserTab),
        onNewTab: () => useLaptopStore.getState().open('newtab'),
      }}
    >
      {tabs.map((tab) => (
        // 앞에 있지 않은 탭도 그려 둔다. Browser가 틀을 감추고 본문만 숨긴 채 둔다
        <div key={tab} style={{ display: tab === active ? 'contents' : 'none' }}>
          {page(tab)}
        </div>
      ))}
    </BrowserTabsContext>
  )
}

function AppWindow({ screen }: { screen: AppScreen }) {
  const name = useGameStore((s) => s.playerName)
  const story = useStoryStore((s) => s.story)
  const info = useStoryStore((s) => s.script.info)
  const send = useStoryStore((s) => s.send)
  const press = (objectId: string) => send({ type: 'interact', objectId })
  switch (screen) {
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
    case 'inauguration':
      return <InaugurationCall playerName={name} step="sign" signed={false} />
    case 'wipe':
      // 공유기 전원 뽑기(3D)가 생기면 stopped를 잇는다
      return <RemoteWipe stopped={false} />
  }
}

const PICKS: LaptopScreen[] = [
  'off',
  'browser',
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
  // 브라우저의 사이트를 고르면 탭도 함께 연다
  const go = showOnLaptop
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
