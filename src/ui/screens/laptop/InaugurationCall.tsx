import type { ReactNode } from 'react'
import { Icon } from './icons'
import styles from './InaugurationCall.module.css'
import { VideoCall } from './VideoCall'
import { fillName } from './videoScript'

interface Props {
  /** 플레이어가 입력한 이름. 서명란과 승낙문에 미리 적혀 있다 */
  playerName: string
  /** 'sign': 취임 승낙서와 인감 위임장 / 'read': 카메라를 보고 읽을 승낙문 */
  step: 'sign' | 'read'
  /** "서명한다"를 고른 뒤 true. 서명란에 전자 서명이 들어간다 */
  signed: boolean
  /** 취임식 영상. 없으면 정지 화면 */
  videoSrc?: string
  /** 서류 아래에 끼워 넣을 것(메신저 알림, 선택지). 선택지와 메신저는 별도 부품이 만든다 */
  children?: ReactNode
}

const READ_ALOUD = '저 {name}은(는) 주식회사 세움파트너스의 대표이사 취임을 승낙합니다.'

/**
 * 5일차 장면 3. 웹캠이 켜진 화상 취임식. 오른쪽에 서명할 서류가 뜬다.
 * 메시지와 선택지가 끼어드는 순서, 공범 기록과 경계심은 엔진이 정하고 이 화면은 step과 signed만 받는다.
 */
export function InaugurationCall({ playerName, step, signed, videoSrc, children }: Props) {
  return (
    <VideoCall
      title="세움파트너스 · 대표이사 취임식"
      remoteName="박재훈"
      videoSrc={videoSrc}
      recording
      side={
        <div className={styles.side}>
          <div className={styles.viewer}>
            <Icon name="doc" size={16} />
            {step === 'sign' ? '전자 서명 요청 · 문서 2건' : '낭독 확인'}
          </div>
          {step === 'sign' ? (
            <>
              <Doc title="취임 승낙서">
                본인은 주식회사 세움파트너스의 대표이사 취임을 승낙합니다.
              </Doc>
              <Doc title="인감 위임장">
                위임인은 법인 등기와 관련한 업무 일체를 회사에 위임합니다.
              </Doc>
              <div className={styles.signRow}>
                <span className={styles.signLabel}>성명</span>
                <span className={styles.prefilled}>{playerName}</span>
                <span className={styles.signLabel}>서명</span>
                <span id="field_inauguration_signature" className={styles.signature}>
                  {signed ? <span className={styles.signed}>{playerName}</span> : '(서명)'}
                </span>
              </div>
              {signed && <p className={styles.done}>전자 서명 완료</p>}
            </>
          ) : (
            <Doc title="승낙문 낭독">
              <span className={styles.ask}>카메라를 보며 소리 내어 읽어 주세요.</span>
              <span className={styles.readText}>{fillName(READ_ALOUD, playerName)}</span>
            </Doc>
          )}
          {children}
        </div>
      }
    />
  )
}

function Doc({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.doc}>
      <h2 className={styles.docTitle}>{title}</h2>
      <p className={styles.docBody}>{children}</p>
      <p className={styles.issuer}>
        주식회사 세움파트너스
        <span className={styles.seal} aria-hidden="true">
          인
        </span>
      </p>
    </section>
  )
}
