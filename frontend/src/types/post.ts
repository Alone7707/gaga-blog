export interface PostSection {
  heading: string
  paragraphs: string[]
}

export interface PostItem {
  id: number
  slug: string
  title: string
  summary: string
  excerpt: string
  category: string
  tags: string[]
  readingTime: string
  publishedAt: string
  featured: boolean
  pinnedLabel?: string
  coverLabel?: string
  authorName: string
  relatedSlugs?: string[]
  contentSections: PostSection[]
}

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type PostVisibility = 'PUBLIC' | 'PRIVATE' | 'PASSWORD_PROTECTED'

export interface PostAuthor {
  id: string
  username: string
  displayName: string
  role: string
  status: string
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PostCategory {
  id: string
  name: string
  slug: string
  description?: string | null
}

export interface PostTag {
  id: string
  name: string
  slug: string
}

export interface AdminPostItem {
  id: string
  title: string
  slug: string
  summary: string | null
  status: PostStatus
  visibility: PostVisibility
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  coverImage: string | null
  author: PostAuthor
  category: PostCategory | null
  counts: {
    comments: number
    tags: number
  }
}

export interface AdminPostDetail {
  id: string
  title: string
  slug: string
  summary: string | null
  contentMarkdown: string
  contentHtml: string | null
  coverImage: string | null
  status: PostStatus
  visibility: PostVisibility
  seoTitle: string | null
  seoDescription: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  author: PostAuthor
  category: PostCategory | null
  tags: PostTag[]
}

export interface AdminPostListPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface AdminPostListResponse {
  list: AdminPostItem[]
  pagination: AdminPostListPagination
}

export interface AdminPostListQuery {
  page?: number
  pageSize?: number
  status?: PostStatus | ''
  keyword?: string
  categoryId?: string
}

export interface AdminPostDetailResponse {
  post: AdminPostDetail
}
