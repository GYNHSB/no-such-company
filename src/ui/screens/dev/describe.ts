import type { Channel, Effect, EvidenceCard, Trigger } from '@/data/types'

/** 개발 모드의 패널에서 대본의 신호, 트리거, 효과를 한국어로 풀어 쓴다. 게임 진행에는 쓰지 않는다 */

const CHANNEL_LABELS: Record<Channel, string> = {
  mail: '메일',
  messenger: '메신저',
  sms: '문자',
  bank: '은행 알림',
  sns: 'SNS',
  blabla: '블라블라',
  post: '우편',
}

const won = (amount: number) => `${amount.toLocaleString('ko-KR')}원`

/** 신호 이름이 무슨 뜻인지 한마디로. 이름의 앞부분으로 가린다 */
export function meaning(name: string): string {
  if (name === 'interact_laptop') return '노트북 앞에 앉기'
  if (name === 'interact_phone') return '휴대폰 보기'
  if (name.startsWith('interact_')) return '방 안의 물건 누르기'
  if (name.startsWith('laptop_tab:')) return '노트북 브라우저에서 그 사이트의 탭을 앞으로 가져오기'
  if (name === 'laptop_leave') return '노트북에서 눈을 떼기(Esc나 화면 밖 클릭)'
  if (name === 'btn_desktop_internet') return '노트북 바탕화면의 인터넷 아이콘 누르기'
  if (name.startsWith('btn_')) return '화면의 버튼 누르기'
  if (name.startsWith('phone_read:')) return '휴대폰에서 그 문자(알림) 읽기'
  if (name.startsWith('phone_notification:')) return '잠금 화면에서 그 알림 누르기'
  if (name.startsWith('phone_video_end:')) return '사진 앱에서 그 영상 끝까지 보기'
  if (name.startsWith('phone_video_play:')) return '사진 앱에서 그 영상 재생하기'
  if (name.startsWith('phone_photo:')) return 'SNS에서 그 사진 보기'
  if (name.startsWith('phone_post:')) return '블라블라에서 그 글 열기'
  if (name.startsWith('phone_search:')) return '휴대폰에서 그 말로 검색하기'
  if (name.startsWith('phone_call_connected:')) return '그 번호로 건 전화가 연결됨'
  if (name.startsWith('phone_call:')) return '그 번호로 전화 걸기'
  if (name.startsWith('phone_hang_up:')) return '전화 끊기'
  if (name === 'phone_remote_admin') return '휴대폰에서 원격 관리 정보 보기'
  if (name.startsWith('phone_bank_account:')) return '은행 앱에서 그 계좌의 거래 내역 보기'
  if (name.startsWith('phone_transfer:')) return '은행 앱에서 그 사람에게 송금하기'
  return '화면이 보내는 신호'
}

/** 잔액 조건을 글로. "500만 원 이상", "0원 이하" */
export function balanceRange(trigger: Extract<Trigger, { type: 'balance' }>): string {
  return [
    trigger.atLeast !== undefined ? `${won(trigger.atLeast)} 이상` : '',
    trigger.atMost !== undefined ? `${won(trigger.atMost)} 이하` : '',
  ]
    .filter(Boolean)
    .join(', ')
}

/** 사건이 언제 일어나는지를 글로 */
export function triggerText(trigger: Trigger): string {
  switch (trigger.type) {
    case 'dayStart':
      return '하루가 시작되면 바로'
    case 'afterEvent':
      return trigger.delaySec
        ? `사건 ${trigger.eventId}이(가) 일어나고 ${trigger.delaySec}초 뒤에 저절로`
        : `사건 ${trigger.eventId}에 바로 이어서`
    case 'interact':
      return (
        [trigger.objectId]
          .flat()
          .map((objectId) => `${objectId} (${meaning(objectId)})`)
          .join(' 또는 ') + (trigger.after ? ` · 사건 ${trigger.after} 뒤에만` : '')
      )
    case 'evidenceCollected':
      return `증거 ${trigger.cardId}을(를) 얻으면`
    case 'sentenceSolved':
      return `빈칸 문장 ${trigger.sentenceId}을(를) 맞추면`
    case 'balance':
      return `계좌 ${trigger.accountId}의 잔액이 ${balanceRange(trigger)}가 되면`
  }
}

/** 글이 길면 앞부분만 */
const brief = (text: string, max = 28) => {
  const line = text.replace(/\s+/g, ' ')
  return line.length > max ? `${line.slice(0, max)}…` : line
}

/** 사건이 일으키는 일 하나를 글로. cards는 증거 카드의 이름을 찾는 데 쓴다 */
export function effectText(effect: Effect, cards: readonly EvidenceCard[]): string {
  switch (effect.type) {
    case 'message': {
      const { channel, from, time, body } = effect.message
      return `${CHANNEL_LABELS[channel]} 도착 · ${from} ${time} · "${brief(body)}"`
    }
    case 'evidence':
      return `증거 획득 · ${cards.find((card) => card.id === effect.cardId)?.title ?? effect.cardId}`
    case 'suspicion':
      return `경계심 ${effect.delta > 0 ? '+' : ''}${effect.delta}`
    case 'flag':
      return `기록 · ${effect.key} = ${effect.value ? '예' : '아니오'}`
    case 'choice':
      return `선택지 · "${brief(effect.prompt)}" (${effect.choices.map((c) => c.label).join(' / ')})`
    case 'scene':
      return `특수 장면 · ${effect.sceneId}`
    case 'webcam':
      return `웹캠 ${effect.on ? '켜짐' : '꺼짐'}`
    case 'goal':
      return `화면 위 안내 · "${effect.text}"`
    case 'monologue':
      return `혼잣말 ${effect.lines.length}줄 · "${brief(effect.lines[0] ?? '')}"`
    case 'dateCard':
      return `날짜 카드 · "${effect.text}"`
    case 'laptop':
      return `노트북 화면 · ${effect.screen}`
    case 'dayEnd':
      return '하루 끝 · 침대에 누우면 다음 날로'
    case 'bankOpen':
      return (
        `계좌 생김 · ${effect.account.label} ${effect.account.number ?? ''}` +
        (effect.account.opening ? ` · 처음 잔액 ${won(effect.account.opening)}` : '') +
        (effect.notice ? ' · 알림 있음' : ' · 알림 없음')
      )
    case 'bankEntry':
      return (
        `거래 · 계좌 ${effect.entry.accountId} ${effect.entry.amount > 0 ? '+' : ''}${won(effect.entry.amount)}` +
        ` · ${effect.entry.counterparty}` +
        (effect.notice ? ' · 알림 있음' : ' · 알림 없음')
      )
  }
}
