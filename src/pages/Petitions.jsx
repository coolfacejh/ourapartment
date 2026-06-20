import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

const STATUS_LABEL = {
  active:    { label: '진행 중', className: 'bg-primary/10 text-primary' },
  achieved:  { label: '목표 달성', className: 'bg-secondary-container text-on-secondary-container' },
  submitted: { label: '제출 완료', className: 'bg-surface-container-highest text-on-surface-variant' },
}

export default function Petitions() {
  const navigate = useNavigate()
  const location = useLocation()
  const [petitions, setPetitions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('petitions')
          .select(`
            id, target_rate, status, summary, deadline, created_at,
            posts(id, title, category)
          `)
          .order('created_at', { ascending: false })
        if (error) throw error
        setPetitions(data ?? [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [location.key])

  return (
    <div className="bg-background min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 bg-surface border-b border-outline-variant">
        <div className="flex items-center px-container-margin h-14 w-full max-w-[768px] mx-auto">
          <span className="material-symbols-outlined text-primary mr-2">how_to_vote</span>
          <h1 className="font-headline-md text-headline-md font-semibold text-primary">청원 목록</h1>
        </div>
      </header>

      <main className="pt-14 max-w-[768px] mx-auto px-container-margin py-lg space-y-md">
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          </div>
        ) : petitions.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4 block">assignment</span>
            <p className="font-body-md">아직 청원이 없습니다.</p>
            <p className="font-label-sm mt-1">게시글에서 안건을 발의해보세요.</p>
          </div>
        ) : (
          petitions.map(p => {
            const badge = STATUS_LABEL[p.status] || STATUS_LABEL.active
            return (
              <button
                key={p.id}
                onClick={() => navigate(`/petition/${p.id}`)}
                className="w-full text-left bg-white border border-outline-variant rounded-xl p-md space-y-sm active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant text-label-sm rounded-md">
                    {p.posts?.category}
                  </span>
                  <span className={`px-3 py-1 text-label-sm rounded-full ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
                <h3 className="font-headline-md text-on-surface">{p.posts?.title}</h3>
                {p.summary && (
                  <p className="text-on-surface-variant text-body-md line-clamp-2">{p.summary}</p>
                )}
                <div className="flex items-center gap-sm text-on-surface-variant text-label-sm">
                  <span>목표 {p.target_rate}% 동의</span>
                  {p.deadline && <span>· 마감 {p.deadline}</span>}
                </div>
              </button>
            )
          })
        )}
      </main>

      <BottomNav />
    </div>
  )
}
