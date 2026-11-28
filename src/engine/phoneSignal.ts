import type { Message } from '@/data/types'

/** 휴대폰 화면에서 플레이어가 한 일. 화면(PhoneDevice)이 알리고, 여기서 엔진 신호의 이름으로 바꾼다 */
export type PhoneEvent =
  /** 잠금 화면에서 알림을 눌렀다 */
  | { type: 'openNotification'; message: Message }
  /** 문자나 은행 알림이 화면에 보였다 */
  | { type: 'read'; ids: string[] }
  /** 전화를 걸었다. 숫자만 온다 */
  | { type: 'call'; number: string }
  /** 건 전화가 연결됐다 */
  | { type: 'callConnected'; number: string }
  | { type: 'hangUp'; number: string }
  /** 사진 앱에서 영상을 재생하기 시작했다, 끝까지 봤다 */
  | { type: 'playVideo'; id: string }
  | { type: 'endVideo'; id: string }
  /** SNS 게시물의 사진이 보였다. index는 0부터 */
  | { type: 'seePhoto'; postId: string; index: number }
  /** 블라블라나 인터넷에서 검색했다 */
  | { type: 'search'; app: 'blabla' | 'browser'; query: string }
  /** 블라블라 글 본문을 열었다 */
  | { type: 'readPost'; id: string }
  /** 원격 관리 프로그램의 기기 정보 페이지가 보였다 */
  | { type: 'seeRemoteAdmin' }
  /** 은행 앱에서 그 계좌의 거래 내역이 보였다 */
  | { type: 'seeAccount'; id: string }

/**
 * 휴대폰에서 한 일의 신호 이름. 대본에서는 interact 트리거의 objectId로 쓴다.
 *
 *   trigger: { type: 'interact', objectId: phoneSignal.read('d2-bank-open-1') }
 *
 * 이름을 직접 적어도 되지만("phone_read:d2-bank-open-1"), 이 함수로 만들면 오타가 나지 않는다.
 */
export const phoneSignal = {
  /** 잠금 화면에서 그 알림을 눌렀다 */
  notification: (messageId: string) => `phone_notification:${messageId}`,
  /** 그 문자나 은행 알림이 화면에 보였다(읽었다) */
  read: (messageId: string) => `phone_read:${messageId}`,
  /** 그 번호로 전화를 걸었다. 숫자만 쓴다("112") */
  call: (number: string) => `phone_call:${number}`,
  /** 건 전화가 연결됐다. 신고는 이 신호로 받는다 */
  callConnected: (number: string) => `phone_call_connected:${number}`,
  hangUp: (number: string) => `phone_hang_up:${number}`,
  /** 사진 앱에서 그 영상을 재생하기 시작했다 */
  playVideo: (videoId: string) => `phone_video_play:${videoId}`,
  /** 그 영상을 끝까지 봤다 */
  endVideo: (videoId: string) => `phone_video_end:${videoId}`,
  /** SNS 게시물의 사진이 보였다. index는 0부터 */
  seePhoto: (postId: string, index: number) => `phone_photo:${postId}:${index}`,
  /** 블라블라나 인터넷에서 그 말로 검색했다. 앞뒤 빈칸은 떼고 사이의 빈칸은 하나로 줄여서 견준다 */
  search: (app: 'blabla' | 'browser', query: string) =>
    `phone_search:${app}:${query.trim().replace(/\s+/g, ' ')}`,
  /** 블라블라 글 본문을 열었다 */
  readPost: (postId: string) => `phone_post:${postId}`,
  /** 원격 관리 프로그램의 기기 정보 페이지가 보였다 */
  remoteAdmin: () => 'phone_remote_admin',
  /** 은행 앱에서 그 계좌의 거래 내역이 보였다 */
  seeAccount: (accountId: string) => `phone_bank_account:${accountId}`,
  /**
   * 은행 앱에서 그 사람에게 송금했다. 받는 사람은 플레이어가 적은 글 그대로이고,
   * 앞뒤 빈칸은 떼고 사이의 빈칸은 하나로 줄여서 견준다. 이 신호는 화면이 아니라 엔진이 송금을 적으면서 낸다
   */
  transfer: (to: string) => `phone_transfer:${to.trim().replace(/\s+/g, ' ')}`,
}

/** 휴대폰에서 한 일을 신호 이름으로 바꾼다. 문자 여러 통을 한 번에 읽으면 이름도 여러 개다 */
export function phoneSignalsOf(event: PhoneEvent): string[] {
  switch (event.type) {
    case 'openNotification':
      return [phoneSignal.notification(event.message.id)]
    case 'read':
      return event.ids.map(phoneSignal.read)
    case 'call':
      return [phoneSignal.call(event.number)]
    case 'callConnected':
      return [phoneSignal.callConnected(event.number)]
    case 'hangUp':
      return [phoneSignal.hangUp(event.number)]
    case 'playVideo':
      return [phoneSignal.playVideo(event.id)]
    case 'endVideo':
      return [phoneSignal.endVideo(event.id)]
    case 'seePhoto':
      return [phoneSignal.seePhoto(event.postId, event.index)]
    case 'search':
      return [phoneSignal.search(event.app, event.query)]
    case 'readPost':
      return [phoneSignal.readPost(event.id)]
    case 'seeRemoteAdmin':
      return [phoneSignal.remoteAdmin()]
    case 'seeAccount':
      return [phoneSignal.seeAccount(event.id)]
  }
}
