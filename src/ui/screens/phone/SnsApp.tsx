import { useEffect, useRef, useState } from 'react'
import { PhoneNav } from '@/ui/kit/phone/PhoneNav'
import { PhoneScreen } from '@/ui/kit/phone/PhoneScreen'
import styles from './SnsApp.module.css'

/** 내가 올린 게시물 하나 */
export interface SnsPost {
  id: string
  /** 올린 때. "2년 전" */
  ago: string
  /** 사진 주소를 올린 순서대로. 아직 없는 사진은 비워 두면 임시 그림이 나온다 */
  photos: (string | undefined)[]
  /** 사진에 무엇이 찍혔는지. 임시 그림과 화면 낭독기에 쓴다 */
  photoLabel: string
  /** 처음에 보여 줄 사진(0부터) */
  startAt?: number
  /** 글. 한 줄씩 넘긴다 */
  lines: string[]
  /** 좋아요 수 */
  likes?: number
}

interface Props {
  /** 지금 시각 "20:31". 상태 표시줄에 쓴다 */
  time: string
  /** SNS 이름(가상 이름) */
  app: string
  /** 계정 주인 이름. 플레이어가 입력한 이름이다 */
  author: string
  /** 팔로워와 팔로잉 수. 없으면 그리지 않는다 */
  followers?: number
  following?: number
  /** 내가 올린 게시물. 새로 올린 것이 앞에 온다 */
  posts: SnsPost[]
  /** 사진이 화면에 보였을 때(게시물을 처음 볼 때 포함). 몇 번째 사진인지는 0부터 센다 */
  onSeePhoto?: (postId: string, index: number) => void
  /** 왼쪽 위 "홈"이나 아래 막대를 눌렀을 때. 홈 화면으로 돌아간다 */
  onHome?: () => void
}

/** 계정 사진 자리의 사람 모양 */
function Avatar({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <circle className={styles.avatarBack} cx="20" cy="20" r="20" />
      <circle cx="20" cy="15.5" r="6.5" fill="currentColor" />
      <path d="M7.5 34a12.5 11 0 0 1 25 0a20 20 0 0 1-25 0z" fill="currentColor" />
    </svg>
  )
}

/** 모양만 있는 단추에 쓰는 선 그림 */
const GLYPHS = {
  heart: 'M12 20s-7-4.4-7-9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.4C19 15.6 12 20 12 20z',
  comment: 'M5 5.5h14v10.5H10l-5 4z',
  share: 'M4.5 11.5L20 4.5l-5.5 15-3-6.5z',
  save: 'M6.5 4.5h11V20L12 15.5 6.5 20z',
  home: 'M4 11l8-6.5 8 6.5v8.5h-5.5v-5h-5v5H4z',
  search: 'M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13zM15.5 15.5L20 20',
  add: 'M12 5.5v13M5.5 12h13',
} as const

function Glyph({ name }: { name: keyof typeof GLYPHS }) {
  return (
    <svg className={styles.glyph} viewBox="0 0 24 24" aria-hidden="true">
      <path d={GLYPHS[name]} />
    </svg>
  )
}

/** 게시물 하나. 사진 여러 장을 한 장씩 넘겨 본다 */
function Post({
  post,
  author,
  onSeePhoto,
}: {
  post: SnsPost
  author: string
  onSeePhoto?: Props['onSeePhoto']
}) {
  const total = post.photos.length
  const [index, setIndex] = useState(Math.min(post.startAt ?? 0, Math.max(0, total - 1)))
  const onSeeRef = useRef(onSeePhoto)
  useEffect(() => {
    onSeeRef.current = onSeePhoto
  })

  // 지금 보이는 사진을 알린다
  useEffect(() => {
    onSeeRef.current?.(post.id, index)
  }, [post.id, index])

  const src = post.photos[index]
  const label = `${post.photoLabel} 사진 ${index + 1}/${total}`

  return (
    <article className={styles.post}>
      <header className={styles.postHead}>
        <Avatar className={styles.smallAvatar} />
        <span className={styles.author}>{author}</span>
        <span className={styles.ago}>{post.ago}</span>
      </header>

      <div className={styles.photo}>
        {src ? (
          <img className={styles.image} src={src} alt={label} />
        ) : (
          <span className={styles.temp} role="img" aria-label={`${label} 자리`}>
            <svg className={styles.tempGlyph} viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="8" cy="8.5" r="2.25" />
              <path d="M3.5 19l5.5-7 3.5 4.5 2.5-3 5.5 5.5z" />
            </svg>
            {post.photoLabel}
          </span>
        )}
        {total > 1 && (
          <>
            <span className={styles.counter}>
              {index + 1}/{total}
            </span>
            {index > 0 && (
              <button
                type="button"
                className={`${styles.turn} ${styles.prev}`}
                onClick={() => setIndex(index - 1)}
                aria-label="이전 사진"
              >
                ‹
              </button>
            )}
            {index < total - 1 && (
              <button
                type="button"
                className={`${styles.turn} ${styles.next}`}
                onClick={() => setIndex(index + 1)}
                aria-label="다음 사진"
              >
                ›
              </button>
            )}
          </>
        )}
      </div>

      {/* 좋아요, 댓글, 보내기, 담아 두기. 모양만 있고 눌리지 않는다 */}
      <div className={styles.actions} aria-hidden="true">
        <Glyph name="heart" />
        <Glyph name="comment" />
        <Glyph name="share" />
        {total > 1 && (
          <span className={styles.dots}>
            {post.photos.map((_, i) => (
              <i key={i} className={i === index ? styles.dotOn : undefined} />
            ))}
          </span>
        )}
        <Glyph name="save" />
      </div>

      {post.likes !== undefined && <p className={styles.likes}>좋아요 {post.likes}개</p>}
      <p className={styles.caption}>
        <strong>{author}</strong>
        {post.lines.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </p>
    </article>
  )
}

/**
 * 휴대폰 SNS 앱의 내 계정 화면. 사진을 올리는 SNS의 구조(계정 정보 → 내 게시물)를 따른다.
 * 실제 SNS의 이름, 로고, 고유 색은 쓰지 않는다. 색은 흑백만 쓴다.
 */
export function SnsApp({
  time,
  app,
  author,
  followers,
  following,
  posts,
  onSeePhoto,
  onHome,
}: Props) {
  return (
    <PhoneScreen time={time} onHome={onHome}>
      <div className={styles.sns}>
        <div className={styles.page}>
          {/* 큰 제목을 두지 않고 앱 이름을 위쪽 줄 가운데에 둔다. 게시물 글까지 한 화면에 들어오게 하려는 것이다 */}
          <PhoneNav backLabel={onHome && '홈'} onBack={onHome}>
            <h1 className={styles.appName}>{app}</h1>
          </PhoneNav>

          <section className={styles.profile} aria-label="내 계정">
            <Avatar className={styles.bigAvatar} />
            <div className={styles.profileText}>
              <h2 className={styles.name}>{author}</h2>
              <dl className={styles.stats}>
                <div>
                  <dt>게시물</dt>
                  <dd>{posts.length}</dd>
                </div>
                {followers !== undefined && (
                  <div>
                    <dt>팔로워</dt>
                    <dd>{followers}</dd>
                  </div>
                )}
                {following !== undefined && (
                  <div>
                    <dt>팔로잉</dt>
                    <dd>{following}</dd>
                  </div>
                )}
              </dl>
            </div>
          </section>

          {posts.length === 0 ? (
            <p className={styles.empty}>아직 올린 게시물이 없어요</p>
          ) : (
            posts.map((post) => (
              <Post key={post.id} post={post} author={author} onSeePhoto={onSeePhoto} />
            ))
          )}
        </div>

        {/* 아래 탭. 내 계정 화면만 있어서 모양만 있다 */}
        <nav className={styles.tabs} aria-hidden="true">
          <Glyph name="home" />
          <Glyph name="search" />
          <Glyph name="add" />
          <Avatar className={styles.tabAvatar} />
        </nav>
      </div>
    </PhoneScreen>
  )
}
