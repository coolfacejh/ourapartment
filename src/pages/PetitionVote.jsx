import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, votePetition, getPetitionStats } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function PetitionVote() {
  const { id } = useParams()  // petition_id
  const navigate = useNavigate()
  const { user } = useAuth()

  const [petition, setPetition] = useState(null)
  const [stats, setStats] = useState(null)
  const [myVote, setMyVote] = useState(null)  // 'agree' | 'disagree' | null
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        // 청원 기본 정보
        const { data: pet, error } = await supabase
          .from('petitions')
          .select(`id, target_rate, status, summary, deadline, posts(id, title, body, category)`)
          .eq('id', id)
          .single()
        if (error) throw error
        setPetition(pet)

        // 집계 통계
        const statsData = await getPetitionStats(id)
        setStats(statsData)

        // 내 투표 여부
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const { data: vote } = await supabase
            .from('petition_votes')
            .select('vote')
            .eq('petition_id', id)
            .eq('user_id', authUser.id)
            .single()
          setMyVote(vote?.vote || null)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  const handleVote = async (vote) => {
    if (myVote) return  // 이미 투표함
    setVoting(true)
    try {
      await votePetition({ petitionId: id, vote })
      setMyVote(vote)
      // 통계 갱신
      const updated = await getPetitionStats(id)
      setStats(updated)
    } catch (e) {
      alert(e.message)
    } finally {
      setVoting(false)
    }
  }

  const participationRate = stats?.participation_rate ?? 0
  const targetRate = petition?.target_rate ?? 10
  const progressPct = Math.min((participationRate / targetRate) * 100, 100)
  const isAchieved = petition?.status === 'achieved' || petition?.status === 'submitted'

  const daysLeft = petition?.deadline
    ? Math.ceil((new Date(petition.deadline) - Date.now()) / 86400000)
    : null

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
    </div>
  )

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col">
      {/* 상단 앱바 */}
      <header className="fixed top-0 w-full z-50 bg-surface border-b border-outline-variant">
        <div className="flex items-center justify-between px-container-margin h-14 w-full max-w-[768px] mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <span className="font-headline-md text-headline-md font-semibold text-primary">청원 투표</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 mt-14 mb-20 px-container-margin w-full max-w-[768px] mx-auto py-lg space-y-lg">
        {/* 헤더 */}
        <section className="space-y-base">
          <div className="flex items-center gap-xs text-on-surface-variant font-label-lg text-label-lg">
            <span>청원함</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-primary">진행 중인 청원</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface">
            {petition?.posts?.title}
          </h1>
          <div className="flex items-center gap-sm mt-sm">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm">
              입주자 청원
            </span>
            {daysLeft !== null && (
              <span className="text-on-surface-variant font-label-sm text-label-sm">
                D-{daysLeft} 남음
              </span>
            )}
            {isAchieved && (
              <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
                목표 달성!
              </span>
            )}
          </div>
        </section>

        {/* 참여 현황 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
          <div className="md:col-span-2 bg-white border border-outline-variant p-md rounded-xl flex flex-col justify-between h-48">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-on-surface-variant font-label-lg text-label-lg">실시간 참여 현황</p>
                <h2 className="font-headline-lg text-headline-lg text-primary mt-base">
                  현재 참여율 {participationRate.toFixed(1)}%
                </h2>
              </div>
              <div className="bg-surface-container-high px-3 py-2 rounded-lg text-center">
                <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-tighter">목표</p>
                <p className="font-headline-md text-headline-md text-on-surface">{targetRate}%</p>
              </div>
            </div>
            <div className="w-full space-y-xs">
              <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>현재 {stats?.total_votes ?? 0}명 참여</span>
                <span>최소 {Math.ceil((stats?.total_households ?? 0) * targetRate / 100)}명 필요</span>
              </div>
              <div className="relative w-full h-4 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPct}%`, boxShadow: '0 0 12px rgba(59,130,246,0.4)' }}
                />
                <div
                  className="absolute top-0 h-full border-l-2 border-dashed border-on-surface-variant/40"
                  style={{ left: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* 제출 상태 카드 */}
          <div className="bg-surface-container-low border border-outline-variant p-md rounded-xl flex flex-col items-center justify-center space-y-sm">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm border border-outline-variant">
              <span className="material-symbols-outlined text-primary text-3xl">description</span>
            </div>
            <div className="text-center">
              <p className="text-on-surface-variant font-label-sm text-label-sm">제출 상태</p>
              <p className="font-headline-md text-headline-md text-on-surface">
                {petition?.status === 'submitted' ? '제출 완료' : isAchieved ? '제출 가능' : '심사 대기'}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full font-label-sm text-label-sm ${
              isAchieved
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-surface-variant text-on-surface-variant opacity-50'
            }`}>
              {isAchieved ? '목표 달성 완료' : '진행 중'}
            </div>
          </div>
        </div>

        {/* 청원 요약 */}
        <section className="bg-white border border-outline-variant p-lg rounded-xl space-y-md">
          <h3 className="font-headline-md text-headline-md">청원 요약</h3>
          <p className="text-on-surface-variant font-body-md text-body-md leading-relaxed">
            {petition?.summary || petition?.posts?.body}
          </p>
          <div className="flex flex-wrap gap-sm pt-sm">
            <div className="flex items-center gap-xs px-3 py-2 bg-surface-container rounded-lg border border-outline-variant">
              <span className="material-symbols-outlined text-[18px]">group</span>
              <span className="font-label-sm text-label-sm">
                동의율: {stats?.total_votes ? Math.round((stats.agree_count / stats.total_votes) * 100) : 0}% (참여자 중)
              </span>
            </div>
          </div>
        </section>

        {/* 투표 버튼 */}
        <section className="space-y-sm">
          {myVote ? (
            <div className="bg-surface-container-low rounded-xl p-4 text-center">
              <span className="material-symbols-outlined text-secondary text-3xl block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                {myVote === 'agree' ? 'thumb_up' : 'thumb_down'}
              </span>
              <p className="font-label-lg text-on-surface-variant">
                {myVote === 'agree' ? '찬성' : '반대'}에 투표하셨습니다.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-sm">
              <div className="flex-1">
                <button
                  onClick={() => handleVote('agree')}
                  disabled={voting}
                  className="w-full h-14 rounded-xl bg-primary text-on-primary font-headline-md text-headline-md flex items-center justify-center gap-sm hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-60"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                  찬성
                </button>
                <p className="text-center mt-xs font-label-sm text-label-sm text-on-surface-variant">
                  {stats?.agree_count ?? 0}명 동의
                </p>
              </div>
              <div className="flex-1">
                <button
                  onClick={() => handleVote('disagree')}
                  disabled={voting}
                  className="w-full h-14 rounded-xl border-2 border-outline-variant bg-surface text-on-surface-variant font-headline-md text-headline-md flex items-center justify-center gap-sm hover:bg-surface-container transition-all active:scale-95 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined">thumb_down</span>
                  반대
                </button>
                <p className="text-center mt-xs font-label-sm text-label-sm text-on-surface-variant">
                  {stats?.disagree_count ?? 0}명 반대
                </p>
              </div>
            </div>
          )}
          <p className="text-center font-label-sm text-label-sm text-on-surface-variant/60 pt-sm">
            투표는 한 세대당 1회만 가능하며, 제출 후 수정이 불가합니다.
          </p>
        </section>

        {/* 진행 단계 */}
        <section className="space-y-md">
          <h3 className="font-headline-md text-headline-md">청원 처리 단계</h3>
          <div className="relative pl-8 space-y-lg">
            <div className="absolute left-3 top-2 bottom-2 w-[2px] bg-outline-variant" />
            {[
              { label: '청원 제기', desc: '민원 게시글에서 안건 발의 완료', done: true },
              { label: '입주민 투표 진행 중', desc: '현재 찬반 투표를 통해 의견을 수렴 중입니다.', active: !isAchieved },
              { label: '관리사무소 검토', desc: '투표 결과에 따른 타당성 검토', done: petition?.status === 'submitted' },
              { label: '최종 심의 및 시행', desc: '공사 일정 수립 및 설치 시행', done: false },
            ].map((step, i) => (
              <div key={i} className={`relative ${!step.done && !step.active ? 'opacity-40' : ''}`}>
                <div className={`absolute -left-[26px] w-5 h-5 rounded-full flex items-center justify-center ${
                  step.done ? 'bg-primary' : step.active ? 'bg-white border-4 border-primary' : 'bg-outline-variant'
                }`}>
                  {step.done && <span className="material-symbols-outlined text-[12px] text-on-primary">check</span>}
                </div>
                <div>
                  <h4 className={`font-label-lg text-label-lg ${step.done ? 'text-primary' : 'text-on-surface'}`}>
                    {step.label}
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
