/** 메시지에 붙은 업무 자료. 대본의 `[검수 요청] "…"`, `[고객명단_월요일] …` 한 줄 */
export interface MessageTask {
  /** 대괄호 안의 이름 */
  label: string
  /** 대괄호 뒤의 내용 */
  content: string
}

const TASK_LINE = /^\[(.+?)\]\s*(.+)$/

/** 메시지 본문에서 `[이름] 내용` 줄을 업무 자료로 떼어 내고, 나머지 줄은 글로 돌려준다 */
export function splitTasks(body: string): { text: string; tasks: MessageTask[] } {
  const lines = body.split('\n')
  return {
    text: lines.filter((line) => !TASK_LINE.test(line)).join('\n'),
    tasks: lines.flatMap((line) => {
      const match = TASK_LINE.exec(line)
      return match ? [{ label: match[1], content: match[2] }] : []
    }),
  }
}
