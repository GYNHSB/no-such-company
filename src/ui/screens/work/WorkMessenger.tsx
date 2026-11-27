import { Fragment, useEffect, useRef, type ReactNode } from 'react'
import type { DayInfo, Message } from '@/data/types'
// shortcut: 대화 영역의 틀(이름 바, 목록)은 kit WorkChannel의 스타일을 빌려 쓴다. WorkChannel에 날짜 구분선과 첨부 자리가 생기면 WorkChannel로 바꾼다.
import channel from '@/ui/kit/work/WorkChannel.module.css'
import { WorkMessage } from '@/ui/kit/work/WorkMessage'
import { Icon } from '@/ui/screens/laptop/icons'
import { splitTasks, type MessageTask } from './messageTasks'
import styles from './WorkMessenger.module.css'

export interface MessengerDay {
  info: DayInfo
  /** 이날 지금까지 도착한 메시지. 언제 도착하는지는 엔진이 정한다 */
  messages: readonly Message[]
}

interface Props {
  /** 상단 이름 바 ('김아영 팀장') */
  name: string
  /** 1일차부터 오늘까지. 이전 날의 대화가 위에 이어져 보인다 */
  days: readonly MessengerDay[]
  /** 메시지 속 `{name}` 자리에 들어가는 플레이어 이름 */
  playerName: string
  /** 아래 입력창. 선택지 고르기(WorkComposer) 자리 */
  composer?: ReactNode
  /** 업무 자료 카드를 눌렀을 때. 버튼 id는 `btn_work_task_{message.id}_{순번}` */
  onOpenTask?: (task: MessageTask, message: Message) => void
  /** 끝낸 업무 자료인지. 끝낸 카드에는 "완료" 라벨이 붙는다 */
  isTaskDone?: (task: MessageTask, message: Message) => boolean
}

/** 모레온 워크 메신저. 팀장과의 대화를 날짜 구분선과 함께 이어서 보여 준다 */
export function WorkMessenger({ name, days, playerName, composer, onOpenTask, isTaskDone }: Props) {
  const listRef = useRef<HTMLDivElement>(null)
  const count = days.reduce((sum, day) => sum + day.messages.length, 0)

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [count])

  const fill = (text: string) => text.replaceAll('{name}', playerName)

  return (
    <section className={channel.root} aria-label={name}>
      <header className={channel.bar}>
        <h2 className={channel.name}>{name}</h2>
      </header>
      <div ref={listRef} className={channel.list} role="log" aria-live="polite">
        {days.map(({ info, messages }) =>
          messages.length === 0 ? null : (
            <Fragment key={info.day}>
              <div className={styles.day}>
                {info.day}일차 · 입사 {info.week}주 차
              </div>
              {messages.map((message) => {
                const { text, tasks } = splitTasks(fill(message.body))
                return (
                  <Fragment key={message.id}>
                    <WorkMessage name={fill(message.from)} time={message.time} text={text} />
                    {tasks.length > 0 && (
                      <div className={styles.tasks}>
                        {tasks.map((task, index) => (
                          <button
                            key={task.label}
                            type="button"
                            id={`btn_work_task_${message.id}_${index + 1}`}
                            className={styles.task}
                            onClick={() => onOpenTask?.(task, message)}
                          >
                            <span className={styles.taskLabel}>
                              {task.label}
                              {isTaskDone?.(task, message) && (
                                <span className={styles.taskDone}>
                                  <Icon name="check" size={12} />
                                  완료
                                </span>
                              )}
                            </span>
                            <span className={styles.taskContent}>{task.content}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </Fragment>
                )
              })}
            </Fragment>
          ),
        )}
      </div>
      {composer}
    </section>
  )
}
