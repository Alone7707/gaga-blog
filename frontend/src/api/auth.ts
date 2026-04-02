import { request } from './http'
import type { AdminLoginPayload, AdminLoginResponse, AdminProfileResponse } from '../types/auth'

// 管理员登录接口，成功后由后端写入 HttpOnly Cookie。
export function loginAdmin(payload: AdminLoginPayload) {
  return request<AdminLoginResponse>({
    url: '/api/admin/auth/login',
    method: 'post',
    data: payload,
  })
}

// 获取当前登录管理员信息，用于刷新恢复登录态与守卫校验。
export function getAdminProfile() {
  return request<AdminProfileResponse>({
    url: '/api/admin/auth/me',
    method: 'get',
  })
}

// 管理员退出登录接口，调用后服务端会清理登录 Cookie。
export function logoutAdmin() {
  return request<Record<string, never>>({
    url: '/api/admin/auth/logout',
    method: 'post',
  })
}
