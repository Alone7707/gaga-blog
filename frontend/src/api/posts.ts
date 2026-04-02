import { request } from './http'
import type {
  AdminPostDetailResponse,
  AdminPostEditorPayload,
  AdminPostListQuery,
  AdminPostListResponse,
  AdminPostSaveResponse,
} from '../types/post'

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

// 新建文章统一走管理员创建接口，字段映射在这里收口。
export function createAdminPost(payload: AdminPostEditorPayload) {
  return request<AdminPostSaveResponse>({
    url: '/api/admin/posts',
    method: 'post',
    data: buildPostPayload(payload),
  })
}

// 编辑文章统一走管理员更新接口，避免页面直接拼接请求结构。
export function updateAdminPost(id: string, payload: AdminPostEditorPayload) {
  return request<AdminPostSaveResponse>({
    url: `/api/admin/posts/${id}`,
    method: 'patch',
    data: buildPostPayload(payload),
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

// 将页面表单值整理为后端 DTO 需要的最小字段，空值统一剔除。
function buildPostPayload(payload: AdminPostEditorPayload) {
  const title = payload.title.trim()
  const slug = payload.slug?.trim()
  const summary = payload.summary?.trim()
  const contentMarkdown = payload.contentMarkdown
  const seoTitle = payload.seoTitle?.trim()
  const seoDescription = payload.seoDescription?.trim()
  const categoryId = payload.categoryId?.trim()
  const tagIds = payload.tagIds?.filter((item) => item.trim()).map((item) => item.trim())

  return {
    title,
    contentMarkdown,
    ...(slug ? { slug } : {}),
    ...(summary ? { summary } : {}),
    ...(payload.contentHtml?.trim() ? { contentHtml: payload.contentHtml.trim() } : {}),
    ...(payload.status ? { status: payload.status } : {}),
    ...(payload.visibility ? { visibility: payload.visibility } : {}),
    ...(seoTitle ? { seoTitle } : {}),
    ...(seoDescription ? { seoDescription } : {}),
    ...(payload.publishedAt ? { publishedAt: payload.publishedAt } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(tagIds?.length ? { tagIds } : {}),
  }
}
