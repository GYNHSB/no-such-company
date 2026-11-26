# ADR-0003: 미니게임을 공통 계약 타입을 따르는 lazy 로딩 모듈로 구성

- **Status:** Accepted
- **Date:** 2026-11-25
- **Decision makers:** @gangyikim
- **Confidence:** Medium

## Decision

**미니게임 하나를 lazy import 단위 하나로 만들고, 모든 미니게임은 `src/minigames/contract.ts`의 `MiniGameModule` 타입을 따른다. 미니게임이 열려 있는 동안 3D 월드는 렌더링을 멈추고, WebGL을 쓰는 미니게임(PixiJS, 3D)이면 언마운트한다. 2D 미니게임은 DOM+CSS → Canvas 2D → PixiJS 순으로, 필요한 만큼만 무거운 방식을 쓴다.** 미니게임을 늘려도 첫 화면과 3D 월드가 무거워지지 않게 하고, 팀원들이 타입 하나를 기준으로 각자 미니게임을 만들 수 있게 하기 위해서다.

## Context

- 게임 안에서 미니게임을 플레이할 수 있어야 하고, 미니게임은 2D일 수 있다.
- 동작이 무겁지 않아야 하고 모바일 웹을 지원해야 한다. 모바일에서는 WebGL 컨텍스트 두 개를 동시에 돌리면 메모리가 부족해지기 쉽다.
- 여러 사람이 미니게임을 나눠 만들 가능성이 있어, 월드와 미니게임 사이의 약속을 타입으로 정해두고 싶다.
- 아직 미니게임 기획은 없다.

## Candidates

### 2D 미니게임 구현 방식

#### A. DOM + CSS (1순위)

- 퍼즐, 선택지, UI 위주 미니게임에 적합하다. 추가 의존성이 없고 가장 가볍다.

#### B. Canvas 2D (2순위)

- 움직임이 많은 액션성 미니게임에 쓴다. 추가 의존성이 없다.

#### C. PixiJS (@pixi/react 8) (필요할 때만)

- 스프라이트가 많거나 효과가 무거운 2D에 쓴다. WebGL을 쓰므로 3D 월드를 언마운트해야 컨텍스트가 하나로 유지된다.

### 미니게임 중 3D 월드 처리

- **계속 렌더링**: 화면 전환은 자연스럽지만 모바일 GPU와 메모리 부담이 커서 제외했다.
- **렌더링 정지(`frameloop="never"`)**: 채택(DOM·Canvas 2D 미니게임). GPU 작업은 멈추지만 WebGL 컨텍스트와 GPU 메모리는 그대로 남는다. 월드 상태를 유지한 채 바로 돌아올 수 있다.
- **언마운트**: 채택(WebGL을 쓰는 미니게임, 또는 메모리가 부족할 때). R3F는 루트를 언마운트할 때만 컨텍스트를 해제한다(`gl.dispose()` + `gl.forceContextLoss()`). 돌아올 때 월드를 다시 불러와야 한다.

## Evaluation

측정하지 않았다. 아직 구현한 미니게임이 없다.

참고한 정보(2026-11-25):

- npm 레지스트리: pixi.js 8.23.0, @pixi/react 8.0.5(peer `pixi.js ^8.2.6`, `react >=19.0.0`)
- R3F 9.8.2 소스: `frameloop`(`'always' | 'demand' | 'never'`)은 렌더 루프만 제어하고, WebGL 컨텍스트는 루트 언마운트 시 `disposeRenderer()`에서만 해제된다.

## Consequences

- `src/minigames/contract.ts`에 `MiniGameModule`, `MiniGameProps`, `MiniGameResult` 타입이 있다. 미니게임은 이 타입만 맞추면 월드에 붙일 수 있다.
- 화면 상태(`src/stores/gameStore.ts`)는 아직 `title | world`뿐이다. 첫 미니게임을 붙일 때 `minigame` 화면과 미니게임 목록(registry)을 추가해야 한다.
- PixiJS를 쓰는 미니게임이 생기면 번들 크기를 다시 확인해야 한다.

## Confirmation

- 미니게임마다 `MiniGameModule`을 구현하고 `load()`로 동적 import하는지 코드 리뷰에서 확인한다.
- 미니게임을 추가한 뒤 `pnpm build`에서 미니게임이 별도 청크로 나뉘는지 확인한다.

## Re-evaluation Triggers

- 첫 미니게임 기획이 나왔을 때(이 ADR의 확신도를 다시 정한다)
- 3D 월드를 배경으로 보여주면서 미니게임을 해야 하는 기획이 생길 때(렌더링 정지 원칙과 충돌)
- 미니게임 간 상태 공유나 결과 저장이 필요해져 `MiniGameResult`만으로 부족할 때
