import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ──────────────────────────────────────────────
// MVP: Auth 없이 localStorage 기반 세션
// ──────────────────────────────────────────────

const USER_KEY = 'mvp_user'

export function getLocalUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

function saveLocalUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export async function signUp({ complexCode, dong, ho, nickname }) {
  // 단지 조회 (코드 맞으면 해당, 아니면 첫 번째)
  let complex = null
  const { data: byCode } = await supabase
    .from('complexes')
    .select('id, name, total_households')
    .eq('signup_code', complexCode.trim().toUpperCase())
    .single()

  if (byCode) {
    complex = byCode
  } else {
    const { data: first } = await supabase
      .from('complexes')
      .select('id, name, total_households')
      .limit(1)
      .single()
    complex = first
  }

  if (!complex) throw new Error('등록된 단지가 없습니다.')

  const userId = crypto.randomUUID()
  const finalNickname = nickname.trim() || `${dong.trim()}동 입주민`

  const { error } = await supabase.from('users').insert({
    id: userId,
    complex_id: complex.id,
    dong: dong.trim(),
    ho_hash: ho.trim(),
    nickname: finalNickname,
  })

  if (error) throw error

  const profile = {
    id: userId,
    complex_id: complex.id,
    dong: dong.trim(),
    ho_hash: ho.trim(),
    nickname: finalNickname,
    complexes: { name: complex.name, total_households: complex.total_households },
  }

  saveLocalUser(profile)
  return { user: profile, complex }
}

export async function signIn() {
  return getLocalUser()
}

export async function signOut() {
  localStorage.removeItem(USER_KEY)
}

export async function getCurrentUser() {
  return getLocalUser()
}

// ──────────────────────────────────────────────
// Posts
// ──────────────────────────────────────────────

export async function getPosts({ category = null, sort = 'latest' } = {}) {
  let query = supabase
    .from('posts')
    .select(`
      id, title, body, category, status, view_count, created_at,
      users(id, nickname, dong),
      images(url, display_order)
    `)
    .eq('is_blinded', false)

  if (category) query = query.eq('category', category)

  query = sort === 'popular'
    ? query.order('view_count', { ascending: false })
    : query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getPost(id) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, title, body, category, status, view_count, created_at,
      users(id, nickname, dong),
      images(url, display_order),
      comments(
        id, body, created_at, is_blinded,
        users(id, nickname, dong)
      ),
      petitions(id, target_rate, status, summary, deadline)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createPost({ category, title, body, imageFiles = [] }) {
  const user = getLocalUser()
  if (!user) throw new Error('로그인이 필요합니다.')

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      complex_id: user.complex_id,
      user_id: user.id,
      category,
      title,
      body,
    })
    .select()
    .single()

  if (error) throw error

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i]
    const ext = file.name.split('.').pop()
    const path = `${user.complex_id}/${post.id}/${i}.${ext}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(path, file)

    if (!uploadError && uploadData) {
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(path)

      await supabase.from('images').insert({
        post_id: post.id,
        url: publicUrl,
        display_order: i,
      })
    }
  }

  return post
}

// ──────────────────────────────────────────────
// Reactions
// ──────────────────────────────────────────────

export async function toggleReaction({ targetType, targetId }) {
  const user = getLocalUser()
  if (!user) throw new Error('로그인이 필요합니다.')

  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id)
    return false
  } else {
    await supabase.from('reactions').insert({
      target_type: targetType,
      target_id: targetId,
      user_id: user.id,
    })
    return true
  }
}

// ──────────────────────────────────────────────
// Comments
// ──────────────────────────────────────────────

export async function addComment({ postId, body }) {
  const user = getLocalUser()
  if (!user) throw new Error('로그인이 필요합니다.')

  const { data, error } = await supabase.from('comments').insert({
    post_id: postId,
    user_id: user.id,
    body,
  }).select(`id, body, created_at, users(id, nickname, dong)`).single()

  if (error) throw error
  return data
}

// ──────────────────────────────────────────────
// Petitions
// ──────────────────────────────────────────────

export async function createPetition({ postId, summary, targetRate = 10 }) {
  const { data, error } = await supabase.from('petitions').insert({
    post_id: postId,
    summary,
    target_rate: targetRate,
  }).select().single()

  if (error) throw error

  await supabase.from('posts').update({ status: 'petition' }).eq('id', postId)
  return data
}

export async function votePetition({ petitionId, vote }) {
  const user = getLocalUser()
  if (!user) throw new Error('로그인이 필요합니다.')

  const { data, error } = await supabase.from('petition_votes').insert({
    petition_id: petitionId,
    user_id: user.id,
    vote,
  }).select().single()

  if (error) {
    if (error.code === '23505') throw new Error('이미 투표하셨습니다.')
    throw error
  }
  return data
}

export async function getPetitionStats(petitionId) {
  const { data, error } = await supabase
    .from('petition_stats')
    .select('*')
    .eq('petition_id', petitionId)
    .single()

  if (error) throw error
  return data
}

// ──────────────────────────────────────────────
// Reports
// ──────────────────────────────────────────────

export async function submitReport({ targetType, targetId, reason }) {
  const user = getLocalUser()
  if (!user) throw new Error('로그인이 필요합니다.')

  const { data, error } = await supabase.from('reports').insert({
    target_type: targetType,
    target_id: targetId,
    reporter_id: user.id,
    reason,
  }).select().single()

  if (error) throw error
  return data
}
