import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, getPost, toggleReaction, addComment, createPetition, submitReport } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState([])
  const [showPetitionModal, setShowPetitionModal] = useState(false)
  const [petitionSummary, setPetitionSummary] = useState('')
  const [submittingPetition, setSubmittingPetition] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getPost(id)
        setPost(data)
        setComments(data.comments || [])
        const { data: rxData } = await supabase
          .from('reactions')
          .select('id, user_id')
          .eq('target_type', 'post')
          .eq('target_id', id)
        setLiked(rxData?.some(r => r.user_id === user?.id) ?? false)
        setLikeCount(rxData?.length ?? 0)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id, user?.id])

  const handleLike = async () => {
    const nowLiked = await toggleReaction({ targetType: 'post', targetId: id })
    setLiked(nowLiked)
    setLikeCount(prev => nowLiked ? prev + 1 : prev - 1)
  }

  const handleComment = async () => {
    if (!commentText.trim()) return
    const newComment = await addComment({ postId: id, body: commentText })
    setComments(prev => [...prev, newComment])
    setCommentText('')
  }

  const handlePetition = async () => {
    if (!petitionSummary.trim()) return
    setSubmittingPetition(true)
    try {
      const petition = await createPetition({ postId: id, summary: petitionSummary })
      setShowPetitionModal(false)
      navigate(`/petition/${petition.id}`)
    } catch (e) {
      alert(e.message)
    } finally {
      setSubmittingPetition(false)
    }
  }

  const hasPetition = post?.petitions?.length > 0
  const petitionId = post?.petitions?.[0]?.id

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
    </div>
  )

  if (!post) return (
    <div className="flex flex-col justify-center items-center min-h-screen gap-4">
      <p className="text-on-surface-variant">게시글을 찾을 수 없습니다.</p>
      <button onClick={() => navigate('/home')} className="text-primary font-label-lg">홈으로 돌아가기</button>
    </div>
  )

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen pb-48">
      {/* 상단 앱바 */}
      <header className="fixed top-0 w-full z-50 bg-surface border-b border-outline-variant flex items-center justify-between px-container-margin h-14 max-w-[768px] left-1/2 -translate-x-1/2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-semibold text-primary">민원 상세</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">share</span>
        </button>
      </header>

      <main className="pt-14 max-w-[768px] mx-auto px-container-margin">
        {/* 작성자 정보 */}
        <div className="flex items-center justify-between py-md">
          <div className="flex items-center gap-sm">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant">person</span>
            </div>
            <div>
              {/* 닉네임만 표시 (호수 비노출) */}
              <p className="font-label-lg text-label-lg text-on-surface">{post.users?.nickname}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {timeAgo(post.created_at)} · 조회 {post.view_count}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant text-label-sm rounded-md">
            {post.category}
          </span>
        </div>

        {/* 본문 */}
        <article className="space-y-md">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{post.title}</h2>
          <p className="font-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">{post.body}</p>

          {/* 이미지 */}
          {post.images?.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-outline-variant shadow-sm">
              <img src={post.images[0].url} alt="" className="w-full h-64 object-cover" />
            </div>
          )}
        </article>

        {/* 공감 / 댓글 카운터 */}
        <div className="flex items-center gap-lg py-lg border-b border-outline-variant">
          <button
            onClick={handleLike}
            className={`flex items-center gap-xs px-4 py-2 rounded-xl transition-all active:scale-95 ${
              liked ? 'text-primary bg-primary-container/20' : 'text-primary hover:bg-primary-container/10'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={liked ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              thumb_up
            </span>
            <span className="font-label-lg">공감 {likeCount}</span>
          </button>
          <div className="flex items-center gap-xs text-on-surface-variant px-4 py-2">
            <span className="material-symbols-outlined">chat_bubble</span>
            <span className="font-label-lg">댓글 {comments.length}</span>
          </div>
        </div>

        {/* 댓글 목록 */}
        <section className="py-lg space-y-md">
          <h3 className="font-label-lg text-on-surface">댓글 ({comments.length})</h3>
          <div className="space-y-gutter">
            {comments.map(comment => (
              <div key={comment.id} className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant">
                <div className="flex items-center justify-between mb-2">
                  {/* 댓글도 닉네임만 표시 */}
                  <span className="font-label-lg text-on-surface">{comment.users?.nickname}</span>
                  <span className="font-label-sm text-on-surface-variant text-xs">{timeAgo(comment.created_at)}</span>
                </div>
                <p className="font-body-md text-on-surface-variant">{comment.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 하단 고정 영역 */}
      <div className="fixed bottom-0 w-full max-w-[768px] left-1/2 -translate-x-1/2 bg-surface/90 backdrop-blur-md border-t border-outline-variant p-container-margin z-40">
        {/* 안건 발의 버튼 */}
        {!hasPetition ? (
          <div className="mb-4">
            <button
              onClick={() => setShowPetitionModal(true)}
              className="w-full bg-primary text-on-primary py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined">assignment_turned_in</span>
              <span className="font-headline-md">정식 안건 발의하기</span>
            </button>
            <p className="text-center font-label-sm text-on-surface-variant mt-2">
              공감 50개 달성 시 입주자 대표 회의에 자동 상정됩니다. (현재 {likeCount}/50)
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <button
              onClick={() => navigate(`/petition/${petitionId}`)}
              className="w-full bg-secondary text-on-secondary py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined">how_to_vote</span>
              <span className="font-headline-md">청원 투표 참여하기</span>
            </button>
          </div>
        )}

        {/* 댓글 입력 */}
        <div className="flex items-center gap-gutter">
          <div className="flex-1 bg-surface-container-high rounded-full px-4 py-2 flex items-center border border-transparent focus-within:border-primary transition-all">
            <input
              type="text"
              placeholder="의견을 남겨주세요..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              className="bg-transparent border-none focus:ring-0 w-full font-body-md text-on-surface py-1 placeholder:text-outline outline-none"
            />
            <button onClick={handleComment} className="text-primary p-1 hover:bg-primary/10 rounded-full transition-colors">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>

      {/* 청원 발의 모달 */}
      {showPetitionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-container-margin">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPetitionModal(false)} />
          <div className="relative bg-surface-container-lowest rounded-2xl p-xl w-full max-w-[360px] shadow-2xl">
            <h3 className="font-headline-md text-headline-md mb-md">정식 안건 발의</h3>
            <p className="font-body-md text-on-surface-variant mb-md text-sm">
              요구사항을 한두 문장으로 요약해주세요. 관리사무소 제출 문서에 포함됩니다.
            </p>
            <textarea
              placeholder="예: 지하 2층 E구역 이중주차 근절을 위한 규제봉 설치를 요청합니다."
              value={petitionSummary}
              onChange={e => setPetitionSummary(e.target.value)}
              rows={4}
              className="w-full p-3 bg-surface-container rounded-xl border border-outline-variant focus:border-primary outline-none resize-none font-body-md text-on-surface placeholder:text-outline mb-lg"
            />
            <div className="flex gap-sm">
              <button
                onClick={() => setShowPetitionModal(false)}
                className="flex-1 py-3 rounded-xl border border-outline-variant font-label-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                취소
              </button>
              <button
                onClick={handlePetition}
                disabled={submittingPetition || !petitionSummary.trim()}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-label-lg active:scale-95 transition-all disabled:opacity-60"
              >
                {submittingPetition ? '발의 중...' : '발의하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
