import { request } from './http'
import type {
  AdminCommentDetailResponse,
  AdminCommentListQuery,
  AdminCommentListResponse,
  AdminCommentReviewPayload,
  AdminCommentReviewResponse,
  AdminCommentStatsEnvelope,
} from '../types/comment'

// 评论审核相关接口统一封装，页面只关心筛选条件和动作结果。
export function getAdminCommentStats() {
  return request<AdminCommentStatsEnvelope>({
    url: '/api/admin/comments/stats',
    method: 'get',
  })
}

export function getAdminComments(params: AdminCommentListQuery = {}) {
  return request<AdminCommentListResponse>({
    url: '/api/admin/comments',
    method: 'get',
    params: buildCommentListParams(params),
  })
}

export function getAdminCommentDetail(id: string) {
  return request<AdminCommentDetailResponse>({
    url: `/api/admin/comments/${id}`,
    method: 'get',
  })
}

// 审核动作统一走这里收口，避免页面层分散拼接接口地址。
export function approveAdminComment(id: string, payload: AdminCommentReviewPayload = {}) {
  return request<AdminCommentReviewResponse>({
    url: `/api/admin/comments/${id}/approve`,
    method: 'post',
    data: buildReviewPayload(payload),
  })
}

export function rejectAdminComment(id: string, payload: AdminCommentReviewPayload = {}) {
  return request<AdminCommentReviewResponse>({
    url: `/api/admin/comments/${id}/reject`,
    method: 'post',
    data: buildReviewPayload(payload),
  })
}

export function markAdminCommentSpam(id: string, payload: AdminCommentReviewPayload = {}) {
  return request<AdminCommentReviewResponse>({
    url: `/api/admin/comments/${id}/spam`,
    method: 'post',
    data: buildReviewPayload(payload),
  })
}

function buildCommentListParams(params: AdminCommentListQuery) {
  return {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
    ...(params.status ? { status: params.status } : {}),
    ...(params.keyword?.trim() ? { keyword: params.keyword.trim() } : {}),
    ...(params.postId?.trim() ? { postId: params.postId.trim() } : {}),
  }
}

function buildReviewPayload(payload: AdminCommentReviewPayload) {
  const reason = payload.reason?.trim()

  return {
    ...(reason ? { reason } : {}),
  }
}
