import { button, useControls } from 'leva'
import { useCallback, useRef, type CSSProperties } from 'react'
import { SUSPICION } from '@/data/rules'
import GameCanvas from '@/game/GameCanvas'
import { PHONE_KEY } from '@/game/input/controls'
import { useGameStore } from '@/stores/gameStore'
import { useMonologueStore } from '@/stores/monologueStore'
import { Monologue } from '@/ui/screens/common/Monologue'

// 두 손으로 쥔 휴대폰 그림(1239 x 1269, 배경 투명). 소매가 그림 아래 좌우 끝에서 잘려 있다.
const HAND_URL = `${import.meta.env.BASE_URL}images/hand_phone_day.webp`

/** 화면 가운데 점이 가리키는 물건(gameStore의 aim)에 맞춰 보여 줄 안내. 켜고 끄는 물건은 지금 상태를 보고 고른다. */
function aimLabel(s: ReturnType<typeof useGameStore.getState>): string | null {
  switch (s.aim) {
    case 'interact_laptop':
      return '클릭해서 노트북 쓰기'
    case 'interact_phone':
      return '클릭해서 휴대폰 집기'
    case 'bed':
      return '클릭해서 눕기'
    case 'desk_lamp':
      return s.deskLamp ? '클릭해서 스탠드 끄기' : '클릭해서 스탠드 켜기'
    case 'light_switch':
      return s.ceilingLight ? '클릭해서 불 끄기' : '클릭해서 불 켜기'
    default:
      return null
  }
}

/** 아직 이야기 진행(엔진)이 없어서, 디테일을 켜 보는 오른쪽 위 테스트 패널. 개발 서버에서만 보인다. */
function useDetailControls() {
  const game = useGameStore.getState
  useControls('디테일 테스트', {
    경계심: {
      value: SUSPICION.start,
      min: 0,
      max: SUSPICION.max,
      step: 1,
      onChange: (v: number) => game().setSuspicion(v),
    },
    웹캠: { value: false, onChange: (v: boolean) => game().setWebcam(v) },
    밤: { value: false, onChange: (v: boolean) => game().setNight(v) },
    '휴대폰 알림': button(() => game().buzzPhone()),
    '우편물 도착': button(() => game().dropMail()),
  })
}

/** 손 그림 안에서 휴대폰 화면이 차지하는 자리. 그림 크기에 대한 비율이라 그림을 바꾸면 이 값도 바꾼다. */
const PHONE_SCREEN = { left: 0.339, top: 0.1182, width: 0.3204, height: 0.6698 }
/** 손 그림을 화면 아래로 내리는 정도(그림 높이에 대한 비율). 소매가 잘린 그림 아래 좌우 끝을 화면 밖으로 숨긴다. */
const HAND_SINK = 0.06

const panel: CSSProperties = {
  margin: 0,
  padding: '8px 12px',
  border: 0,
  borderRadius: 8,
  background: 'rgb(0 0 0 / 0.6)',
  color: '#fff',
  font: 'inherit',
}

/** 화면 가운데 점. 누를 수 있는 물건을 가리키면 커지고 무엇을 하는지 알려 준다. */
function Crosshair({ label }: { label: string | null }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        display: 'grid',
        justifyItems: 'center',
        gap: 8,
        transform: 'translate(-50%, -7px)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: label ? 14 : 6,
          height: label ? 14 : 6,
          margin: label ? 0 : 4,
          borderRadius: '50%',
          border: '2px solid rgb(0 0 0 / 0.6)',
          background: '#fff',
          // 커지고 작아지는 것을 툭 바꾸지 않고 부드럽게 보여 준다
          transition: 'width 120ms ease-out, height 120ms ease-out, margin 120ms ease-out',
        }}
      />
      {label && <span style={panel}>{label}</span>}
    </div>
  )
}

/** 휴대폰을 두 손으로 쥔 장면. 화면 자리는 네모로만 두고, 실제 화면은 나중에 이 자리에 얹는다. */
function PhoneInHand() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgb(0 0 0 / 0.45)',
        backdropFilter: 'blur(6px)',
        overflow: 'hidden',
      }}
    >
      {/* 손이 화면 아래에서 올라온 것처럼 보이게 아래에 붙이고, 잘린 소매 끝은 화면 밖으로 내린다 */}
      <div
        style={{
          position: 'relative',
          flexShrink: 0,
          height: '100vh',
          aspectRatio: '1239 / 1269',
          transform: `translateY(${HAND_SINK * 100}%)`,
        }}
      >
        <img
          src={HAND_URL}
          alt="두 손으로 세로로 쥔 휴대폰"
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${PHONE_SCREEN.left * 100}%`,
            top: `${PHONE_SCREEN.top * 100}%`,
            width: `${PHONE_SCREEN.width * 100}%`,
            height: `${PHONE_SCREEN.height * 100}%`,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '8.8% / 4.1%',
            background: '#e9edf2',
            color: '#30343a',
          }}
        >
          휴대폰 화면
        </div>
      </div>
    </div>
  )
}

/**
 * 협성의 테스트 페이지. 개발 서버에서 `?sandbox=hyeopseong` 주소로 연다.
 * 주인이 자유롭게 고친다. 이 페이지만 따로 불러오므로 three·R3F·src/game을 import해도 된다.
 *
 * 방과 이동, 물건 누르기는 src/game의 GameCanvas가 하고, 무엇을 보고 있는지는 gameStore에 있다.
 * 이 페이지는 그 위에 겹치는 화면(조준점, 안내, 버튼, 손에 쥔 휴대폰, 독백)만 그린다.
 *
 * 방을 1인칭으로 걸어 다닌다. 노트북을 누르면 의자에 앉아 화면을 가득 채워 보는 시점으로 바뀐다.
 * 책상 위 휴대폰을 누르면 휴대폰을 집어 손에 쥔 장면으로 바뀌고, 책상에서는 사라진다.
 * 그 뒤로는 오른쪽 아래 휴대폰 버튼이나 Q로 꺼내고, 버튼이나 Esc로 방으로 돌아온다.
 * 침대를 누르면 누워서 천장을 본다. Esc나 버튼으로 일어난다.
 */
export default function SandboxPage() {
  useDetailControls()
  const view = useGameStore((s) => s.view)
  const hasPhone = useGameStore((s) => s.hasPhone)
  const label = useGameStore(aimLabel)
  const openView = useGameStore((s) => s.openView)
  const line = useMonologueStore((s) => s.queue[0] ?? null)
  const next = useMonologueStore((s) => s.next)

  // 방이 다 보이면 첫 독백을 한 번만 한다. 개발 모드에서 효과가 두 번 돌아도 한 번만 말하게 막는다.
  const greeted = useRef(false)
  const greet = useCallback(() => {
    if (greeted.current) return
    greeted.current = true
    useMonologueStore.getState().say('휴대폰을 어디에 뒀지...')
  }, [])

  return (
    <main style={{ position: 'fixed', inset: 0, background: '#b9c2c9' }}>
      <GameCanvas onLoad={greet} />

      {view === 'phone' && <PhoneInHand />}

      <Monologue line={line} onDone={next} />

      {view === 'room' ? (
        <>
          <Crosshair label={label} />
          <p style={{ ...panel, position: 'absolute', left: 16, bottom: 16 }}>
            화면을 클릭하면 마우스로 둘러보고 W A S D로 걸어요. Esc를 누르면 커서가 나와요.
            <br />
            {hasPhone
              ? `가운데 점을 노트북, 침대, 스탠드, 현관 옆 스위치에 맞추고 클릭해 보세요. ${PHONE_KEY.label}를 누르면 휴대폰을 꺼내요.`
              : '가운데 점을 노트북, 휴대폰, 침대, 스탠드, 현관 옆 스위치에 맞추고 클릭해 보세요.'}
          </p>
          {hasPhone && (
            <button
              type="button"
              style={{ ...panel, position: 'absolute', right: 16, bottom: 16, cursor: 'pointer' }}
              onClick={() => openView('phone')}
            >
              휴대폰 ({PHONE_KEY.label})
            </button>
          )}
        </>
      ) : (
        <button
          type="button"
          style={{ ...panel, position: 'absolute', left: 16, top: 16, cursor: 'pointer' }}
          onClick={() => openView('room')}
        >
          {view === 'phone' ? '휴대폰 내려놓기' : '일어나기'}
        </button>
      )}
    </main>
  )
}
