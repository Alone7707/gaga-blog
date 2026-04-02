import { request } from './http'
import type { AdminPostDetailResponse, AdminPostListQuery, AdminPostListResponse } from '../types/post'

// 将后台文章列表请求统一封装，页面只关心查询参数和返回结果。
export function getAdminPosts(params: AdminPostListQuery) {
  return request<AdminPostListResponse>({
    url: '/api/admin/posts',
    method: 'get',
    params: buildPostListParams(params),
  })
}

// 文章详情接口用于编辑页回填，当前先承接最小可用编辑入口。
export function getAdminPostDetail(id: string) {
  return request<AdminPostDetailResponse>({
    url: `/api/admin/posts/${id}`,
    method: 'get',
  })
}

// 过滤空参数，避免把占位筛选项无意义传给后端。
function buildPostListParams(params: AdminPostListQuery) {
  return {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
    ...(params.status ? { status: params.status } : {}),
    ...(params.keyword?.trim() ? { keyword: params.keyword.trim() } : {}),
    ...(params.categoryId?.trim() ? { categoryId: params.categoryId.trim() } : {}),
  }
}
