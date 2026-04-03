import { request } from './http'
import type { AdminDashboardOverviewResponse } from '../types/dashboard'

// 后台仪表盘概览接口，统一为页面提供统计卡片与最近动态数据。
export function getAdminDashboardOverview() {
  return request<AdminDashboardOverviewResponse>({
    url: '/api/admin/dashboard/overview',
    method: 'get',
  })
}
