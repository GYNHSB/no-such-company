import { Html, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import { LAPTOP_SCREEN } from '@/game/world/anchors'
import { Room } from '@/game/world/Room'
import { InterviewAppInstall } from '@/ui/screens/laptop/InterviewAppInstall'
import { JobSiteStatus } from '@/ui/screens/laptop/JobSiteStatus'
import { SAMPLE_APPLICATIONS, SAMPLE_REJECTED_TOTAL } from '@/ui/screens/laptop/jobSiteSample'
import { SearchScreen } from '@/ui/screens/laptop/SearchScreen'
import { Bubble } from '../../ui/kit/phone/Bubble'
import { Notification } from '../../ui/kit/phone/Notification'
import { PhoneScreen } from '../../ui/kit/phone/PhoneScreen'
import { WorkMessage } from '../../ui/kit/work/WorkMessage'

/**
 * 이내의 테스트 페이지. 개발 서버에서 `?sandbox=inae` 주소로 연다.
 * 주인이 자유롭게 고친다. 이 페이지만 따로 불러오므로 three·R3F·src/game을 import해도 된다.
 */
export default function SandboxPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--game-bg)',
      }}
    >
      <RoomLaptopTest />
    </main>
  )
}

// 노트북 화면은 고정 해상도로 그리고 통째로 축소한다. 3D에서도 이 크기 그대로 얹는다.
const SCREEN_W = 1280
const SCREEN_H = 800

// 노트북 화면 자리(가운데, 바라보는 방향, 너비)
const SCREEN_CENTER = LAPTOP_SCREEN.center
const SCREEN_FACING = LAPTOP_SCREEN.facing
const SCREEN_WIDTH_M = LAPTOP_SCREEN.width
// 화면을 뒤로 젖힌 각도. +Z를 보던 판을 X축으로 돌려 FACING 방향을 보게 한다
const SCREEN_TILT = -Math.asin(SCREEN_FACING[1])
// drei Html(transform)은 1px을 distanceFactor/400 m로 그린다. 1280px이 화면 너비가 되도록 맞춘다
const SCREEN_DISTANCE_FACTOR = (400 * SCREEN_WIDTH_M) / SCREEN_W
// 화면을 정면에서 보는 자리(가운데에서 바라보는 방향으로 0.45m)
const VIEW_DISTANCE = 0.45
const CAMERA_POSITION = SCREEN_CENTER.map((v, i) => v + SCREEN_FACING[i] * VIEW_DISTANCE) as [
  number,
  number,
  number,
]

/** 원룸을 불러와 노트북 화면 자리에 LaptopScreen을 얹는다. 마우스로 돌려 볼 수 있다. */
function RoomLaptopTest() {
  const [screen, setScreen] = useState<'jobsite' | 'install' | 'search'>('jobsite')
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      {/* flat: 구운 조명 색이 톤 매핑으로 바뀌지 않게 한다 (hyeopseong.tsx와 같게) */}
      <Canvas flat camera={{ position: CAMERA_POSITION, fov: 70, near: 0.05 }}>
        <ambientLight intensity={1.2} />
        <Suspense fallback={null}>
          <Room hide={ROOM_HIDE} />
          <Laptop />
          <Html
            transform
            position={SCREEN_CENTER}
            rotation={[SCREEN_TILT, 0, 0]}
            distanceFactor={SCREEN_DISTANCE_FACTOR}
          >
            <div style={{ width: SCREEN_W, height: SCREEN_H }}>
              {/* 취업 사이트 탭 닫기 → 면접 앱 설치 → 면접 입장 → 검색 → 검색 탭 닫기 → 처음 */}
              {screen === 'jobsite' ? (
                <JobSiteStatus
                  applications={SAMPLE_APPLICATIONS}
                  rejectedTotal={SAMPLE_REJECTED_TOTAL}
                  portfolioViews={0}
                  onClose={() => setScreen('install')}
                />
              ) : screen === 'install' ? (
                <InterviewAppInstall
                  company="오버레이"
                  host="박재훈"
                  onJoin={() => setScreen('search')}
                />
              ) : (
                <SearchScreen
                  onSearch={(q) => console.info('[inae] search', q)}
                  onClose={() => setScreen('jobsite')}
                />
              )}
            </div>
          </Html>
        </Suspense>
        <OrbitControls target={SCREEN_CENTER} />
      </Canvas>
    </div>
  )
}

const LAPTOP_URL = `${import.meta.env.BASE_URL}models/laptop.glb`
// 옛 노트북은 숨기고 laptop.glb로 바꿔 보여 준다. Room이 매번 다시 만들지 않게 밖에 둔다
const ROOM_HIDE = ['interact_laptop'] as const

/** 새 노트북 모델(laptop.glb)을 room.glb의 interact_laptop 자리에 둔다. 화면 위치는 옛 모델과 같다 */
function Laptop() {
  const { scene } = useGLTF(LAPTOP_URL)
  return <primitive object={scene} position={[-1.3, 0.74, 0.489]} />
}

// 2D로만 보는 노트북 테스트. 다시 보려면 SandboxPage에서 <RoomLaptopTest /> 대신 <LaptopTest />
export function LaptopTest() {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const fit = () =>
      setScale(Math.min((innerWidth * 0.9) / SCREEN_W, (innerHeight * 0.85) / SCREEN_H))
    fit()
    addEventListener('resize', fit)
    return () => removeEventListener('resize', fit)
  }, [])

  return (
    <div style={{ width: SCREEN_W * scale, height: SCREEN_H * scale }}>
      <div
        style={{
          width: SCREEN_W,
          height: SCREEN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          boxShadow: '0 0 0 16px var(--phone-frame)',
          borderRadius: 4,
        }}
      >
        <LaptopScreen />
      </div>
    </div>
  )
}

/** 회사 노트북 앱(오버레이 워크) 화면. 사이드바 + 대화 영역 */
function LaptopScreen() {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        fontFamily: 'var(--work-font)',
        background: 'var(--work-bg)',
        color: 'var(--work-ink)',
      }}
    >
      <aside
        style={{
          width: 240,
          padding: '16px 0',
          background: 'var(--work-sidebar)',
          color: 'var(--work-sidebar-ink)',
        }}
      >
        <div style={{ padding: '0 16px 16px', fontWeight: 700, fontSize: 18 }}>오버레이 워크</div>
        {['# 공지', '# 신입-온보딩', '# 인사팀'].map((ch, i) => (
          <div
            key={ch}
            style={{
              padding: '6px 16px',
              background: i === 1 ? 'var(--work-sidebar-active)' : undefined,
              color: i === 1 ? 'var(--work-sidebar-ink)' : 'var(--work-sidebar-muted)',
            }}
          >
            {ch}
          </div>
        ))}
      </aside>
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--work-line)',
            fontWeight: 700,
          }}
        >
          # 신입-온보딩
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          <WorkMessage name="김팀장" time="오전 9:02" text="{name}님 입사 축하해요!" />
          <WorkMessage
            name="김팀장"
            time="오전 9:02"
            text="급여 계좌 등록하게 신분증 사본이랑 통장 사본 여기 올려주세요."
            continued
          />
          <WorkMessage name="인사팀" time="오전 9:05" text="이 메시지는 곧 사라집니다." vanishing />
          <WorkMessage name="인사팀" time="오전 9:06" text="" deleted />
        </div>
      </section>
    </div>
  )
}

// 휴대폰 테스트. 다시 보려면 SandboxPage에서 <LaptopTest /> 대신 <PhoneTest />
export function PhoneTest() {
  return (
    <div
      style={{
        position: 'relative',
        containerType: 'inline-size', // PhoneScreen은 부모 너비(cqw)로 크기를 잡는다
        height: '85vh',
        aspectRatio: '390 / 844',
        // 아이폰 모서리(약 55pt/390pt)를 크기에 비례하게. 고정 px이면 작은 창에서 알약 모양이 됨
        borderRadius: '14% / 6.5%',
        overflow: 'hidden',
        boxShadow: '0 0 0 12px var(--phone-frame)',
      }}
    >
      <PhoneScreen time="09:03" title="메시지">
        <Notification app="하나로은행" time="지금" title="입출금 알림" body="출금 1,200,000원" />
        <Bubble side="in" text="안녕하세요, 인사팀입니다." tail={false} />
        <Bubble side="in" text="신분증 사본 보내주실 수 있나요?" />
        <Bubble side="out" text="네 잠시만요" />
      </PhoneScreen>
    </div>
  )
}
