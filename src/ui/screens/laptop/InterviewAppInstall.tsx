import { useEffect, useState } from 'react'
import styles from './InterviewAppInstall.module.css'

interface Props {
  /** 면접관과 회사. 접속 화면에 보인다 */
  host: string
  company: string
  /** 설치 막대가 차는 시간(ms). 연출만 하고 실제로 내려받지 않는다 */
  installMs?: number
  /** '면접 입장'을 눌렀을 때 (`btn_interview_join`). 화상 면접 화면으로 넘긴다 */
  onJoin: () => void
}

type Step = 'consent' | 'installing' | 'ready'

// 설치할 때 함께 허용되는 권한. 플레이어가 나중에 "그때 다 허락했구나" 하고 돌아볼 단서
const PERMISSIONS = ['카메라와 마이크 사용', '화면 녹화', '원격 지원 연결', '부팅할 때 자동 실행']

/** 1일차 장면 4. 메일의 '면접 앱 설치하기'를 누르면 나오는 설치 화면과 접속 화면 */
export function InterviewAppInstall({ host, company, installMs = 3000, onJoin }: Props) {
  const [step, setStep] = useState<Step>('consent')

  useEffect(() => {
    if (step !== 'installing') return
    const timer = setTimeout(() => setStep('ready'), installMs)
    return () => clearTimeout(timer)
  }, [step, installMs])

  return (
    <div className={styles.screen}>
      <div className={styles.window} role="dialog" aria-label="보안 화상면접 설치">
        <div className={styles.titleBar}>보안 화상면접</div>

        {step === 'consent' && (
          <div className={styles.body}>
            <h1 className={styles.title}>보안 화상면접 설치</h1>
            <p className={styles.text}>면접을 안전하게 진행하기 위해 아래 권한이 필요합니다.</p>
            <ul className={styles.permissions}>
              {PERMISSIONS.map((p) => (
                <li key={p}>
                  <span className={styles.check} aria-hidden="true">
                    ✓
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <button
              id="btn_interview_install"
              className={styles.primary}
              type="button"
              onClick={() => setStep('installing')}
            >
              동의하고 설치
            </button>
          </div>
        )}

        {step === 'installing' && (
          <div className={styles.body}>
            <h1 className={styles.title}>설치하는 중</h1>
            <div
              className={styles.track}
              role="progressbar"
              aria-label="설치 진행"
              aria-valuetext="설치하는 중"
            >
              <div className={styles.fill} style={{ animationDuration: `${installMs}ms` }} />
            </div>
            <p className={styles.text}>보안 모듈을 구성하고 있습니다.</p>
          </div>
        )}

        {step === 'ready' && (
          <div className={styles.body}>
            <h1 className={styles.title}>면접 대기실</h1>
            <dl className={styles.room}>
              <dt>회사</dt>
              <dd>{company}</dd>
              <dt>면접관</dt>
              <dd>{host}</dd>
              <dt>카메라</dt>
              <dd className={styles.on}>연결됨</dd>
              <dt>마이크</dt>
              <dd className={styles.on}>연결됨</dd>
            </dl>
            <button
              id="btn_interview_join"
              className={styles.primary}
              type="button"
              onClick={onJoin}
            >
              면접 입장
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
