/** 메시지 글의 한 조각 */
export interface RichPart {
  type: 'text' | 'bold' | 'code' | 'mention'
  value: string
}

// *굵게* | `코드` | @멘션 (공백이나 문장 부호 앞까지)
const TOKEN = /\*([^*\n]+)\*|`([^`\n]+)`|(@[^\s.,!?]+)/g

/** 업무 메신저식 꾸밈(`*굵게*`, `` `코드` ``, `@멘션`)을 조각으로 나눈다. 줄바꿈과 이모지는 글 그대로 둔다 */
export function parseRich(text: string): RichPart[] {
  const parts: RichPart[] = []
  let last = 0
  for (const match of text.matchAll(TOKEN)) {
    if (match.index > last) parts.push({ type: 'text', value: text.slice(last, match.index) })
    if (match[1] !== undefined) parts.push({ type: 'bold', value: match[1] })
    else if (match[2] !== undefined) parts.push({ type: 'code', value: match[2] })
    else parts.push({ type: 'mention', value: match[3] })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) })
  return parts
}
