import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPost } from '../lib/supabase'

const CATEGORIES = ['주차', '흡연', '소음', '시설', '기타']

export default function WritePost() {
  const navigate = useNavigate()
  const [category, setCategory] = useState('주차')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [images, setImages] = useState([])  // { file, preview }[]
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const fileInputRef = useRef(null)

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files)
    const remaining = 5 - images.length
    const selected = files.slice(0, remaining)
    const newImages = selected.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setImages(prev => [...prev, ...newImages])
  }

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      await createPost({ category, title, body, imageFiles: images.map(i => i.file) })
      setShowModal(true)
    } catch (err) {
      alert(err.message || '등록 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="font-body-md text-on-surface min-h-screen bg-background">
      {/* 상단 앱바 */}
      <header className="fixed top-0 w-full z-50 bg-surface border-b border-outline-variant">
        <div className="flex items-center justify-between px-container-margin h-14 w-full max-w-[768px] mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-surface-container transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-primary">arrow_back</span>
            </button>
            <h1 className="font-headline-md text-headline-md font-semibold text-primary">글쓰기</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-primary text-on-primary px-4 py-1.5 rounded-full font-label-lg text-label-lg hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-60"
          >
            {loading ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </header>

      {/* 메인 */}
      <main className="pt-14 pb-20 w-full max-w-[768px] mx-auto min-h-screen">
        <div className="flex flex-col gap-lg px-container-margin py-lg">
          {/* 카테고리 */}
          <section className="flex flex-col gap-sm">
            <label className="font-label-lg text-label-lg text-on-surface-variant px-1">카테고리</label>
            <div className="flex gap-xs overflow-x-auto hide-scrollbar pb-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full border border-outline-variant font-label-lg transition-all active:scale-95 ${
                    category === cat
                      ? 'bg-primary-container text-on-primary'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          {/* 제목 + 본문 */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="border-b border-outline-variant">
              <input
                type="text"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-4 bg-transparent border-none focus:ring-0 font-headline-md text-headline-md text-on-surface placeholder:text-outline outline-none"
              />
            </div>
            <textarea
              placeholder="내용을 입력하세요"
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={12}
              className="w-full px-4 py-4 bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface placeholder:text-outline resize-none outline-none"
            />
          </div>

          {/* 사진 업로드 */}
          <section className="flex flex-col gap-sm">
            <div className="flex items-center justify-between px-1">
              <label className="font-label-lg text-label-lg text-on-surface-variant">사진 (최대 5장)</label>
              <span className="text-label-sm text-outline">{images.length}/5</span>
            </div>
            <div className="flex gap-sm overflow-x-auto hide-scrollbar py-1">
              {images.length < 5 && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:bg-surface-container-high transition-colors active:scale-95"
                  >
                    <span className="material-symbols-outlined text-primary">add_a_photo</span>
                    <span className="text-label-sm">사진 추가</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageAdd}
                  />
                </>
              )}
              {images.map((img, idx) => (
                <div key={idx} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-black/40 text-white rounded-full p-0.5 hover:bg-black/60 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 안내 */}
          <div className="bg-surface-container-low rounded-lg p-4 flex gap-3">
            <span className="material-symbols-outlined text-primary shrink-0">info</span>
            <p className="text-label-sm text-on-surface-variant leading-relaxed">
              이웃에게 불쾌감을 줄 수 있는 게시글은 운영정책에 따라 제한될 수 있습니다. 깨끗한 아파트 문화를 위해 상호 존중하며 대화해 주세요.
            </p>
          </div>
        </div>
      </main>

      {/* 성공 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-container-margin">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-surface-container-lowest rounded-2xl p-xl w-full max-w-[320px] flex flex-col items-center text-center shadow-2xl">
            <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mb-lg">
              <span className="material-symbols-outlined text-on-primary-container text-[32px]">check_circle</span>
            </div>
            <h3 className="font-headline-md text-headline-md mb-2">등록 완료!</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-xl">게시글이 성공적으로 등록되었습니다.</p>
            <button
              className="w-full bg-primary text-on-primary py-3 rounded-full font-label-lg text-label-lg active:scale-95 transition-transform"
              onClick={() => navigate('/home')}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
