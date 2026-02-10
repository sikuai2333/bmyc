export type Role = 'admin' | 'user' | 'display'

export type Permission =
  | 'people.view.all'
  | 'people.edit.all'
  | 'people.edit.self'
  | 'dimensions.view.all'
  | 'dimensions.edit.all'
  | 'dimensions.edit.self'
  | 'evaluations.view'
  | 'evaluations.edit'
  | 'growth.view.all'
  | 'growth.edit.all'
  | 'growth.edit.self'
  | 'meetings.view'
  | 'meetings.edit'
  | 'certificates.view'
  | 'certificates.upload'
  | 'certificates.delete'
  | 'sensitive.view'
  | 'users.manage'
  | 'permissions.manage'
  | 'import.excel'
  | 'export.excel'
  | 'logs.view'

export interface User {
  id: number
  name: string
  email?: string
  role: Role
  permissions: Permission[]
  personId?: number
  isSuperAdmin?: boolean
  sensitiveUnmasked?: boolean
}

export interface LoginPayload {
  account: string
  password: string
  remember: boolean
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: '管理员',
  user: '用户',
  display: '展示专用'
}

export function getRoleLabel(user?: User | null) {
  if (!user) return '—'
  if (user.isSuperAdmin) return '超级管理员'
  return ROLE_LABELS[user.role]
}
