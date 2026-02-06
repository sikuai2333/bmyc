import type { Permission, User } from '../types/auth'

export function hasPermission(user: User | null, permission: Permission) {
  if (!user) return false
  if (user.isSuperAdmin) return true
  return user.permissions?.includes(permission) ?? false
}

export function hasAnyPermission(user: User | null, permissions: Permission[]) {
  return permissions.some((permission) => hasPermission(user, permission))
}
