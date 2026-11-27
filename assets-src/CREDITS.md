# 외부 자료와 생성 기록

## 원룸 (`public/models/room.glb`, 원본 `assets-src/room/room.blend`)

### 실사 텍스처 (Poly Haven, CC0)

| 쓰인 곳            | 자료                              | 만든 사람                         | 주소                                      |
| ------------------ | --------------------------------- | --------------------------------- | ----------------------------------------- |
| 바닥 장판          | Laminate Floor 03 (1k, 색 그림만) | Charlotte Baglioni, Dario Barresi | https://polyhaven.com/a/laminate_floor_03 |
| 침대 틀, 책상 상판 | Oak Veneer 05 (1k, 색 그림만)     | Jenelle van Heerden               | https://polyhaven.com/a/oak_veneer_05     |
| 이불               | Cotton Jersey (1k, 색 그림만)     | Rico Cilliers, colormass          | https://polyhaven.com/a/cotton_jersey     |

### 직접 만든 텍스처

- 줄무늬 벽지, 흰 타일: 코드로 그린 512px 그림 (2026-11-26, Claude Code로 생성).

### 모델

- 벽, 문, 가구, 소품: 기본 도형을 조합해 직접 만듦 (2026-11-26, Claude Code + Blender MCP).
- 외부 모델은 쓰지 않았다.

### 조명 굽기

- Blender 5.3 Cycles, Diffuse(Direct + Indirect, Color 끔), 1024px, 512 샘플, 여백 2px(Extend), 2026-11-26.
- 빛: 창 안쪽 Area Light(차가운 낮빛), 책상 스탠드 Point Light(따뜻한 빛).

## 노트북 (`public/models/laptop.glb`, 원본 `assets-src/laptop/laptop.blend`)

- 기본 도형을 조합해 직접 만듦: 둥근 모서리 본체·덮개, 키보드(6줄), 터치패드, 힌지, 화면 베젤, 웹캠, 앞쪽 홈 (2026-11-26, Claude Code + Blender MCP). 외부 자료를 쓰지 않았다.
- 원점은 바닥면 가운데. 루트 이름은 `interact_laptop`이라 겨냥 판정이 그대로 된다.
- 화면(`laptop_screen`, 스스로 빛나는 면)의 방향·크기는 `room.glb`의 노트북과 같고, 가운데는 약 1mm 앞이다. 원점 기준 가운데 (0, 0.1240, -0.1097) m(glTF 좌표), 바라보는 방향 (0, 0.2571, 0.9664), 0.31 x 0.19 m.
- 조명을 굽지 않았다(두 번째 UV 없음). 게임에서는 `room.glb`의 `interact_laptop`을 감추고 그 자리(-1.3, 0.74, 0.489)에 그린다(`src/game/world/Laptop.tsx`). 조명을 다시 구울지는 원룸 담당과 정한다.

## 오버레이 로고 (`public/images/logo_overlay.svg`)

- 둥근 사각형 두 장이 겹친 모양을 SVG 코드로 직접 그림 (2026-11-27, Claude Code). 외부 자료를 쓰지 않았다.
