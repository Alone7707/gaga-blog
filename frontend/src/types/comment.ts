import type { PaginationMeta } from './taxonomy'

export type AdminCommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM'
export type AdminCommentReviewAction = 'approve' | 'reject' | 'spam'

export interface AdminCommentPostSummary {
  id: string
  title: string
  slug: string
}

export interface AdminCommentReviewerSummary {
  id: string
  username: string
  displayName: string
}

export interface AdminCommentParentSummary {
  id: string
  authorName: string
  content: string
  status?: AdminCommentStatus
}

export interface AdminCommentReplyItem {
  id: string
  authorName: string
  content: string
  status: AdminCommentStatus
  reviewReason: string | null
  createdAt: string
  approvedAt: string | null
  reviewedBy: AdminCommentReviewerSummary | null
}

export interface AdminCommentItem {
  id: string
  postId: string
  parentId: string | null
  authorName: string
  authorEmail: string
  authorWebsite: string | null
  content: string
  status: AdminCommentStatus
  reviewReason: string | null
  ipHash: string | null
  userAgent: string | null
  createdAt: string
  updatedAt: string
  approvedAt: string | null
  post: AdminCommentPostSummary
  parent: AdminCommentParentSummary | null
  reviewedBy: AdminCommentReviewerSummary | null
  replyCount: number
  approvedReplyCount: number
}

export interface AdminCommentDetail extends Omit<AdminCommentItem, 'replyCount' | 'approvedReplyCount'> {
  replies: AdminCommentReplyItem[]
}

export interface AdminCommentStatsResponse {
  total: number
  pending: number
  approved: number
  rejected: number
  spam: number
  pendingRate: number
  approvedRate: number
  latestComment: {
    id: string
    createdAt: string
    post: AdminCommentPostSummary
  } | null
}

export interface AdminCommentListQuery {
  page?: number
  pageSize?: number
  status?: AdminCommentStatus | ''
  keyword?: string
  postId?: string
}

export interface AdminCommentListResponse {
  list: AdminCommentItem[]
  pagination: PaginationMeta
}

export interface AdminCommentDetailResponse {
  comment: AdminCommentDetail
}

export interface AdminCommentStatsEnvelope {
  stats: AdminCommentStatsResponse
}

export interface AdminCommentReviewPayload {
  reason?: string
}

export interface AdminCommentReviewResponse {
  comment: AdminCommentDetail
}
