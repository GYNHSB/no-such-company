import { KeyboardControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Suspense, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { keyboardMap } from '@/game/input/controls'
import { InteractionRay } from '@/game/interaction/InteractionRay'
import { LaptopView } from '@/game/player/LaptopView'
import { Player } from '@/game/player/Player'
import { START } from '@/game/world/anchors'
import { DeskPhone } from '@/game/world/DeskPhone'
import { Room } from '@/game/world/Room'
import { RoomColliders } from '@/game/world/RoomColliders'
import { Monologue } from './hyeopseong/Monologue'
import { useMonologue } from './hyeopseong/useMonologue'

// 두 손으로 쥔 휴대폰 그림(1239 x 1269, 배경 투명). 소매가 그림 아래 좌우 끝에서 잘려 있다.
const HAND_URL = `${import.meta.env.BASE_URL}images/hand_phone_day.webp`

/** 어떤 장면을 보고 있는지. room: 방을 걸어 다님, laptop: 의자에 앉아 노트북을 봄, phone: 휴대폰을 손에 쥠 */
type Scene = 'room' | 'laptop' | 'phone'
/** 화면 가운데 점이 가리키는 누를 수 있는 물건 */
type Aim = 'laptop' | 'phone' | null

/** 손 그림 안에서 휴대폰 화면이 차지하는 자리. 그림 크기에 대한 비율이라 그림을 바꾸면 이 값도 바꾼다. */
const PHONE_SCREEN = { left: 0.339, top: 0.1182, width: 0.3204, height: 0.6698 }
/** 손 그림을 화면 아래로 내리는 정도(그림 높이에 대한 비율). 소매가 잘린 그림 아래 좌우 끝을 화면 밖으로 숨긴다. */
const HAND_SINK = 0.06
/** 휴대폰을 집은 뒤 휴대폰을 꺼내는 키. code는 KeyboardEvent.code, label은 화면에 보이는 이름이다. */
const PHONE_KEY = { code: 'KeyQ', label: 'Q' }
/** 클릭하면 커서를 잠그는 영역. 버튼을 누를 때는 잠기지 않게 3D 화면으로만 한정한다. */
const VIEW_ID = 'hyeopseong-view'

/** 방에서 누를 수 있는 물건(room.glb의 interact_* 이름)과 눌렀을 때 넘어가는 장면 */
const TARGETS: Record<string, Exclude<Scene, 'room'>> = {
  interact_laptop: 'laptop',
  interact_phone: 'phone',
}

/** 납작한 상자인 휴대폰은 감춘다. 그 자리에는 DeskPhone이 휴대폰 모델을 그린다. 집은 뒤에는 가리킬 수도 없다. */
const PHONE_SLAB = ['interact_phone']

/** Suspense 안에 두면 그 안의 방과 그림을 다 불러온 뒤에 한 번 알린다 */
function Loaded({ onLoad }: { onLoad: () => void }) {
  useEffect(onLoad, [onLoad])
  return null
}

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
function Crosshair({ aim }: { aim: Aim }) {
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
          width: aim ? 14 : 6,
          height: aim ? 14 : 6,
          margin: aim ? 0 : 4,
          borderRadius: '50%',
          border: '2px solid rgb(0 0 0 / 0.6)',
          background: '#fff',
        }}
      />
      {aim && (
        <span style={panel}>
          {aim === 'laptop' ? '클릭해서 노트북 쓰기' : '클릭해서 휴대폰 집기'}
        </span>
      )}
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
 * 방을 1인칭으로 걸어 다닌다. 노트북을 누르면 의자에 앉아 화면을 가득 채워 보는 시점으로 바뀐다.
 * 책상 위 휴대폰을 누르면 휴대폰을 집어 손에 쥔 장면으로 바뀌고, 책상에서는 사라진다.
 * 그 뒤로는 오른쪽 아래 휴대폰 버튼이나 Q로 꺼내고, 내려놓기 버튼이나 Esc로 닫는다.
 */
export default function SandboxPage() {
  const [scene, setScene] = useState<Scene>('room')
  const [aim, setAim] = useState<Aim>(null)
  const [hasPhone, setHasPhone] = useState(false)

  // 다른 장면으로 넘어가면 버튼을 누를 수 있게 잠근 커서를 돌려준다. 휴대폰을 한 번 열면 집은 것으로 친다.
  const open = (next: Scene) => {
    if (next !== 'room') document.exitPointerLock()
    if (next === 'phone') setHasPhone(true)
    setAim(null)
    setScene(next)
  }

  // 방에서는 휴대폰 꺼내기 키로 휴대폰을 열고, 휴대폰을 보는 중에는 Esc로 닫는다
  useEffect(() => {
    const press = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (scene === 'room' && hasPhone && e.code === PHONE_KEY.code) {
        document.exitPointerLock()
        setAim(null)
        setScene('phone')
      } else if (scene === 'phone' && e.code === 'Escape') {
        setScene('room')
      }
    }
    window.addEventListener('keydown', press)
    return () => window.removeEventListener('keydown', press)
  }, [scene, hasPhone])

  // 방이 다 보이면 첫 독백을 한 번만 한다. 개발 모드에서 효과가 두 번 돌아도 한 번만 말하게 막는다.
  const monologue = useMonologue()
  const greeted = useRef(false)
  const { say } = monologue
  const greet = useCallback(() => {
    if (greeted.current) return
    greeted.current = true
    say('휴대폰을 어디에 뒀지...')
  }, [say])

  return (
    <main style={{ position: 'fixed', inset: 0, background: '#b9c2c9' }}>
      <div id={VIEW_ID} style={{ position: 'absolute', inset: 0 }}>
        {/* flat: 구운 조명 색이 톤 매핑으로 바뀌지 않게 한다 */}
        <Canvas flat camera={{ position: START.position, fov: 70, near: 0.05 }}>
          <color attach="background" args={['#b9c2c9']} />
          {/* 조명을 굽지 않은 물건(휴대폰, 우편물, 공유기 플러그)을 비추는 약한 빛 */}
          <ambientLight intensity={1.2} />
          <KeyboardControls map={keyboardMap}>
            {/* Rapier는 WASM을 비동기로 불러오므로 Suspense로 감싼다 */}
            <Suspense fallback={null}>
              <Physics>
                <Room hide={PHONE_SLAB} />
                <RoomColliders />
                {!hasPhone && <DeskPhone />}
                <Player active={scene === 'room'} lockSelector={`#${VIEW_ID}`} />
                <LaptopView seated={scene === 'laptop'} />
                <InteractionRay
                  enabled={scene === 'room'}
                  ignore={hasPhone ? PHONE_SLAB : undefined}
                  onAim={(id) => setAim((id && TARGETS[id]) || null)}
                  onPick={(id) => TARGETS[id] && open(TARGETS[id])}
                />
                <Loaded onLoad={greet} />
              </Physics>
            </Suspense>
          </KeyboardControls>
        </Canvas>
      </div>

      {scene === 'phone' && <PhoneInHand />}

      <Monologue line={monologue.line} onDone={monologue.next} />

      {scene === 'room' ? (
        <>
          <Crosshair aim={aim} />
          <p style={{ ...panel, position: 'absolute', left: 16, bottom: 16 }}>
            화면을 클릭하면 마우스로 둘러보고 W A S D로 걸어요. Esc를 누르면 커서가 나와요.
            <br />
            {hasPhone
              ? `가운데 점을 노트북에 맞추고 클릭해 보세요. ${PHONE_KEY.label}를 누르면 휴대폰을 꺼내요.`
              : '가운데 점을 노트북이나 휴대폰에 맞추고 클릭해 보세요.'}
          </p>
          {hasPhone && (
            <button
              type="button"
              style={{ ...panel, position: 'absolute', right: 16, bottom: 16, cursor: 'pointer' }}
              onClick={() => open('phone')}
            >
              휴대폰 ({PHONE_KEY.label})
            </button>
          )}
        </>
      ) : (
        <button
          type="button"
          style={{ ...panel, position: 'absolute', left: 16, top: 16, cursor: 'pointer' }}
          onClick={() => open('room')}
        >
          {scene === 'laptop' ? '일어나기' : '휴대폰 내려놓기'}
        </button>
      )}
    </main>
  )
}
