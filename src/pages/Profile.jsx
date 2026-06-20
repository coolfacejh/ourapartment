import { useNavigate } from 'react-router-dom'
import { signOut } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

export default function Profile() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
    navigate('/signup', { replace: true })
  }

  return (
    <div className="bg-background min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 bg-surface border-b border-outline-variant">
        <div className="flex items-center px-container-margin h-14 w-full max-w-[768px] mx-auto">
          <span className="material-symbols-outlined text-primary mr-2">person</span>
          <h1 className="font-headline-md text-headline-md font-semibold text-primary">내 정보</h1>
        </div>
      </header>

      <main className="pt-14 max-w-[768px] mx-auto px-container-margin py-lg space-y-md">
        {/* 프로필 카드 */}
        <div className="bg-white border border-outline-variant rounded-2xl p-lg flex items-center gap-md">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-3xl">person</span>
          </div>
          <div>
            <p className="font-headline-md text-on-surface">{user?.nickname}</p>
            <p className="font-body-md text-on-surface-variant mt-0.5">
              {user?.dong}동 · {user?.complexes?.name || '우리단지'}
            </p>
          </div>
        </div>

        {/* 단지 정보 */}
        <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden">
          <div className="px-lg py-md border-b border-outline-variant/50">
            <p className="font-label-sm text-on-surface-variant">단지 정보</p>
          </div>
          <div className="divide-y divide-outline-variant/30">
            <div className="flex justify-between items-center px-lg py-md">
              <span className="font-body-md text-on-surface-variant">단지명</span>
              <span className="font-body-md text-on-surface">{user?.complexes?.name || '-'}</span>
            </div>
            <div className="flex justify-between items-center px-lg py-md">
              <span className="font-body-md text-on-surface-variant">동</span>
              <span className="font-body-md text-on-surface">{user?.dong}동</span>
            </div>
            <div className="flex justify-between items-center px-lg py-md">
              <span className="font-body-md text-on-surface-variant">전체 세대수</span>
              <span className="font-body-md text-on-surface">{user?.complexes?.total_households?.toLocaleString()}세대</span>
            </div>
          </div>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleSignOut}
          className="w-full py-4 rounded-xl border border-error/40 text-error font-label-lg flex items-center justify-center gap-2 hover:bg-error/5 transition-colors active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          로그아웃
        </button>
      </main>

      <BottomNav />
    </div>
  )
}
