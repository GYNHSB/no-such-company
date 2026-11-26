// 레포 wiki/의 문서를 위키 저장소 작업 폴더에 반영한다. commit과 push는 워크플로가 한다.
// 사용법: node scripts/wiki/publish.ts <위키 저장소 폴더>
//
// - 레포의 문서는 위키에 덮어쓴다. 링크만 위키 링크로 바꾸고 내용은 다시 쓰지 않는다.
// - 위키에만 있는 페이지는 마지막으로 커밋한 사람을 본다.
//   - 봇: 예전에 반영했다가 레포에서 지우거나 이름을 바꾼 페이지라 지운다.
//   - 사람: 위키에서 직접 만든 페이지라 남긴다. 가져오기(pull.ts)로 레포에 들어온다.
import { readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { lastCommitAuthor, listMarkdownFiles, REPO_WIKI_DIR } from './files.ts'
import { BOT_NAME, toWikiFileName, toWikiLinks } from './links.ts'

const wikiDir = process.argv[2]
if (!wikiDir) {
  console.error('사용법: node scripts/wiki/publish.ts <위키 저장소 폴더>')
  process.exit(1)
}

const published = new Set<string>()
for (const repoFile of await listMarkdownFiles(REPO_WIKI_DIR)) {
  const wikiFile = toWikiFileName(repoFile)
  const content = await readFile(join(REPO_WIKI_DIR, repoFile), 'utf8')
  await writeFile(join(wikiDir, wikiFile), toWikiLinks(content))
  published.add(wikiFile)
}

const removed: string[] = []
const waiting: string[] = []
for (const wikiFile of await listMarkdownFiles(wikiDir)) {
  if (published.has(wikiFile)) continue
  if (lastCommitAuthor(wikiDir, wikiFile) === BOT_NAME) {
    await rm(join(wikiDir, wikiFile))
    removed.push(wikiFile)
  } else {
    waiting.push(wikiFile)
  }
}

console.log(`반영한 페이지: ${published.size}개`)
if (removed.length > 0) console.log(`레포에서 없어져 지운 페이지: ${removed.join(', ')}`)
if (waiting.length > 0) console.log(`위키에서 직접 만들어 남겨 둔 페이지: ${waiting.join(', ')}`)
