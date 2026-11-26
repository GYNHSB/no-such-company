// Claude Code에 입력한 프롬프트를 각자 로컬에 쌓고, /pr-log skill이 읽고 치우게 한다.
// 사용법:
//   node scripts/session-log.ts                   UserPromptSubmit hook. stdin으로 JSON을 받는다
//   node scripts/session-log.ts pending           아직 정리하지 않은 기록을 출력한다
//   node scripts/session-log.ts done <세션ID...>  정리한 세션의 줄을 logged.jsonl로 옮긴다
//
// 기록은 메인 작업 폴더의 .claude/session-logs/에 둔다(.gitignore 대상).
// 워크트리가 아니라 메인 작업 폴더에 두는 이유: 워크트리를 지울 때 기록이 같이 사라지지 않게 하기 위해서다.
import { execFileSync } from 'node:child_process'
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface Entry {
  ts: string
  session: string
  branch: string
  prompt: string
}

const SCRIPT_PATH = fileURLToPath(import.meta.url)
const USAGE = '사용법: node scripts/session-log.ts [pending | done <세션ID...>]'

export function toEntry(stdin: string, branch: string, now: Date): Entry {
  const input = JSON.parse(stdin) as { session_id?: unknown; prompt?: unknown }
  if (typeof input.session_id !== 'string' || typeof input.prompt !== 'string') {
    throw new Error('hook 입력에 session_id와 prompt가 없어요.')
  }
  return { ts: now.toISOString(), session: input.session_id, branch, prompt: input.prompt }
}

export function splitDone(
  lines: readonly string[],
  sessions: readonly string[],
): { done: string[]; rest: string[] } {
  const isDone = (line: string) => sessions.includes((JSON.parse(line) as Entry).session)
  return { done: lines.filter(isDone), rest: lines.filter((line) => !isDone(line)) }
}

// 이 파일이 있는 작업 폴더에서 git을 실행한다. 세션의 현재 폴더가 레포 밖이어도 동작한다.
function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: dirname(SCRIPT_PATH), encoding: 'utf8' }).trim()
}

function toText(lines: readonly string[]): string {
  return lines.map((line) => `${line}\n`).join('')
}

function main(): void {
  const [mode, ...sessions] = process.argv.slice(2)
  const gitCommonDir = git('rev-parse', '--path-format=absolute', '--git-common-dir')
  const logDir = join(dirname(gitCommonDir), '.claude', 'session-logs')
  const pendingPath = join(logDir, 'prompts.jsonl')

  if (mode === undefined) {
    // stdout에는 아무것도 쓰지 않는다. UserPromptSubmit hook의 stdout은 대화 문맥에 들어간다.
    const entry = toEntry(readFileSync(0, 'utf8'), git('branch', '--show-current'), new Date())
    mkdirSync(logDir, { recursive: true })
    appendFileSync(pendingPath, `${JSON.stringify(entry)}\n`)
    return
  }

  const lines = existsSync(pendingPath)
    ? readFileSync(pendingPath, 'utf8').split('\n').filter(Boolean)
    : []

  if (mode === 'pending') {
    process.stdout.write(toText(lines))
    return
  }

  if (mode === 'done' && sessions.length > 0) {
    const { done, rest } = splitDone(lines, sessions)
    mkdirSync(logDir, { recursive: true })
    appendFileSync(join(logDir, 'logged.jsonl'), toText(done))
    // shortcut: 읽고 쓰는 사이에 다른 세션의 hook이 추가한 줄은 사라질 수 있다. 실제로 잃어버리면 파일 잠금을 넣는다.
    writeFileSync(pendingPath, toText(rest))
    process.stdout.write(`${done.length}줄을 logged.jsonl로 옮겼어요.\n`)
    return
  }

  throw new Error(USAGE)
}

if (process.argv[1] !== undefined && realpathSync(process.argv[1]) === SCRIPT_PATH) {
  try {
    main()
  } catch (error: unknown) {
    // exit 2는 프롬프트 입력을 막는다. hook이 고장 나도 작업은 계속되게 1로 끝낸다.
    process.stderr.write(
      `[session-log] ${error instanceof Error ? error.message : String(error)}\n`,
    )
    process.exitCode = 1
  }
}
