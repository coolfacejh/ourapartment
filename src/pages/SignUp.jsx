import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signUp } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getCurrentUser } from '../lib/supabase'

export default function SignUp() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [form, setForm] = useState({ complexCode: '', dong: '', ho: '', nickname: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.complexCode || !form.dong || !form.ho) {
      setError('단지 가입코드, 동, 호수는 필수 입력입니다.')
      return
    }

    setLoading(true)
    try {
      await signUp(form)
      const profile = await getCurrentUser()
      setUser(profile)
      navigate('/home')
    } catch (err) {
      setError(err.message || '가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-container-margin py-xl bg-background">
      <div className="w-full max-w-[440px] bg-surface-container-lowest p-xl rounded-[32px] shadow-sm border border-outline-variant/30">
        {/* 브랜드 */}
        <div className="text-center mb-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-md text-on-primary">
            <span className="material-symbols-outlined text-[32px]">apartment</span>
          </div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            우리단지토크
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-base">
            이웃과 소통하는 투명한 커뮤니티
          </p>
        </div>

        {/* 폼 */}
        <form className="space-y-lg" onSubmit={handleSubmit}>
          {/* 단지 가입코드 */}
          <div className="space-y-xs">
            <label className="font-label-lg text-label-lg text-on-surface-variant px-1" htmlFor="complexCode">
              단지 가입코드
            </label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">key</span>
              <input
                id="complexCode"
                type="text"
                placeholder="코드를 입력하세요"
                value={form.complexCode}
                onChange={set('complexCode')}
                className="w-full h-14 pl-12 pr-4 bg-surface-container rounded-xl border border-transparent focus:border-primary focus:outline-none transition-all placeholder:text-outline-variant"
              />
            </div>
          </div>

          {/* 동 / 호수 */}
          <div className="grid grid-cols-2 gap-md">
            <div className="space-y-xs">
              <label className="font-label-lg text-label-lg text-on-surface-variant px-1" htmlFor="dong">동</label>
              <input
                id="dong"
                type="text"
                placeholder="예: 101"
                value={form.dong}
                onChange={set('dong')}
                className="w-full h-14 px-4 bg-surface-container rounded-xl border border-transparent focus:border-primary focus:outline-none transition-all placeholder:text-outline-variant text-center"
              />
            </div>
            <div className="space-y-xs">
              <label className="font-label-lg text-label-lg text-on-surface-variant px-1" htmlFor="ho">호수</label>
              <input
                id="ho"
                type="text"
                placeholder="예: 502"
                value={form.ho}
                onChange={set('ho')}
                className="w-full h-14 px-4 bg-surface-container rounded-xl border border-transparent focus:border-primary focus:outline-none transition-all placeholder:text-outline-variant text-center"
              />
            </div>
          </div>

          {/* 닉네임 */}
          <div className="space-y-xs">
            <label className="font-label-lg text-label-lg text-on-surface-variant px-1" htmlFor="nickname">
              닉네임 <span className="text-outline font-normal">(선택, 미입력 시 자동 생성)</span>
            </label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">badge</span>
              <input
                id="nickname"
                type="text"
                placeholder={`${form.dong || '101'}동 입주민`}
                value={form.nickname}
                onChange={set('nickname')}
                className="w-full h-14 pl-12 pr-4 bg-surface-container rounded-xl border border-transparent focus:border-primary focus:outline-none transition-all placeholder:text-outline-variant"
              />
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-error font-label-sm text-label-sm px-1">{error}</p>
          )}

          {/* 제출 */}
          <div className="pt-md">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-xs disabled:opacity-60"
            >
              {loading
                ? <><span className="material-symbols-outlined animate-spin">progress_activity</span> 처리 중...</>
                : <><span>가입하기</span><span className="material-symbols-outlined text-[20px]">arrow_forward</span></>
              }
            </button>
          </div>
        </form>

        {/* 안내 */}
        <div className="mt-xl text-center">
          <div className="flex items-center justify-center gap-gutter text-outline opacity-40 mt-sm">
            <span className="h-px w-8 bg-current" />
            <span className="font-label-sm text-[10px]">입주민 전용 커뮤니티</span>
            <span className="h-px w-8 bg-current" />
          </div>
        </div>
      </div>

      {/* 신뢰 배지 */}
      <div className="mt-lg flex items-center gap-gutter px-md py-sm bg-surface-container-high/50 rounded-full border border-outline-variant/20">
        <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">입주민 인증 시스템으로 안전하게 관리됩니다</span>
      </div>
    </main>
  )
}
