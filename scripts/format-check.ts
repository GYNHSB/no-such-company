// git이 추적하는 파일만 Prettier 포맷을 검사한다. pnpm format:check가 이 파일을 실행한다.
// 사용법: node scripts/format-check.ts
//
// prettier --check .는 작업 폴더 전체를 검사해서, 커밋하지 않은 개인 파일 때문에
// pre-push(pnpm check)가 막혔다. 그래서 검사 대상을 git ls-files로 한정한다.
// - .gitignore와 .prettierignore에 있는 파일, Prettier가 모르는 확장자는 건너뛴다.
// - 추적 중이지만 작업 폴더에서 지운 파일은 건너뛴다.
// 셸 파이프(xargs) 대신 Node로 짠 이유: Windows에서도 같은 명령으로 돌게 하기 위해서다.
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import * as prettier from 'prettier'

const IGNORE_PATHS = ['.gitignore', '.prettierignore']

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter((file) => file !== '' && existsSync(file))

const unformatted: string[] = []
for (const file of files) {
  const { ignored, inferredParser } = await prettier.getFileInfo(file, {
    ignorePath: IGNORE_PATHS,
  })
  if (ignored || inferredParser === null) continue
  const config = await prettier.resolveConfig(file)
  const source = await readFile(file, 'utf8')
  if (!(await prettier.check(source, { ...config, filepath: file }))) unformatted.push(file)
}

if (unformatted.length > 0) {
  for (const file of unformatted) console.warn(`[warn] ${file}`)
  console.warn(
    `[warn] 포맷이 맞지 않는 파일이 ${unformatted.length}개 있어요. pnpm format으로 고쳐요.`,
  )
  process.exitCode = 1
} else {
  console.log('git이 추적하는 파일이 모두 Prettier 포맷을 따라요.')
}
