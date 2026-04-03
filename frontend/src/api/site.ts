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
  }).then((response) => response.overview)
}

export function getPublicStaticPage(slug: string) {
  return request<{ page: PublicStaticPage }>({
    url: `/api/public/site/pages/${slug}`,
    method: 'get',
  }).then((response) => response.page)
}
