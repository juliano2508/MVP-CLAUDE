import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth()

  if (loading) {
    return <div className="flex justify-center py-24 text-gray-500">Carregando…</div>
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
