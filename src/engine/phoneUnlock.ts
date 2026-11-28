/**
 * 줄거리가 진행되면서 휴대폰에 생기는 것. 처음에는 없다가 대본의 사건이 열어 준다.
 * blabla: 블라블라 앱(입사한 뒤에 깐다), remote_admin: 인터넷의 원격 관리 프로그램 기기 정보 페이지
 */
export type PhoneFeature = 'blabla' | 'remote_admin'

const FEATURES: readonly PhoneFeature[] = ['blabla', 'remote_admin']

const PREFIX = 'phone_unlock:'

/**
 * 휴대폰에 그것이 생겼다고 적어 두는 기록의 이름. 대본에서는 flag 효과의 key로 쓴다.
 *
 *   effects: [{ type: 'flag', key: phoneUnlock('remote_admin'), value: true }]
 *
 * value를 false로 주면 다시 없어진다.
 */
export const phoneUnlock = (feature: PhoneFeature) => `${PREFIX}${feature}`

/** 엔진의 기록에서 지금 휴대폰에 생겨 있는 것을 골라낸다. 순서는 늘 같다 */
export function unlockedIn(flags: Record<string, boolean>): PhoneFeature[] {
  return FEATURES.filter((feature) => flags[phoneUnlock(feature)] === true)
}
