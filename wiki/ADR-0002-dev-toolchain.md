# ADR-0002: 개발 툴체인으로 TypeScript 7 + oxlint + Prettier + pnpm + Node 26 채택

- **Status:** Accepted
- **Date:** 2026-11-25
- **Decision makers:** @gangyikim
- **Confidence:** High

## Decision

**Vite 공식 React-TS 템플릿의 기본 구성(TypeScript 7 + oxlint)을 그대로 쓰고, 포맷은 Prettier, 패키지 매니저는 pnpm, Node는 26 LTS로 고정한다. 테스트는 Vitest(로직)와 Playwright(데스크톱·모바일 스모크)로 한다.** 공식 템플릿과 어긋나지 않으면서, 선언하지 않은 의존성 사용을 구조적으로 막고 팀원 간 실행 환경을 맞추기 위해서다.

| 역할           | 선택                                                             | 버전             |
| -------------- | ---------------------------------------------------------------- | ---------------- |
| 언어           | typescript                                                       | ~7.0.2           |
| 린트           | oxlint (`.oxlintrc.json`, react·typescript·oxc 플러그인)         | 1.95.0           |
| 포맷           | prettier                                                         | 3.10.1           |
| 패키지 매니저  | pnpm (`packageManager` 필드)                                     | 12.23.0          |
| Node           | `.nvmrc` = 26, `engines` = `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0` | 26 LTS           |
| 단위 테스트    | vitest                                                           | 5.1.1            |
| E2E            | @playwright/test (Desktop Chrome, iPhone 15, Pixel 7)            | 1.65.1           |
| 개발 성능 패널 | drei `StatsGl`                                                   | drei 10.7.9 내장 |

## Context

빈 레포에 게임 클라이언트 스택([ADR-0001](ADR-0001-game-client-stack.md))을 올리면서 언어 버전, 린트, 포맷, 패키지 매니저, Node 버전, 테스트 도구를 정해야 했다. 로컬 환경은 Node 25.2.1(LTS 아님)과 npm 11.6.2만 있었고 pnpm은 없었다.

## Candidates

### 린트: A. TypeScript 7 + oxlint (채택) / B. TypeScript 6.0.3 + ESLint

- A는 `create-vite` 9.3.4의 `react-ts` 템플릿 기본값이다. TS 7은 네이티브 컴파일러라 타입 검사가 빠르다.
- B는 ESLint 플러그인 생태계를 쓸 수 있지만 TS를 6으로 내려야 한다(평가 참고).

### 포맷: A. Prettier (채택) / B. oxfmt

- Prettier는 3.x 안정판이고 에디터 확장이 보편적이다.
- oxfmt(0.80.0)는 oxlint와 같은 계열이라 빠르지만 1.0 이전이라 버전이 오르면 포맷 결과가 바뀔 수 있다.

### 패키지 매니저: A. pnpm (채택) / B. npm + knip / C. npm만

- 선언하지 않은 의존성(유령 의존성)을 막는 방법을 비교했다.
- pnpm은 설치 구조 자체로 막고, 의존성의 설치 스크립트도 기본으로 실행하지 않는다. 대신 팀원마다 pnpm을 설치해야 한다.
- npm + knip은 추가 설치가 없지만 검사를 돌려야 잡히고, 우리 소스 코드만 검사한다.

### Node: A. 26 LTS (채택) / B. 24 LTS / C. 고정하지 않음

- 26은 현재 Active LTS, 24는 이전 LTS다. 고정하지 않으면 팀원마다 버전이 달라질 수 있다.

### 개발 성능 패널: A. drei `StatsGl` (채택) / B. r3f-perf

- 처음에는 r3f-perf를 설치했으나 오래된 drei와 React 18 계열 의존성을 끌고 와서 제거했다(평가 참고).

## Evaluation

모두 2026-11-25에 확인했다.

- **TS 7과 ESLint 호환**: `typescript-eslint` 8.74.0과 `@typescript-eslint/parser`의 peer 범위가 `typescript >=4.8.4 <6.1.0`이다(npm 레지스트리). TS 7과 함께 쓸 수 없다.
- **oxlint로 유령 의존성 검사 가능 여부**: `oxlint --rules`(1.95.0)에 `import/no-extraneous-dependencies` 규칙이 없다.
- **knip**: 6.48.0, `oxc-parser` 기반이라 TypeScript 버전과 무관하다(npm 레지스트리 dependencies).
- **Node 릴리스 상태** (nodejs.org/dist/index.json): v26.13.1 LTS(Lithium), v24.22.3 LTS(Krypton). v25 계열의 마지막 릴리스는 v25.9.0(2026-03-31)이다.
- **vitest 5.1.1 engines**: `^22.12.0 || ^24.0.0 || >=26.0.0`. Node 25에서는 설치 시 경고가 나온다(테스트 실행은 됨).
- **r3f-perf 7.2.3**: dependencies에 `@react-three/drei ^9.103.0`, `zustand ~4.5.2`가 있고 마지막 수정이 2024-11-08이다. 설치 후 `pnpm peers check`가 React 18용 peer 불일치를 보고했고, 제거 후에는 문제가 없었다.
- **구성 검증**: `pnpm check`(tsc -b, oxlint, prettier --check, vitest 2건)와 `pnpm build` 모두 통과.

## Consequences

- 팀원은 pnpm 12를 설치해야 한다(`npm i -g pnpm@12`). 로컬 Node가 25라면 26 LTS로 올려야 한다.
- ESLint 전용 규칙과 플러그인은 쓸 수 없다. React 훅 규칙은 oxlint의 `react/rules-of-hooks`로 대신한다.
- 유령 의존성은 pnpm 설치 구조가 막는다. 별도 린트 규칙은 두지 않는다.
- Playwright 브라우저(chromium, webkit)는 각자 한 번 설치해야 E2E를 돌릴 수 있다.
- 스크립트: `pnpm check`(타입·린트·포맷·단위 테스트), `pnpm e2e`, `pnpm dev:host`(실기기 확인).

## Confirmation

- `pnpm check`(tsc -b, oxlint, prettier --check, vitest)와 `pnpm build`가 통과해야 한다.
- `pnpm peers check`에서 문제가 없어야 한다.

## Re-evaluation Triggers

- 꼭 필요한 ESLint 전용 규칙이 생기고 typescript-eslint가 TS 7을 지원할 때
- oxfmt가 1.0을 내고 Prettier 대비 속도 차이가 체감될 만큼 코드가 커질 때
- TS 7과 호환되지 않는 필수 도구가 생길 때
- pnpm의 엄격한 설치 구조 때문에 동작하지 않는 필수 라이브러리가 생길 때
- 다음 Node LTS(27)가 나올 때. nodejs/Release `schedule.json` 기준 2027-10-20 LTS 전환 예정
