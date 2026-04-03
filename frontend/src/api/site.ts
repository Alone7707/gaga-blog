import { request } from './http'
import type {
  PublicSiteOverview,
  PublicSiteSettingsResponse,
  PublicStaticPage,
} from '../types/site'

// 公开站点设置读取统一收口，供前台布局、首页和 about 页面复用。
export function getPublicSiteSettings() {
  return request<PublicSiteSettingsResponse>({
    url: '/api/public/site',
    method: 'get',
  })
}

export function getPublicSiteOverview() {
  return request<{ overview: PublicSiteOverview }>({
    url: '/api/public/site/overview',
    method: 'get',
  }).then((response) => normalizePublicSiteOverview(response.overview))
}

export function getPublicStaticPage(slug: string) {
  return request<{ page: PublicStaticPage }>({
    url: `/api/public/site/pages/${slug}`,
    method: 'get',
  }).then((response) => normalizePublicStaticPage(response.page))
}

function normalizePublicSiteOverview(overview: PublicSiteOverview): PublicSiteOverview {
  return {
    ...overview,
    stats: {
      publishedPostCount: typeof overview?.stats?.publishedPostCount === 'number' ? overview.stats.publishedPostCount : 0,
      approvedCommentCount: typeof overview?.stats?.approvedCommentCount === 'number' ? overview.stats.approvedCommentCount : 0,
    },
    latestPublishedPost: overview?.latestPublishedPost ?? null,
  }
}

function normalizePublicStaticPage(page: PublicStaticPage): PublicStaticPage {
  return {
    ...page,
    title: typeof page?.title === 'string' && page.title.trim() ? page.title : '关于我',
    summary: typeof page?.summary === 'string' ? page.summary : null,
    content: typeof page?.content === 'string' ? page.content : null,
    seoTitle: typeof page?.seoTitle === 'string' && page.seoTitle.trim() ? page.seoTitle : '关于我',
    seoDescription: typeof page?.seoDescription === 'string' ? page.seoDescription : null,
    updatedAt: typeof page?.updatedAt === 'string' ? page.updatedAt : null,
  }
}
