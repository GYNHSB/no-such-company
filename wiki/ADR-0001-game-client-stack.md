# ADR-0001: 게임 클라이언트 스택으로 React Three Fiber 생태계 채택

- **Status:** Accepted
- **Date:** 2026-11-25
- **Decision makers:** @gangyikim
- **Confidence:** High

## Decision

**Vite + React 19.3 + TypeScript 위에 three / React Three Fiber / drei로 3D를 그리고, 물리와 캐릭터 이동은 @react-three/rapier + ecctrl, 게임 상태는 zustand로 관리한다.** 팀의 React·TypeScript 경험을 그대로 쓰면서, 같은 개발 그룹(pmndrs)이 관리하는 라이브러리끼리 맞물려 3D 공간·이동·시점 전환을 빠르게 만들 수 있기 때문이다.

| 역할         | 패키지              | 버전    |
| ------------ | ------------------- | ------- |
| 빌드         | vite                | 8.3.8   |
| UI           | react, react-dom    | 19.3.1  |
| 3D 렌더링    | three               | 0.187.0 |
| React 렌더러 | @react-three/fiber  | 9.8.2   |
| 3D 도구 모음 | @react-three/drei   | 10.7.9  |
| 물리         | @react-three/rapier | 2.2.0   |
| 캐릭터·입력  | ecctrl              | 2.0.2   |
| 게임 상태    | zustand             | 5.1.0   |

## Context

만들 게임의 요구사항은 다음과 같다.

- 기본은 3D이고 공간 구현이 필요하다. 공간 안에서 이동하고 시점을 바꿀 수 있어야 한다.
- 게임 안에 미니게임이 있고, 미니게임은 2D일 수 있다.
- 웹 기반이며 모바일과 반응형을 지원한다.

선호사항은 세 가지다. 개발자가 React 경험이 있고, TypeScript 타입으로 소통하고 싶고, 동작과 게임 플레이가 무겁지 않아야 한다.

## Candidates

### A. React Three Fiber 생태계 (채택)

- React 컴포넌트와 훅으로 three.js 씬을 구성한다. 기존 React 경험을 그대로 쓴다.
- drei(카메라 컨트롤, 키보드 입력, glTF 로딩, LOD, 성능 도구), rapier(물리), ecctrl(캐릭터 컨트롤러)이 같은 생태계에서 버전이 맞물린다.
- 단점: React 버전 업그레이드가 R3F 지원 범위에 묶인다.

### B. Babylon.js

- 기능이 풍부한 3D 엔진. React 바인딩(react-babylonjs 4.0.2, peer `react >=19`)이 있다.
- 물리·캐릭터 컨트롤러까지 한 생태계로 버전이 맞물리는 R3F 쪽을 택했다. 바인딩의 사용성과 성능은 자세히 검토하지 않았다.

### C. PlayCanvas

- 에디터를 갖춘 웹 3D 엔진. 공식 React 바인딩(@playcanvas/react 0.11.7, 1.0 이전)이 있다.
- B와 같은 이유로 R3F 쪽을 택했다. 바인딩의 사용성과 성능은 자세히 검토하지 않았다.

### D. Unity WebGL 빌드

- 엔진 기능은 강력하지만 React·TypeScript 선호와 맞지 않고, 모바일 웹에서 무겁다는 점 때문에 제외했다. 실측 비교는 하지 않았다.

### 캐릭터 컨트롤러: ecctrl vs Rapier 캐릭터 컨트롤러 직접 구현

- ecctrl을 채택했다. 이동, 점프, 경사로 처리와 터치용 가상 조이스틱(`ecctrl/input`)이 이미 있어 프로토타입이 빠르다.
- 직접 구현은 자유도가 높지만 초기 비용이 크다. ecctrl이 맞지 않으면 직접 구현으로 바꾼다(재평가 조건 참고).

## Evaluation

**호환성** (npm 레지스트리 peerDependencies, 2026-11-25 확인)

- @react-three/fiber 9.8.2: `react >=19 <19.4`
- @react-three/rapier 2.2.0: `@react-three/fiber ^9.0.4`, `react ^19`
- ecctrl 2.0.2: `@react-three/drei >=10.7`, `@react-three/fiber >=9.4`, `@react-three/rapier >=2.2.0`, `react >=19.2.7`, `three >=0.184.0`, 선택(optional) peer로 `leva >=0.10.1`
- 바인딩 버전(npm 레지스트리): react-babylonjs 4.0.2, @playcanvas/react 0.11.7
- R3F v10은 아직 alpha(`10.0.0-alpha.6`, 2026-10-17)라서 안정판 v9를 쓴다.
- 설치 후 `pnpm peers check` 결과: peer 의존성 문제 없음.

**번들 크기** (`pnpm build`, Vite 8.3.8, 2026-11-25)

| 청크                                 | 크기        | gzip        |
| ------------------------------------ | ----------- | ----------- |
| 첫 화면 `index-*.js` (React, 타이틀) | 223.05 kB   | 70.12 kB    |
| 3D 월드 `GameCanvas-*.js` (lazy)     | 3,256.20 kB | 1,112.33 kB |

3D 월드 청크 중 약 2.09 MB는 Rapier 물리 엔진 WASM(디코딩 시 1,569,397 bytes)이 `@dimforge/rapier3d-compat` 0.19.2(`@react-three/rapier` 2.2.0의 의존성, pnpm-lock.yaml 기준)에 의해 base64 문자열로 JS 안에 들어간 것이다(빌드 산출물에서 base64를 디코딩해 WASM 헤더 확인).

**동작 확인** (2026-11-25, 데스크톱 Chrome, `pnpm dev`)

- 타이틀 → 시작 → 3D 월드 진입, 키보드(W/D)로 캐릭터 이동, 카메라 추적 동작. 콘솔 오류 없음.
- 모바일 실기기와 가상 조이스틱은 확인하지 않았다.

## Consequences

- React 경험으로 3D 씬과 HUD를 같은 방식으로 작성한다. HUD·메뉴는 DOM으로 캔버스 위에 올린다.
- React는 `~19.3.1`로 고정한다. R3F가 19.4를 지원하기 전에는 React를 올리지 않는다.
- three·R3F·Rapier는 lazy import로 첫 화면 번들과 분리했지만, 3D 월드 진입 시 gzip 약 1.1 MB를 받는다. 모바일 로딩 화면과 진행률 표시가 필요하다.
- Rapier WASM이 base64로 들어가 원본 WASM보다 커진다. `@react-three/rapier`가 compat 패키지를 쓰므로 지금은 바꿀 수 없다.
- ecctrl v2는 입력을 직접 읽지 않고 `setMovement()`로 받는다. 키보드·조이스틱·버튼을 합치는 입력 계층(`src/game/input`)을 우리가 유지한다.
- leva(수치 조절 패널)는 개발용 도구로 devDependencies에 둔다. ecctrl의 선택 peer라서 ecctrl 디버그 패널(`ecctrl/leva`)을 쓸 때도 이것을 쓴다.
- 개발 모드 성능 패널은 drei `StatsGl`을 쓴다([ADR-0002](ADR-0002-dev-toolchain.md) 참고).

## Confirmation

- `pnpm peers check`에서 peer 의존성 문제가 없어야 한다.
- `pnpm build`가 통과하고, 3D 월드 코드가 `GameCanvas-*.js` 별도 청크로 분리되어야 한다.
- `pnpm e2e` 스모크 테스트(데스크톱, iPhone 15, Pixel 7 에뮬레이션)에서 시작 후 3D 캔버스가 보여야 한다.

## Re-evaluation Triggers

- R3F v10이 안정판이 되거나, React 19.4 이상이 필요한데 R3F가 지원하지 않을 때
- 1인칭·3인칭 시점 전환이나 이동 구현에서 ecctrl이 막히거나, ecctrl 릴리스가 6개월 이상 멈출 때 → Rapier 캐릭터 컨트롤러 직접 구현 검토
- 목표 모바일 기기에서 3D 월드 진입 로딩이 허용 범위를 넘을 때 → 청크 분할·에셋 압축 우선, 그래도 안 되면 스택 재검토 (목표 기기와 허용 기준은 아직 정하지 않았다. 첫 기획 때 정한다)
- 물리 상호작용 없이 충돌만 필요하다는 것이 확인되어 Rapier 용량이 과하다고 판단될 때
