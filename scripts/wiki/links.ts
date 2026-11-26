// 레포 wiki/ 폴더와 GitHub 위키 사이에서 파일 이름과 링크를 바꾸는 함수.
// 레포에서는 `[제목](페이지.md)` 링크를 쓰고, 위키에서는 `[제목](페이지)`를 쓴다.
// 코드 블록과 인라인 코드 안의 링크는 바꾸지 않는다.

/** 반영 워크플로가 위키 저장소에 커밋할 때 쓰는 이름. 워크플로의 git config와 같아야 한다. */
export const BOT_NAME = 'github-actions[bot]'

const REPO_HOME = 'README'
const WIKI_HOME = 'Home'

/** 레포 파일 이름(README.md)을 위키 파일 이름(Home.md)으로 바꾼다. */
export function toWikiFileName(repoFile: string): string {
  return repoFile === `${REPO_HOME}.md` ? `${WIKI_HOME}.md` : repoFile
}

/** 위키 파일 이름(Home.md)을 레포 파일 이름(README.md)으로 바꾼다. */
export function toRepoFileName(wikiFile: string): string {
  return wikiFile === `${WIKI_HOME}.md` ? `${REPO_HOME}.md` : wikiFile
}

/** `](대상)` 링크 대상만 골라 바꾼다. 펜스 코드 블록과 인라인 코드는 건너뛴다. */
function replaceLinkTargets(markdown: string, replace: (target: string) => string): string {
  let fence: string | null = null
  return markdown
    .split('\n')
    .map((line) => {
      const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line)
      if (fence !== null) {
        if (fenceMatch && fenceMatch[1].startsWith(fence)) fence = null
        return line
      }
      if (fenceMatch) {
        fence = fenceMatch[1]
        return line
      }
      // 인라인 코드는 그대로 두고, 링크 대상만 바꾼다.
      return line.replace(/(`+)[\s\S]*?\1|\]\(([^()\s<>]+)\)/g, (match, _ticks, target?: string) =>
        target === undefined ? match : `](${replace(target)})`,
      )
    })
    .join('\n')
}

/** 레포 문서의 `.md` 상대 링크를 위키 링크로 바꾼다. README.md는 Home이 된다. */
export function toWikiLinks(markdown: string): string {
  return replaceLinkTargets(markdown, (target) => {
    const match = /^(?:\.\/)?([^/:?#]+)\.md(#.*)?$/.exec(target)
    if (!match) return target
    const [, name, hash = ''] = match
    return `${name === REPO_HOME ? WIKI_HOME : name}${hash}`
  })
}

/**
 * 위키 문서의 페이지 링크를 레포의 `.md` 상대 링크로 바꾼다.
 * `pageNames`에 있는 페이지(확장자 없는 이름)로 가는 링크만 바꾸고, Home은 README.md가 된다.
 */
export function toRepoLinks(markdown: string, pageNames: ReadonlySet<string>): string {
  return replaceLinkTargets(markdown, (target) => {
    const match = /^([^/:?#.]+)(#.*)?$/.exec(target)
    if (!match) return target
    const [, rawName, hash = ''] = match
    const name = safeDecode(rawName)
    if (name === WIKI_HOME) return `${REPO_HOME}.md${hash}`
    return pageNames.has(name) ? `${name}.md${hash}` : target
  })
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
