import type { GameFile } from './WorkFileComposer'

// shortcut: 대본 데이터(src/data)에 파일 칸이 생기기 전까지 쓰는 임시 값. 칸이 생기면 그쪽에서 넘긴다.
// 서류 네 가지는 대본 1일차 장면 7 그대로다. 파일 이름, 종류, 크기는 지어냈고 플레이어 이름을 넣지 않는다.

/** 파일 선택 창의 폴더 이름 */
export const ONBOARDING_FOLDER = '입사 서류'

/** 1일차 장면 7: 팀장에게 보내는 입사 서류 (신분증 사본, 등본, 통장 사본, 졸업증명서) */
export const ONBOARDING_FILES: readonly GameFile[] = [
  { id: 'id_card', name: '신분증_사본.jpg', kind: '이미지', size: '1.2MB' },
  { id: 'resident_record', name: '등본.pdf', kind: 'PDF 문서', size: '184KB' },
  { id: 'bankbook', name: '통장_사본.jpg', kind: '이미지', size: '980KB' },
  { id: 'diploma', name: '졸업증명서.pdf', kind: 'PDF 문서', size: '212KB' },
]
