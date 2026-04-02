// 管理员角色与状态定义，保持与后端返回结构一致。
export type AdminRole = 'SUPER_ADMIN' | 'EDITOR'
export type AdminStatus = 'ACTIVE' | 'DISABLED'

export interface AdminProfile {
  id: string
  username: string
  displayName: string
  role: AdminRole
  status: AdminStatus
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminLoginPayload {
  username: string
  password: string
}

export interface AdminLoginResponse {
  user: AdminProfile
  expiresIn: number
}

export interface AdminProfileResponse {
  user: AdminProfile
}
