import { useEffect, useState } from 'react'
import { Icon } from './icons'
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

const STEPS: { id: Step; label: string }[] = [
  { id: 'consent', label: '권한 확인' },
  { id: 'installing', label: '설치' },
  { id: 'ready', label: '면접 대기실' },
]

// 설치할 때 함께 허용되는 권한. 플레이어가 나중에 "그때 다 허락했구나" 하고 돌아볼 단서
const PERMISSIONS = ['카메라와 마이크 사용', '화면 녹화', '원격 지원 연결', '부팅할 때 자동 실행']

// 설치 중에 지나가는 파일 이름. 연출용
const FILES = [
  'SecureMeet.exe',
  'media_core.dll',
  'screen_capture.dll',
  'remote_assist.dll',
  'autostart.cfg',
]

const TICK_MS = 100

/** 1일차 장면 4. 메일의 '면접 앱 설치하기'를 누르면 나오는 설치 마법사와 면접 대기실 */
export function InterviewAppInstall({ host, company, installMs = 3000, onJoin }: Props) {
  const [step, setStep] = useState<Step>('consent')
  const [agreed, setAgreed] = useState(true)
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    if (step !== 'installing') return
    const started = Date.now()
    const timer = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - started) / installMs) * 100))
      setPercent(p)
      if (p >= 100) setStep('ready')
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [step, installMs])

  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const file = FILES[Math.min(FILES.length - 1, Math.floor((percent / 100) * FILES.length))]

  return (
    <div className={styles.screen}>
      <div className={styles.window} role="dialog" aria-label="보안 화상면접 설치">
        <div className={styles.titleBar}>
          <span className={styles.appIcon}>
            <Icon name="shield" size={14} />
          </span>
          보안 화상면접 설치
          {/* 창 버튼은 장식. 누를 수 없다 */}
          <span className={styles.windowButtons} aria-hidden="true">
            <Icon name="minus" size={14} />
            <Icon name="close" size={14} />
          </span>
        </div>

        <div className={styles.layout}>
          <aside className={styles.banner}>
            <Icon name="shield" size={56} />
            <strong className={styles.bannerName}>보안 화상면접</strong>
            <span className={styles.bannerVersion}>버전 3.2.1</span>
            <ol className={styles.steps}>
              {STEPS.map((s, i) => (
                <li
                  key={s.id}
                  className={i === stepIndex ? styles.stepOn : i < stepIndex ? styles.stepDone : ''}
                >
                  <span className={styles.stepNo}>
                    {i < stepIndex ? <Icon name="check" size={12} /> : i + 1}
                  </span>
                  {s.label}
                </li>
              ))}
            </ol>
          </aside>

          {step === 'consent' && (
            <div className={styles.body}>
              <h1 className={styles.title}>설치 전에 권한을 확인해 주세요</h1>
              <p className={styles.text}>면접을 안전하게 진행하기 위해 아래 권한이 필요합니다.</p>
              <ul className={styles.permissions}>
                {PERMISSIONS.map((p) => (
                  <li key={p}>
                    <span className={styles.check}>
                      <Icon name="check" size={14} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <div className={styles.terms} tabIndex={0} aria-label="이용약관">
                제1조(목적) 이 약관은 보안 화상면접 프로그램(이하 “프로그램”)의 이용 조건을
                정합니다. 제2조(권한) 이용자는 원활한 면접 진행과 기술 지원을 위해 프로그램이
                카메라, 마이크, 화면, 원격 지원 기능에 접근하는 것에 동의합니다. 제3조(자동 실행)
                프로그램은 보안 점검을 위해 컴퓨터를 켤 때 자동으로 실행될 수 있습니다. 제4조(정보
                보관) 면접 중 수집한 영상과 음성은 채용 절차와 서비스 개선에 쓰일 수 있습니다.
              </div>
              <label className={styles.agree}>
                <input
                  id="check_interview_agree"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                이용약관과 위 권한 사용에 모두 동의합니다
              </label>
              <div className={styles.actions}>
                <button
                  id="btn_interview_install"
                  className={styles.primary}
                  type="button"
                  disabled={!agreed}
                  onClick={() => setStep('installing')}
                >
                  동의하고 설치
                </button>
              </div>
            </div>
          )}

          {step === 'installing' && (
            <div className={styles.body}>
              <h1 className={styles.title}>설치하는 중</h1>
              <p className={styles.text}>보안 모듈을 구성하고 있습니다. 잠시만 기다려 주세요.</p>
              <div
                className={styles.track}
                role="progressbar"
                aria-label="설치 진행"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
              >
                <div className={styles.fill} style={{ width: `${percent}%` }} />
              </div>
              <p className={styles.progressText}>
                <span>{file} 복사 중</span>
                <span>{percent}%</span>
              </p>
            </div>
          )}

          {step === 'ready' && (
            <div className={styles.body}>
              <h1 className={styles.title}>면접 대기실</h1>
              <div className={styles.preview} aria-label="카메라 미리보기">
                <span className={styles.previewMe}>나</span>
                <span className={styles.previewTag}>카메라 미리보기</span>
              </div>
              <dl className={styles.room}>
                <dt>회사</dt>
                <dd>{company}</dd>
                <dt>면접관</dt>
                <dd>{host}</dd>
                <dt>카메라</dt>
                <dd className={styles.on}>내장 HD 카메라 · 연결됨</dd>
                <dt>마이크</dt>
                <dd className={styles.on}>내장 마이크 · 연결됨</dd>
              </dl>
              <div className={styles.actions}>
                <button
                  id="btn_interview_join"
                  className={styles.primary}
                  type="button"
                  onClick={onJoin}
                >
                  면접 입장
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
