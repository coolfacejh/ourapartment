import { createContext, useContext, useEffect, useState } from 'react'
import { getLocalUser } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // MVP: localStorage에서 바로 복원
    const profile = getLocalUser()
    if (profile) setUser(profile)
    setLoading(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
