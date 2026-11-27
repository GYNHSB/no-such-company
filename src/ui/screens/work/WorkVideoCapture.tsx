// shortcut: 상자는 kit WorkComposer의 스타일을 빌려 쓴다(WorkFileComposer와 같은 방식). kit에 입력창 틀 부품이 생기면 그것으로 바꾼다.
import { useEffect, useState } from 'react'
import { WorkButton } from '@/ui/kit/work/WorkButton'
import kit from '@/ui/kit/work/WorkComposer.module.css'
import { Icon } from '@/ui/screens/laptop/icons'
import { CAPTURE_STEPS, STEP_SECONDS, captureAt } from './videoCapture'
import styles from './WorkVideoCapture.module.css'

interface Props {
  /** 보내기(`btn_work_video_send`)를 눌렀을 때. 세 방향을 다 찍어야 누를 수 있다 */
  onSend?: () => void
}

/**
 * 본인 확인 영상 찍기. 메신저의 입력창 자리에 놓는다.
 * 플레이어의 진짜 카메라는 켜지 않는다. 화면 속 얼굴 자리 표시가 방향을 따라 움직일 뿐이다.
 */
export function WorkVideoCapture({ onSend }: Props) {
  // 찍기 시작한 뒤 흐른 시간(초). null이면 아직 찍지 않았다
  const [elapsed, setElapsed] = useState<number | null>(null)
  const { step, remaining } = captureAt(elapsed ?? 0)
  const isDone = step === CAPTURE_STEPS.length
  const isRecording = elapsed !== null && !isDone
  const current = isRecording ? CAPTURE_STEPS[step] : undefined

  useEffect(() => {
    if (!isRecording) return
    const timer = setInterval(() => setElapsed((sec) => (sec ?? 0) + 1), 1000)
    return () => clearInterval(timer)
  }, [isRecording])

  const guide = isDone
    ? '세 방향을 모두 찍었어요. 영상을 보내세요.'
    : (current?.guide ?? `정면, 왼쪽, 오른쪽을 ${STEP_SECONDS}초씩 차례로 찍어요.`)

  return (
    <section className={`${kit.root} ${styles.root}`} aria-label="본인 확인 영상 찍기">
      <header className={styles.bar}>
        <span className={styles.title}>
          <Icon name="video" size={16} />
          본인 확인 영상
        </span>
        {isRecording && <span className={styles.rec}>● 녹화 중</span>}
      </header>
      <div className={styles.main}>
        {/* 방향과 남은 시간은 옆 목록이 읽어 주므로 미리 보기는 화면 읽기에서 뺀다 */}
        <div className={styles.preview} data-facing={current?.id} aria-hidden="true">
          <span className={styles.face}>나</span>
          {current && (
            <span className={styles.facing}>
              {current.label}
              <span className={styles.remaining}>{remaining}</span>
            </span>
          )}
        </div>
        <ol className={styles.steps}>
          {CAPTURE_STEPS.map((item, index) => {
            const isStepDone = elapsed !== null && index < step
            const isCurrent = isRecording && index === step
            return (
              <li
                key={item.id}
                className={`${styles.step} ${isStepDone ? styles.done : ''} ${isCurrent ? styles.current : ''}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span>{item.label}</span>
                <span className={styles.stepTime}>
                  {isStepDone ? (
                    <>
                      <Icon name="check" size={14} />
                      완료
                    </>
                  ) : isCurrent ? (
                    `${remaining}초 남음`
                  ) : (
                    `${STEP_SECONDS}초`
                  )}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
      <div className={styles.footer}>
        <p className={styles.guide} aria-live="polite">
          {guide}
        </p>
        <WorkButton
          id="btn_work_video_start"
          variant={isDone ? 'secondary' : 'primary'}
          disabled={isRecording}
          onClick={() => setElapsed(0)}
        >
          {isDone ? '다시 찍기' : isRecording ? '찍는 중' : '촬영 시작'}
        </WorkButton>
        <WorkButton
          id="btn_work_video_send"
          disabled={!isDone}
          onClick={() => {
            onSend?.()
            setElapsed(null)
          }}
        >
          보내기
        </WorkButton>
      </div>
    </section>
  )
}
