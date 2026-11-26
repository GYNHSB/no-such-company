import { lazy, type ComponentType } from 'react'

/**
 * 팀원별 테스트 페이지 목록. src/sandbox/pages/의 파일 하나가 페이지 하나다.
 * 파일 이름(영어 소문자)이 페이지 이름이 되고, 주소 `?sandbox=이름`에 그대로 쓰인다.
 * 파일을 추가하면 목록에 자동으로 나온다. 페이지마다 청크가 따로 나뉘어 열 때만 불러온다.
 */
const loaders = import.meta.glob<{ default: ComponentType }>('./pages/*.tsx')

export const sandboxPages = new Map(
  Object.entries(loaders)
    .map(([path, load]) => [path.slice('./pages/'.length, -'.tsx'.length), lazy(load)] as const)
    .sort(([a], [b]) => a.localeCompare(b)),
)
