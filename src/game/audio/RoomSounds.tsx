import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import {
  DESK_LAMP,
  LAPTOP_SCREEN,
  LIGHT_SWITCH,
  SOUND_AT,
  WEBCAM,
  type Vec3,
} from '@/game/world/anchors'
import { inWebcamView } from '@/game/world/zones'
import { useGameStore } from '@/stores/gameStore'
import {
  audio,
  buzz,
  creak,
  heartbeat,
  mailDrop,
  nearness,
  noiseBuffer,
  switchClick,
  tick,
} from './sound'

/** 계속 나는 소리의 크기(가까이 갔을 때) */
const FRIDGE = 0.06
const OUTSIDE_DAY = 0.05
const OUTSIDE_NIGHT = 0.025
/** 노트북 팬은 바로 앞에 앉아도 거의 안 들릴 만큼만 */
const FAN = 0.008
const HEART = 0.5

const distance = (a: { x: number; y: number; z: number }, [x, y, z]: Vec3) =>
  Math.hypot(a.x - x, a.y - y, a.z - z)

/** 잡음을 걸러 계속 틀어 두는 소리. 크기는 gain으로 바꾼다. */
function noiseLoop(
  ctx: AudioContext,
  out: AudioNode,
  filter: BiquadFilterType,
  freq: number,
  q = 0.7,
) {
  const source = ctx.createBufferSource()
  source.buffer = noiseBuffer()
  source.loop = true
  const f = ctx.createBiquadFilter()
  f.type = filter
  f.frequency.value = freq
  f.Q.value = q
  source.connect(f).connect(out)
  source.start()
  return source
}

/** 크기를 0에서 시작하는 소리 묶음 */
function bus(ctx: AudioContext, out: AudioNode) {
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(out)
  return gain
}

/** 냉장고, 바깥, 노트북 팬 소리를 틀기 시작한다 */
function startLoops() {
  const { ctx, out } = audio()
  const fridge = bus(ctx, out)
  const hum = ctx.createOscillator()
  hum.frequency.value = 50
  const overtone = ctx.createOscillator()
  overtone.frequency.value = 100
  const overtoneGain = ctx.createGain()
  overtoneGain.gain.value = 0.4
  hum.connect(fridge)
  overtone.connect(overtoneGain).connect(fridge)
  hum.start()
  overtone.start()

  const outside = bus(ctx, out)
  const fan = bus(ctx, out)
  const sources = [
    hum,
    overtone,
    noiseLoop(ctx, fridge, 'lowpass', 180),
    noiseLoop(ctx, outside, 'lowpass', 350, 0.5),
    noiseLoop(ctx, fan, 'bandpass', 2200, 0.6),
  ]
  const stop = () => {
    for (const source of sources) source.stop()
    for (const gain of [fridge, outside, fan]) gain.disconnect()
  }
  return { fridge, outside, fan, stop }
}

/**
 * 방의 소리. 냉장고 웅웅거림, 바깥 소리, 노트북 팬은 계속 나고 가까이 갈수록 커진다.
 * 웹캠이 켜진 채 웹캠 시야에 들어가면 심장 소리가 들린다(경계심이 높을수록 빠르다).
 * 휴대폰 알림, 우편물, 웹캠 켜짐, 의자에 앉고 일어나기는 그 순간에 한 번 소리를 낸다.
 * Canvas 안에 둔다.
 */
export function RoomSounds() {
  const camera = useThree((state) => state.camera)
  const loops = useRef<ReturnType<typeof startLoops> | null>(null)

  // 효과 안에서 만들고 지운다. 개발 모드에서 효과가 두 번 돌아도 소리가 겹치거나 꺼지지 않는다.
  useEffect(() => {
    const started = startLoops()
    loops.current = started
    return () => {
      started.stop()
      loops.current = null
    }
  }, [])

  // 한 번 나는 소리. 상태가 바뀐 순간에 맞춰 낸다.
  useEffect(
    () =>
      useGameStore.subscribe((state, prev) => {
        const here = camera.position
        if (state.buzzAt !== prev.buzzAt) {
          // 주머니 속이면 몸에 붙어 둔하게, 책상 위면 나무 위에서 또렷하게 울린다
          if (state.hasPhone) buzz(0.6, true)
          else buzz(nearness(distance(here, SOUND_AT.deskPhone), 1.5), false)
        }
        if (state.mailAt !== prev.mailAt) mailDrop(nearness(distance(here, SOUND_AT.mail), 2))
        if (state.webcamOn && !prev.webcamOn) tick(nearness(distance(here, WEBCAM.position), 1))
        if ((state.view === 'laptop') !== (prev.view === 'laptop')) {
          creak(nearness(distance(here, SOUND_AT.chair), 1.5))
        }
        if (state.ceilingLight !== prev.ceilingLight) {
          switchClick(nearness(distance(here, LIGHT_SWITCH.center), 1))
        }
        if (state.deskLamp !== prev.deskLamp) {
          switchClick(nearness(distance(here, DESK_LAMP.bulb), 1))
        }
      }),
    [camera],
  )

  const heart = useRef({ level: 0, next: 0 })

  useFrame(({ camera }, delta) => {
    const l = loops.current
    if (!l) return
    const { ctx } = audio()
    const { night, webcamOn, suspicion } = useGameStore.getState()
    const here = camera.position
    const now = ctx.currentTime
    const outside = Math.max(
      nearness(distance(here, SOUND_AT.veranda), 2),
      nearness(distance(here, SOUND_AT.window), 1.6),
    )
    l.fridge.gain.setTargetAtTime(
      FRIDGE * nearness(distance(here, SOUND_AT.fridge), 1.2),
      now,
      0.15,
    )
    l.outside.gain.setTargetAtTime(
      (night ? OUTSIDE_NIGHT : OUTSIDE_DAY) * (0.15 + 0.85 * outside),
      now,
      0.3,
    )
    l.fan.gain.setTargetAtTime(FAN * nearness(distance(here, LAPTOP_SCREEN.center), 0.5), now, 0.15)

    // 심장 소리는 천천히 커지고 줄어든다
    const h = heart.current
    const watched = webcamOn && inWebcamView([here.x, here.y, here.z])
    h.level += ((watched ? 1 : 0) - h.level) * Math.min(1, delta * 1.5)
    if (h.level < 0.02) {
      h.next = 0
      return
    }
    if (h.next < now) h.next = now + 0.05
    if (now >= h.next - 0.1) {
      heartbeat(h.next, HEART * h.level)
      h.next += 60 / (70 + 50 * (suspicion / 100))
    }
  })

  return null
}
