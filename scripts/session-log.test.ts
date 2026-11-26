import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { splitDone, toEntry } from './session-log.ts'

const NOW = new Date('2026-11-26T09:00:00.000Z')

describe('toEntry', () => {
  it('hook 입력에서 기록 한 줄을 만든다', () => {
    const stdin = JSON.stringify({ session_id: 's1', prompt: '테스트', cwd: '/repo' })

    expect(toEntry(stdin, 'chore/21-x', NOW)).toEqual({
      ts: '2026-11-26T09:00:00.000Z',
      session: 's1',
      branch: 'chore/21-x',
      prompt: '테스트',
    })
  })

  it('session_id나 prompt가 없으면 오류를 낸다', () => {
    expect(() => toEntry(JSON.stringify({ session_id: 's1' }), 'main', NOW)).toThrow()
  })
})

describe('splitDone', () => {
  it('지정한 세션의 줄만 옮기고 나머지는 남긴다', () => {
    const line = (session: string, prompt: string) =>
      JSON.stringify({ ts: NOW.toISOString(), session, branch: 'main', prompt })
    const lines = [line('s1', 'a'), line('s2', 'b'), line('s1', 'c'), line('s3', 'd')]

    expect(splitDone(lines, ['s1', 's3'])).toEqual({
      done: [lines[0], lines[2], lines[3]],
      rest: [lines[1]],
    })
  })
})

describe('hook 실행', () => {
  it('깨진 입력이면 프롬프트를 막지 않고(exit 2 아님) stdout 없이 exit 1로 끝난다', () => {
    const result = spawnSync(process.execPath, ['scripts/session-log.ts'], {
      input: '깨진 입력',
      encoding: 'utf8',
    })

    expect(result.status).toBe(1)
    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('[session-log]')
  })
})
