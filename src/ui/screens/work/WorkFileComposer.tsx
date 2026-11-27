// shortcut: 입력창 상자는 kit WorkComposer의 스타일을 빌려 쓴다. kit WorkComposer가 첨부를 받게 되면 kit 부품으로 바꾼다.
import { useState, type DragEvent } from 'react'
import { WorkButton } from '@/ui/kit/work/WorkButton'
import kit from '@/ui/kit/work/WorkComposer.module.css'
import { Icon } from '@/ui/screens/laptop/icons'
import styles from './WorkFileComposer.module.css'

/** 게임 속 파일. 플레이어 컴퓨터의 파일이 아니다 */
export interface GameFile {
  id: string
  name: string
  /** 종류 표시 ('이미지', 'PDF 문서') */
  kind: string
  /** 크기 표시 ('1.2MB') */
  size: string
}

interface Props {
  /** 파일 선택 창에 보이는 게임 속 파일 */
  files: readonly GameFile[]
  /** 파일 선택 창의 폴더 이름 */
  folder: string
  /** 이 파일들을 모두 첨부해야 보낼 수 있다. 없으면 하나만 첨부해도 보낸다 */
  required?: readonly string[]
  placeholder?: string
  /** 보내기(`btn_work_send`)를 눌렀을 때. 첨부한 파일 id를 넘긴다 */
  onSend?: (fileIds: string[]) => void
}

// 끌어다 놓을 때 게임 속 파일임을 알리는 표시. 이 표시가 없는 것(플레이어의 진짜 파일)은 받지 않는다
const GAME_FILE = 'application/x-game-file'
// 파일 선택 창 왼쪽의 장식. '문서'만 열려 있다
const PLACES = ['최근 항목', '문서', '다운로드', '바탕화면']

/** 파일을 첨부해 보내는 메신저 입력창. 게임 속 파일 선택 창에서 고르거나 입력창으로 끌어다 놓는다 */
export function WorkFileComposer({ files, folder, required, placeholder, onSend }: Props) {
  const [finderOpen, setFinderOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [attached, setAttached] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)

  const attach = (ids: readonly string[]) => {
    setAttached((cur) => [...cur, ...ids.filter((id) => !cur.includes(id))])
    setSelected([])
  }
  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  const closeFinder = () => {
    setFinderOpen(false)
    setSelected([])
  }

  const requiredDone = (required ?? []).filter((id) => attached.includes(id)).length
  const canSend = attached.length > 0 && requiredDone === (required?.length ?? 0)

  const onDrop = (event: DragEvent) => {
    // 플레이어의 진짜 파일을 떨어뜨려도 브라우저가 그 파일을 열지 않게 막고, 내용은 읽지 않는다
    event.preventDefault()
    setDragOver(false)
    const ids = event.dataTransfer.getData(GAME_FILE)
    if (ids) attach(ids.split(','))
  }

  return (
    <div
      className={`${kit.root} ${styles.root} ${dragOver ? styles.dragOver : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        setDragOver(event.dataTransfer.types.includes(GAME_FILE))
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOver(false)
      }}
      onDrop={onDrop}
    >
      {finderOpen && (
        <div
          className={styles.finder}
          role="dialog"
          aria-label="파일 선택"
          onKeyDown={(event) => event.key === 'Escape' && closeFinder()}
        >
          <div className={styles.finderBar}>
            <span>파일 선택</span>
            <button
              type="button"
              id="btn_finder_close"
              className={styles.iconButton}
              aria-label="파일 선택 창 닫기"
              onClick={closeFinder}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
          <div className={styles.finderMain}>
            <ul className={styles.places} aria-hidden="true">
              {PLACES.map((place) => (
                <li
                  key={place}
                  className={`${styles.place} ${place === '문서' ? styles.placeCurrent : ''}`}
                >
                  {place}
                </li>
              ))}
            </ul>
            <div>
              <div className={styles.path}>문서 › {folder}</div>
              <ul className={styles.files} role="listbox" aria-label={folder} aria-multiselectable>
                {files.map((file) => {
                  const isAttached = attached.includes(file.id)
                  const isSelected = selected.includes(file.id)
                  return (
                    // 버튼은 브라우저에 따라 끌리지 않아서 목록 항목으로 만든다
                    <li
                      key={file.id}
                      id={`btn_finder_file_${file.id}`}
                      className={`${styles.file} ${isSelected ? styles.selected : ''} ${isAttached ? styles.attached : ''}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={isAttached}
                      tabIndex={isAttached ? -1 : 0}
                      draggable={!isAttached}
                      onDragStart={(event) => {
                        // 고른 파일을 끌면 고른 것 전부, 아니면 끄는 파일 하나만 옮긴다
                        const ids = isSelected ? selected : [file.id]
                        event.dataTransfer.setData(GAME_FILE, ids.join(','))
                        event.dataTransfer.effectAllowed = 'copy'
                      }}
                      onClick={() => !isAttached && toggle(file.id)}
                      onDoubleClick={() => {
                        if (isAttached) return
                        attach([file.id])
                        closeFinder()
                      }}
                      onKeyDown={(event) => {
                        if (isAttached || (event.key !== 'Enter' && event.key !== ' ')) return
                        event.preventDefault()
                        toggle(file.id)
                      }}
                    >
                      <Icon name="doc" />
                      <span className={styles.fileName}>{file.name}</span>
                      <span className={styles.fileMeta}>{file.kind}</span>
                      <span className={styles.fileMeta}>{isAttached ? '첨부됨' : file.size}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          <div className={styles.finderFooter}>
            <span className={styles.hint}>파일을 입력창으로 끌어다 놓아도 돼요</span>
            <WorkButton id="btn_finder_cancel" variant="secondary" onClick={closeFinder}>
              취소
            </WorkButton>
            <WorkButton
              id="btn_finder_open"
              disabled={selected.length === 0}
              onClick={() => {
                attach(selected)
                closeFinder()
              }}
            >
              열기
            </WorkButton>
          </div>
        </div>
      )}

      {attached.length > 0 && (
        <ul className={styles.chips} aria-label="첨부한 파일">
          {files
            .filter((file) => attached.includes(file.id))
            .map((file) => (
              <li key={file.id} className={styles.chip}>
                <Icon name="doc" size={16} />
                <span>{file.name}</span>
                <button
                  type="button"
                  id={`btn_work_attach_remove_${file.id}`}
                  className={styles.iconButton}
                  aria-label={`${file.name} 첨부 취소`}
                  onClick={() => setAttached((cur) => cur.filter((id) => id !== file.id))}
                >
                  <Icon name="close" size={14} />
                </button>
              </li>
            ))}
        </ul>
      )}
      <p className={styles.placeholder}>
        {dragOver ? '여기에 놓으면 첨부돼요' : (placeholder ?? '메시지 보내기')}
      </p>
      <div className={styles.toolbar}>
        <button
          type="button"
          id="btn_work_attach"
          className={styles.attach}
          aria-label="파일 첨부"
          aria-expanded={finderOpen}
          onClick={() => (finderOpen ? closeFinder() : setFinderOpen(true))}
        >
          <Icon name="plus" />
        </button>
        <span className={styles.count} aria-live="polite">
          {required && `${requiredDone} / ${required.length} 첨부`}
        </span>
        <WorkButton
          id="btn_work_send"
          disabled={!canSend}
          onClick={() => {
            onSend?.(attached)
            setAttached([])
            closeFinder()
          }}
        >
          보내기
        </WorkButton>
      </div>
    </div>
  )
}
