import { describe, expect, it } from 'vitest'
import { toRepoFileName, toRepoLinks, toWikiFileName, toWikiLinks } from './links.ts'

describe('파일 이름', () => {
  it('README.md와 Home.md를 서로 바꾸고 나머지는 그대로 둔다', () => {
    expect(toWikiFileName('README.md')).toBe('Home.md')
    expect(toRepoFileName('Home.md')).toBe('README.md')
    expect(toWikiFileName('협업-규칙.md')).toBe('협업-규칙.md')
    expect(toRepoFileName('_Sidebar.md')).toBe('_Sidebar.md')
  })
})

describe('toWikiLinks', () => {
  it('.md 상대 링크에서 확장자를 떼고 README는 Home으로 바꾼다', () => {
    expect(toWikiLinks('[규칙](협업-규칙.md), [홈](README.md), [가이드](./Wiki-Guide.md)')).toBe(
      '[규칙](협업-규칙), [홈](Home), [가이드](Wiki-Guide)',
    )
  })

  it('앵커는 유지한다', () => {
    expect(toWikiLinks('[ADR](문서-작성-기준.md#adr-기술-결정-기록)')).toBe(
      '[ADR](문서-작성-기준#adr-기술-결정-기록)',
    )
  })

  it('외부 링크, 하위 경로, 같은 문서 앵커는 바꾸지 않는다', () => {
    const markdown = '[a](https://example.com/a.md) [b](../git.md) [c](#목차) [d](docs/x.md)'
    expect(toWikiLinks(markdown)).toBe(markdown)
  })

  it('인라인 코드와 코드 블록 안은 바꾸지 않는다', () => {
    const markdown = [
      '`[예시](ADR-0001.md)` 그리고 [진짜](ADR-0001.md)',
      '```md',
      '[예시](ADR-0001.md)',
      '```',
      '[진짜](ADR-0002.md)',
    ].join('\n')
    expect(toWikiLinks(markdown)).toBe(
      [
        '`[예시](ADR-0001.md)` 그리고 [진짜](ADR-0001)',
        '```md',
        '[예시](ADR-0001.md)',
        '```',
        '[진짜](ADR-0002)',
      ].join('\n'),
    )
  })

  it('체크리스트, 취소선, 각주는 건드리지 않는다', () => {
    const markdown = '- [ ] 할 일\n- [x] 끝남\n\n~~취소~~ 각주[^1]\n\n[^1]: 내용'
    expect(toWikiLinks(markdown)).toBe(markdown)
  })
})

describe('toRepoLinks', () => {
  const pages = new Set(['협업-규칙', '문서-작성-기준', 'Wiki-Guide'])

  it('있는 페이지로 가는 링크에 .md를 붙이고 Home은 README.md로 바꾼다', () => {
    expect(toRepoLinks('[규칙](협업-규칙), [홈](Home)', pages)).toBe(
      '[규칙](협업-규칙.md), [홈](README.md)',
    )
  })

  it('앵커는 유지하고 퍼센트 인코딩된 이름도 알아본다', () => {
    expect(
      toRepoLinks('[a](문서-작성-기준#adr) [b](%ED%98%91%EC%97%85-%EA%B7%9C%EC%B9%99)', pages),
    ).toBe('[a](문서-작성-기준.md#adr) [b](협업-규칙.md)')
  })

  it('없는 페이지, 외부 링크, 앵커, 이미 .md인 링크는 바꾸지 않는다', () => {
    const markdown = '[a](없는-페이지) [b](https://github.com) [c](#목차) [d](Wiki-Guide.md)'
    expect(toRepoLinks(markdown, pages)).toBe(markdown)
  })

  it('코드 블록 안은 바꾸지 않는다', () => {
    const markdown = '~~~\n[a](협업-규칙)\n~~~\n[a](협업-규칙)'
    expect(toRepoLinks(markdown, pages)).toBe('~~~\n[a](협업-규칙)\n~~~\n[a](협업-규칙.md)')
  })

  it('toWikiLinks와 왕복하면 원래대로 돌아온다', () => {
    const markdown = '[규칙](협업-규칙.md) [홈](README.md) [앵커](문서-작성-기준.md#adr)'
    expect(toRepoLinks(toWikiLinks(markdown), pages)).toBe(markdown)
  })
})
