import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import SignUp from './pages/SignUp'
import Home from './pages/Home'
import PostDetail from './pages/PostDetail'
import WritePost from './pages/WritePost'
import PetitionVote from './pages/PetitionVote'
import Petitions from './pages/Petitions'
import Profile from './pages/Profile'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl">
        progress_activity
      </span>
    </div>
  )
  return user ? children : <Navigate to="/signup" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/home" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/signup" element={
            <PublicRoute><SignUp /></PublicRoute>
          } />
          <Route path="/home" element={
            <PrivateRoute><Home /></PrivateRoute>
          } />
          <Route path="/post/:id" element={
            <PrivateRoute><PostDetail /></PrivateRoute>
          } />
          <Route path="/write" element={
            <PrivateRoute><WritePost /></PrivateRoute>
          } />
          <Route path="/petitions" element={
            <PrivateRoute><Petitions /></PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute><Profile /></PrivateRoute>
          } />
          <Route path="/petition/:id" element={
            <PrivateRoute><PetitionVote /></PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
