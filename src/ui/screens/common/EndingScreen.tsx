import { useEffect, useState } from 'react'
import type { EndingId } from '@/data/types'
import styles from './EndingScreen.module.css'
import { ENDINGS, HELP_LINES } from './endingText'

/** 엔딩 장면에서 한 줄이 나오고 다음 줄까지 기다리는 시간(ms) */
const LINE_MS = 2200

/** 결과 카드에 적을 기록. 엔진이 모아서 넘긴다. */
export interface EndingRecord {
  /** 근무 기간 표기("5일차 · 입사 8주 차") */
  period: string
  /** 모은 증거 수 / 전체 */
  evidence: [number, number]
  /** 맞춘 빈칸 문장 수 / 전체 */
  sentences: [number, number]
  /** 5일차 취임 서류에 서명했는지 */
  signed: boolean
  /** 신고했는지 */
  reported: boolean
  /** 팀장의 경계심이 가장 높았을 때(0~100) */
  maxSuspicion: number
}

interface Props {
  /** 엔진의 엔딩 판정(src/engine/ending.ts의 decideEnding) */
  ending: EndingId
  /** 플레이어 이름. 글자로만 넣는다(이미지에 넣지 않는다). */
  name: string
  record: EndingRecord
  /** "처음부터 다시"를 눌렀을 때 */
  onRestart: () => void
}

/**
 * 엔딩 장면과 결과 카드. 검은 화면에 엔딩 글이 한 줄씩 나오고(클릭하면 건너뜀),
 * 이어서 인사 기록 카드 모양의 결과 카드가 올라온다. 결말에 맞는 도장이 찍힌다.
 */
export function EndingScreen({ ending, name, record, onRestart }: Props) {
  const text = ENDINGS[ending]
  const lines = text.lines.map((line) => line.replaceAll('{name}', name))
  const [shown, setShown] = useState(1)
  const done = shown > lines.length

  // 한 줄씩 보여 주고, 다 보여 주면 잠시 뒤 결과 카드로 넘어간다
  useEffect(() => {
    if (done) return
    const id = setTimeout(() => setShown((n) => n + 1), LINE_MS)
    return () => clearTimeout(id)
  }, [shown, done])

  return (
    <div className={styles.root} onClick={done ? undefined : () => setShown(lines.length + 1)}>
      {!done ? (
        <div className={styles.scene} role="status">
          {lines.slice(0, shown).map((line, i) => (
            <p key={i} className={styles.line}>
              {line}
            </p>
          ))}
          <p className={styles.skip} aria-hidden="true">
            클릭하면 결과를 봐요
          </p>
        </div>
      ) : (
        <div className={styles.result}>
          <article className={styles.card} aria-label="결과 카드">
            <header className={styles.cardHead}>
              <span>인사 기록 카드</span>
              <span>주식회사 모레온</span>
            </header>

            <div className={styles.identity}>
              <p className={styles.label}>성명</p>
              <p className={styles.name}>{name}</p>
              <p className={styles.label}>결말</p>
              <p className={styles.ending}>{text.title}</p>
            </div>

            <dl className={styles.facts}>
              <Fact label="근무 기간" value={record.period} />
              <Fact label="모은 증거" value={`${record.evidence[0]} / ${record.evidence[1]}`} />
              <Fact label="맞춘 문장" value={`${record.sentences[0]} / ${record.sentences[1]}`} />
              <Fact label="취임 서류" value={record.signed ? '서명함' : '서명하지 않음'} />
              <Fact label="신고" value={record.reported ? '성공' : '실패'} />
              <Fact label="팀장의 경계심" value={`최고 ${record.maxSuspicion}`} />
            </dl>

            {/* 신고로 끝나면 차분한 색, 나머지는 빨간 도장 */}
            <span
              className={`${styles.stamp} ${ending === 'safe' ? styles.calm : ''}`}
              aria-label={`도장: ${text.stamp}`}
            >
              {text.stamp}
            </span>
          </article>

          <ul className={styles.help}>
            {HELP_LINES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          <button type="button" className={styles.restart} onClick={onRestart}>
            처음부터 다시
          </button>
        </div>
      )}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.fact}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
