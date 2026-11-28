// 게임 속 작은 소리. 소리 파일 없이 브라우저의 Web Audio로 그 자리에서 만든다(라이선스 확인이 필요 없다).
// 브라우저는 사용자가 클릭하거나 키를 누르기 전에는 소리를 내지 못하게 한다. 그 전에 낸 소리는 조용히 사라진다.
// 크기 값은 노트북 스피커로 들어 보며 맞춘 것이 아니라 첫 추정값이다.

import type { Surface } from '@/game/world/zones'

/** 전체 소리 크기 */
const MASTER = 0.9
/** 발소리 크기. 아주 작게 들리도록 다른 소리보다 낮게 둔다. */
const FOOTSTEP = 0.22

let context: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null

/** 페이지 전체가 함께 쓰는 소리 장치. 처음 부를 때 만든다. */
export function audio(): { ctx: AudioContext; out: GainNode } {
  if (!context || !master) {
    context = new AudioContext()
    master = context.createGain()
    master.gain.value = MASTER
    master.connect(context.destination)
    // shortcut: 페이지가 살아 있는 동안 리스너를 지우지 않는다. 게임 화면을 여러 번 열고 닫게 되면 정리한다.
    const resume = () => void context?.resume()
    window.addEventListener('pointerdown', resume)
    window.addEventListener('keydown', resume)
  }
  return { ctx: context, out: master }
}

/** 2초짜리 흰 잡음. 걸음, 종이, 바람 소리의 재료다. */
export function noiseBuffer(): AudioBuffer {
  if (!noise) {
    const { ctx } = audio()
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  return noise
}

/** 거리(m)에 따른 소리 크기(0~1). reach만큼 떨어지면 절반이 된다. */
export function nearness(distance: number, reach: number): number {
  return 1 / (1 + (distance / reach) ** 2)
}

/** 아주 짧게 커졌다가 사라지는 크기 곡선 */
function envelope(ctx: AudioContext, at: number, attack: number, decay: number, peak: number) {
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.linearRampToValueAtTime(peak, at + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay)
  return gain
}

interface Sound {
  /** 소리가 시작하는 시각(ctx.currentTime 기준). 없으면 지금 */
  at?: number
  attack: number
  decay: number
  gain: number
  /** 왼쪽(-1) ~ 오른쪽(1) */
  pan?: number
}

/** 잡음을 걸러 만든 짧은 소리(발소리, 종이, 바스락) */
function noiseHit(s: Sound & { filter: BiquadFilterType; freq: number; q?: number }) {
  const { ctx, out } = audio()
  const at = s.at ?? ctx.currentTime
  const source = ctx.createBufferSource()
  source.buffer = noiseBuffer()
  const filter = ctx.createBiquadFilter()
  filter.type = s.filter
  filter.frequency.value = s.freq
  filter.Q.value = s.q ?? 0.7
  const panner = ctx.createStereoPanner()
  panner.pan.value = s.pan ?? 0
  source
    .connect(filter)
    .connect(envelope(ctx, at, s.attack, s.decay, s.gain))
    .connect(panner)
    .connect(out)
  source.start(at, Math.random() * 1.5)
  source.stop(at + s.attack + s.decay + 0.05)
}

/** 음 높이가 있는 짧은 소리(쿵, 딸깍). freq에서 to로 내려간다. */
function toneHit(s: Sound & { wave: OscillatorType; freq: number; to?: number; lowpass?: number }) {
  const { ctx, out } = audio()
  const at = s.at ?? ctx.currentTime
  const end = at + s.attack + s.decay
  const osc = ctx.createOscillator()
  osc.type = s.wave
  osc.frequency.setValueAtTime(s.freq, at)
  if (s.to) osc.frequency.exponentialRampToValueAtTime(s.to, end)
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = s.lowpass ?? 20000
  const panner = ctx.createStereoPanner()
  panner.pan.value = s.pan ?? 0
  osc
    .connect(filter)
    .connect(envelope(ctx, at, s.attack, s.decay, s.gain))
    .connect(panner)
    .connect(out)
  osc.start(at)
  osc.stop(end + 0.05)
}

/** 높이를 조금씩 흔들어 같은 소리가 반복되는 느낌을 줄인다 */
const vary = (amount: number) => 1 + (Math.random() * 2 - 1) * amount

/** 발소리. 장판은 둔하게, 현관 타일은 딱딱하게. side: 왼발(-1), 오른발(1) */
export function footstep(surface: Surface, side: number) {
  const pan = side * 0.15
  const v = FOOTSTEP
  if (surface === 'tile') {
    noiseHit({
      filter: 'bandpass',
      freq: 1900 * vary(0.12),
      q: 1.2,
      attack: 0.002,
      decay: 0.05,
      gain: 0.5 * v,
      pan,
    })
    toneHit({
      wave: 'sine',
      freq: 120 * vary(0.1),
      to: 80,
      attack: 0.002,
      decay: 0.05,
      gain: 0.25 * v,
      pan,
    })
  } else {
    noiseHit({
      filter: 'lowpass',
      freq: 520 * vary(0.15),
      q: 0.8,
      attack: 0.004,
      decay: 0.09,
      gain: 0.6 * v,
      pan,
    })
    toneHit({
      wave: 'sine',
      freq: 78 * vary(0.1),
      to: 52,
      attack: 0.003,
      decay: 0.08,
      gain: 0.5 * v,
      pan,
    })
  }
}

/** 전등 스위치나 스탠드를 누르는 플라스틱 딸깍 */
export function switchClick(level: number) {
  noiseHit({ filter: 'highpass', freq: 2500, attack: 0.001, decay: 0.02, gain: 0.35 * level })
  toneHit({
    wave: 'square',
    freq: 1200,
    to: 900,
    attack: 0.001,
    decay: 0.02,
    gain: 0.08 * level,
    lowpass: 4000,
  })
}

/** 웹캠 불이 켜질 때의 아주 작은 딸깍 */
export function tick(level: number) {
  toneHit({
    wave: 'square',
    freq: 2400,
    attack: 0.001,
    decay: 0.015,
    gain: 0.08 * level,
    lowpass: 5000,
  })
  noiseHit({ filter: 'highpass', freq: 4000, attack: 0.001, decay: 0.01, gain: 0.1 * level })
}

/** 심장 박동 한 번(쿵-쿵) */
export function heartbeat(at: number, level: number) {
  for (const [delay, strength] of [
    [0, 1],
    [0.28, 0.65],
  ]) {
    toneHit({
      at: at + delay,
      wave: 'sine',
      freq: 62,
      to: 44,
      attack: 0.006,
      decay: 0.13,
      gain: 0.9 * strength * level,
    })
    // 작은 스피커에서도 들리게 한 단계 높은 소리를 살짝 섞는다
    toneHit({
      at: at + delay,
      wave: 'triangle',
      freq: 124,
      to: 88,
      attack: 0.006,
      decay: 0.08,
      gain: 0.25 * strength * level,
      lowpass: 400,
    })
  }
}

/** 휴대폰 진동 패턴: [시작(초), 길이(초)]. 책상 위 휴대폰이 떨리는 모습도 이 박자를 따른다. */
export const BUZZ_PULSES: readonly (readonly [number, number])[] = [
  [0, 0.4],
  [0.6, 0.4],
]

/** 휴대폰 진동. muffled면 주머니 속이라 더 둔하게 들린다. */
export function buzz(level: number, muffled: boolean) {
  const { ctx, out } = audio()
  const now = ctx.currentTime
  for (const [start, length] of BUZZ_PULSES) {
    const at = now + start
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = 165
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = muffled ? 260 : 650
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.linearRampToValueAtTime(0.3 * level, at + 0.015)
    gain.gain.setValueAtTime(0.3 * level, at + length - 0.03)
    gain.gain.linearRampToValueAtTime(0.0001, at + length)
    osc.connect(filter).connect(gain).connect(out)
    osc.start(at)
    osc.stop(at + length + 0.05)
  }
}

/** 현관 문틈으로 우편물이 들어와 바닥에 떨어지는 소리: 덮개 딸깍 → 종이 툭 → 미끄러짐 → 덮개 닫힘 */
export function mailDrop(level: number) {
  const { ctx } = audio()
  const now = ctx.currentTime
  toneHit({
    at: now,
    wave: 'triangle',
    freq: 1800,
    to: 1500,
    attack: 0.002,
    decay: 0.06,
    gain: 0.15 * level,
  })
  noiseHit({
    at: now,
    filter: 'bandpass',
    freq: 3000,
    attack: 0.001,
    decay: 0.03,
    gain: 0.25 * level,
  })
  noiseHit({
    at: now + 0.14,
    filter: 'lowpass',
    freq: 1800,
    attack: 0.002,
    decay: 0.08,
    gain: 0.5 * level,
  })
  noiseHit({
    at: now + 0.2,
    filter: 'bandpass',
    freq: 2500,
    q: 0.8,
    attack: 0.05,
    decay: 0.25,
    gain: 0.12 * level,
  })
  toneHit({
    at: now + 0.45,
    wave: 'triangle',
    freq: 1500,
    to: 1300,
    attack: 0.002,
    decay: 0.05,
    gain: 0.1 * level,
  })
}
