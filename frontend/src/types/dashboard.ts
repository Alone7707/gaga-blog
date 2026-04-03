export type AdminDashboardPostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type AdminDashboardCommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM'

export interface DashboardStatsBlock {
  total: number
  published?: number
  draft?: number
  pending?: number
  approved?: number
}

export interface AdminDashboardRecentPostItem {
  id: string
  title: string
  slug: string
  status: AdminDashboardPostStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  commentCount: number
  author: {
    id: string
    username: string
    displayName: string
  }
  category: {
    id: string
    name: string
    slug: string
  } | null
}

export interface AdminDashboardRecentCommentItem {
  id: string
  postId: string
  authorName: string
  authorEmail: string | null
  content: string
  status: AdminDashboardCommentStatus
  createdAt: string
  approvedAt: string | null
  post: {
    id: string
    title: string
    slug: string
  }
}

export interface AdminDashboardOverviewResponse {
  stats: {
    posts: DashboardStatsBlock
    categories: DashboardStatsBlock
    tags: DashboardStatsBlock
    comments: DashboardStatsBlock
  }
  recentPosts: AdminDashboardRecentPostItem[]
  recentComments: AdminDashboardRecentCommentItem[]
}
