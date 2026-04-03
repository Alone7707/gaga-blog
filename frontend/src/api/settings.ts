import { request } from './http'
import type {
  AdminSettingsResponse,
  AdminSettingsUpdatePayload,
} from '../types/settings'

// 读取后台全部站点设置，当前设置页采用一次拉全量的最小交付方式。
export function getAdminSettings() {
  return request<AdminSettingsResponse>({
    url: '/api/admin/settings',
    method: 'get',
  })
}

// 批量更新站点设置，页面统一整理为后端需要的 items 结构。
export function updateAdminSettings(payload: AdminSettingsUpdatePayload) {
  return request<AdminSettingsResponse>({
    url: '/api/admin/settings',
    method: 'patch',
    data: payload,
  })
}
