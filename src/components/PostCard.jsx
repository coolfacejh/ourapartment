import { Link } from 'react-router-dom'

const STATUS_BADGE = {
  general:  { label: '일반',      className: 'bg-surface-container-highest text-on-surface-variant' },
  petition: { label: '안건발의중', className: 'bg-tertiary-fixed/20 text-on-tertiary-fixed-variant' },
  resolved: { label: '해결됨',    className: 'bg-secondary-container text-on-secondary-container' },
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

export default function PostCard({ post }) {
  const badge = STATUS_BADGE[post.status] || STATUS_BADGE.general
  const likeCount = post.reactions?.length ?? 0
  const commentCount = post.comments?.length ?? 0
  const firstImage = post.images?.[0]?.url

  return (
    <Link to={`/post/${post.id}`}>
      <article className="bg-white border border-[#E2E8F0] rounded-xl p-md flex flex-col gap-sm active:scale-[0.98] transition-all">
        {/* 메타 */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant text-label-sm rounded-md">
              {post.category}
            </span>
            <span className="text-on-surface-variant/60 text-label-sm">
              {post.users?.dong}동 입주민 • {timeAgo(post.created_at)}
            </span>
          </div>
          <span className={`px-3 py-1 text-label-sm rounded-full ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        {/* 이미지 (있을 때만) */}
        {firstImage && (
          <img
            src={firstImage}
            alt="게시글 이미지"
            className="w-full h-40 object-cover rounded-lg"
          />
        )}

        {/* 제목 / 본문 */}
        <h3 className="font-headline-md text-headline-md text-on-surface">{post.title}</h3>
        <p className="text-on-surface-variant line-clamp-2 text-body-md">{post.body}</p>

        {/* 하단 카운터 */}
        <div className="flex items-center justify-between mt-base">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-primary">
              <span className="material-symbols-outlined text-[18px]">thumb_up</span>
              <span className="font-label-lg">{likeCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
              <span className="font-label-lg">{commentCount}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
