import { execFileSync } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

/** 레포의 위키 원본 폴더 */
export const REPO_WIKI_DIR = fileURLToPath(new URL('../../wiki', import.meta.url))

/** 폴더 바로 아래의 .md 파일 이름. 하위 폴더는 보지 않는다. */
export async function listMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort()
}

/** 위키 저장소에서 파일을 마지막으로 커밋한 사람의 이름. 커밋된 적이 없으면 빈 문자열이다. */
export function lastCommitAuthor(wikiDir: string, file: string): string {
  return execFileSync('git', ['-C', wikiDir, 'log', '-1', '--format=%an', '--', file], {
    encoding: 'utf8',
  }).trim()
}
