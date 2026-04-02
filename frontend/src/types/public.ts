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

export interface PublicPostListResponse {
  list: PublicPostListItem[]
  pagination: PublicPagination
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
  author: PublicAuthor
  category: PublicCategorySummary | null
  tags: PublicPostTag[]
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
