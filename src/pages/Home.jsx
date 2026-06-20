import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getPosts } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import PostCard from '../components/PostCard'

const CATEGORIES = ['전체', '주차', '흡연', '소음', '시설', '기타']

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [posts, setPosts] = useState([])
  const [category, setCategory] = useState('전체')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const fabRef = useRef(null)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const data = await getPosts({ category: category === '전체' ? null : category })
        setPosts(data)
        setError('')
      } catch (e) {
        console.error(e)
        setError(e?.message || JSON.stringify(e))
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [category, location.key])

  // FAB 스크롤 숨김
  useEffect(() => {
    let last = 0
    const onScroll = () => {
      const st = window.scrollY
      if (fabRef.current) {
        if (st > last && st > 100) {
          fabRef.current.style.transform = 'translateY(100px) scale(0.5)'
          fabRef.current.style.opacity = '0'
        } else {
          fabRef.current.style.transform = 'translateY(0) scale(1)'
          fabRef.current.style.opacity = '1'
        }
      }
      last = st <= 0 ? 0 : st
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="font-body-md text-on-surface overflow-x-hidden min-h-screen bg-background">
      {/* 상단 앱바 */}
      <header className="fixed top-0 w-full z-50 bg-surface border-b border-outline-variant">
        <div className="flex items-center justify-between px-container-margin h-14 w-full max-w-[768px] mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">apartment</span>
            <h1 className="font-headline-md text-headline-md font-semibold text-primary">
              {user?.complexes?.name || '우리단지토크'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="hover:bg-surface-container transition-colors p-2 rounded-full">
              <span className="material-symbols-outlined text-on-surface-variant">search</span>
            </button>
            <button className="hover:bg-surface-container transition-colors p-2 rounded-full">
              <span className="material-symbols-outlined text-on-surface-variant">account_circle</span>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="pt-14 pb-32 max-w-[768px] mx-auto min-h-screen">
        {/* 헤더 섹션 */}
        <section className="px-container-margin pt-6 pb-4">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">
            {user?.complexes?.name || '우리 아파트'}
          </h2>
          <p className="text-on-surface-variant font-body-md">우리단지토크 • 주민 소통 공간</p>
        </section>

        {/* 카테고리 탭 */}
        <nav className="sticky top-14 z-40 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/30">
          <div className="flex overflow-x-auto hide-scrollbar px-container-margin py-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-none px-5 py-2 rounded-full font-label-lg transition-transform active:scale-95 ${
                  category === cat
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </nav>

        {/* 게시글 목록 */}
        <div className="px-container-margin mt-lg space-y-md">
{loading ? (
            <div className="flex justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-4 block">inbox</span>
              <p className="font-body-md">아직 게시글이 없습니다.</p>
              <p className="font-label-sm text-label-sm mt-1">첫 번째 민원을 작성해보세요!</p>
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </main>

      {/* FAB */}
      <button
        ref={fabRef}
        onClick={() => navigate('/write')}
        style={{ transition: 'transform 0.3s ease, opacity 0.3s ease' }}
        className="fixed bottom-20 right-container-margin z-50 flex items-center gap-2 bg-primary text-on-primary px-6 py-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined">edit</span>
        <span className="font-label-lg">글쓰기</span>
      </button>

      <BottomNav />
    </div>
  )
}
