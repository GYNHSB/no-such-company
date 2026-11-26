// 위키에서 사람이 직접 만들거나 고친 페이지를 레포 wiki/로 가져온다. commit은 하지 않는다.
// 사용법: node scripts/wiki/pull.ts [위키 저장소 폴더]
// 폴더를 주지 않으면 origin 레포의 위키를 임시 폴더에 받아서 쓴다.
//
// - 봇이 마지막으로 커밋한 페이지는 레포에서 반영한 그대로라 건너뛴다.
// - 내용이 없는 페이지는 건너뛴다.
// - 링크를 .md 링크로 되돌리고 Prettier로 정리한 뒤, 레포 파일과 다를 때만 쓴다.
import { execFileSync } from 'node:child_process'
import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as prettier from 'prettier'
import { lastCommitAuthor, listMarkdownFiles, REPO_WIKI_DIR } from './files.ts'
import { BOT_NAME, toRepoFileName, toRepoLinks, toWikiFileName } from './links.ts'

const wikiDir = process.argv[2] ?? (await cloneWiki())

const wikiFiles = await listMarkdownFiles(wikiDir)
const repoFiles = await listMarkdownFiles(REPO_WIKI_DIR)
const pageNames = new Set(
  [...wikiFiles, ...repoFiles.map(toWikiFileName)].map((file) => file.replace(/\.md$/, '')),
)

const pulled: string[] = []
const empty: string[] = []
for (const wikiFile of wikiFiles) {
  if (lastCommitAuthor(wikiDir, wikiFile) === BOT_NAME) continue
  const source = await readFile(join(wikiDir, wikiFile), 'utf8')
  // 내용이 없는 페이지는 가져오지 않는다. 내용을 채워 저장하면 그때 가져온다.
  if (source.trim() === '') {
    empty.push(wikiFile)
    continue
  }
  const repoFile = toRepoFileName(wikiFile)
  const target = join(REPO_WIKI_DIR, repoFile)
  const options = (await prettier.resolveConfig(target)) ?? {}
  const formatted = await prettier.format(toRepoLinks(source, pageNames), {
    ...options,
    filepath: target,
  })
  const current = await readFile(target, 'utf8').catch(() => null)
  if (current === formatted) continue
  await writeFile(target, formatted)
  pulled.push(repoFile)
}

const others = (await readdir(wikiDir)).filter((name) => name !== '.git' && !name.endsWith('.md'))
if (others.length > 0) console.warn(`가져오지 않은 파일(.md가 아님): ${others.join(', ')}`)
if (empty.length > 0) console.warn(`내용이 없어 가져오지 않은 페이지: ${empty.join(', ')}`)
console.log(
  pulled.length > 0
    ? `가져온 페이지:\n${pulled.map((file) => `- wiki/${file}`).join('\n')}`
    : '가져올 페이지 없음',
)

async function cloneWiki(): Promise<string> {
  const origin = execFileSync('git', ['config', '--get', 'remote.origin.url'], {
    encoding: 'utf8',
  }).trim()
  const dir = await mkdtemp(join(tmpdir(), 'wiki-'))
  execFileSync('git', ['clone', '--quiet', origin.replace(/\.git$/, '') + '.wiki.git', dir], {
    stdio: 'inherit',
  })
  return dir
}
