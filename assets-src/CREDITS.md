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

## 손과 휴대폰 (`public/images/hand_phone_day.webp`, 원본 `assets-src/room/room.blend`의 `hand_phone` 장면)

- Blender 5.3에서 직접 만든 3D 모델을 Cycles로 렌더한 그림 (2026-11-26, Claude Code + Blender MCP). 외부 자료를 쓰지 않았다.
- 1280 x 1200, 배경 투명, 128 샘플. 빛은 방과 같은 두 빛(차가운 창 빛, 따뜻한 스탠드 빛).
- 휴대폰 화면 자리(그림 크기에 대한 비율): 왼쪽 0.3597, 위 0.0512, 너비 0.2805, 높이 0.6743.
