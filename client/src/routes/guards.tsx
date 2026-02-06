import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Permission } from '../types/auth'
import { hasAnyPermission, hasPermission } from '../utils/permissions'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export function RequirePermission({
  children,
  permissions,
  requireAll = false
}: {
  children: ReactNode
  permissions: Permission[]
  requireAll?: boolean
}) {
  const { user } = useAuth()
  const allowed = requireAll
    ? permissions.every((permission) => hasPermission(user, permission))
    : hasAnyPermission(user, permissions)

  if (!allowed) {
    return <Navigate to="/no-access" replace />
  }

  return children
}
