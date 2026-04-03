export interface PublicPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PublicAuthor {
  id: string
  displayName: string
}

export interface PublicCategorySummary {
  id: string
  name: string
  slug: string
  description?: string | null
  sortOrder?: number
  postCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface PublicTagSummary {
  id: string
  name: string
  slug: string
  postCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface PublicPostTag {
  id: string
  name: string
  slug: string
}

export interface PublicPostListItem {
  id: string
  title: string
  slug: string
  summary: string | null
  coverImage: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  author: PublicAuthor
  category: PublicCategorySummary | null
  tags: PublicTagSummary[]
}

export interface PublicPostDetail extends PublicPostListItem {
  contentMarkdown: string
  contentHtml: string | null
  seoTitle: string | null
  seoDescription: string | null
}

export interface PublicPostDetailResponse {
  id: string
  title: string
  slug: string
  summary: string | null
  contentMarkdown: string
  contentHtml: string | null
  coverImage: string | null
  seoTitle: string | null
  seoDescription: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  author?: PublicAuthor | null
  category: PublicCategorySummary | null
  tags: PublicPostTag[]
}

export interface PublicPostListResponse {
  list: PublicPostListItem[]
  pagination: PublicPagination
}

export interface PublicCategoryListResponse {
  list: PublicCategorySummary[]
}

export interface PublicTagListResponse {
  list: PublicTagSummary[]
}

export interface PublicCategoryPostsResponse extends PublicPostListResponse {
  category: PublicCategorySummary
}

export interface PublicTagPostsResponse extends PublicPostListResponse {
  tag: PublicTagSummary
}

export interface PublicSearchResponse extends PublicPostListResponse {
  keyword: string
}

export interface PublicArchivePostItem {
  id: string
  title: string
  slug: string
  summary: string | null
  coverImage: string | null
  publishedAt: string
  createdAt: string
  updatedAt: string
  category: PublicCategorySummary | null
  tags: PublicPostTag[]
}

export interface PublicArchiveMonthBucket {
  month: string
  monthLabel: string
  count: number
  posts: PublicArchivePostItem[]
}

export interface PublicArchiveYearBucket {
  year: string
  count: number
  months: PublicArchiveMonthBucket[]
}

export interface PublicArchiveResponse {
  list: PublicArchiveYearBucket[]
  total: number
}

export interface PublicCommentReply {
  id: string
  parentId: string | null
  authorName: string
  authorWebsite?: string | null
  content: string
  createdAt: string
}

export interface PublicCommentItem {
  id: string
  parentId: string | null
  authorName: string
  authorWebsite?: string | null
  content: string
  createdAt: string
  replies: PublicCommentReply[]
}

export interface PublicCommentListResponse {
  list: PublicCommentItem[]
}

export interface PublicCreateCommentPayload {
  authorName: string
  authorEmail?: string
  authorWebsite?: string
  content: string
  parentId?: string
}

export interface PublicCreateCommentResponse {
  id: string
  status: string
  createdAt: string
  postId: string
  parentId: string | null
  authorName: string
  content: string
  reviewMessage: string
}

export interface PublicPostListQuery {
  page?: number
  pageSize?: number
  keyword?: string
}

export interface PublicSearchQuery {
  q: string
  page?: number
  pageSize?: number
}
