export interface PublicSiteValues {
  site: {
    title?: string
    subtitle?: string
    description?: string
    baseUrl?: string
    logoUrl?: string
    faviconUrl?: string
    icp?: string
    footerText?: string
  }
  seo: {
    defaultTitle?: string
    defaultDescription?: string
    defaultOgImage?: string
    enableSitemap?: boolean
    enableRobots?: boolean
    enableRss?: boolean
  }
  comment: {
    enabled?: boolean
    requireModeration?: boolean
    allowGuestComment?: boolean
  }
  content: {
    defaultAuthorName?: string
    relatedPostsLimit?: number
  }
  static: {
    'about.title'?: string
    'about.summary'?: string
    'about.content'?: string
    'about.seoTitle'?: string
    'about.seoDescription'?: string
  }
}

export interface PublicSiteGroupItem {
  key: string
  group: string
  description: string
  isPublic: boolean
  value: unknown
  updatedById: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface PublicSiteGroup {
  group: string
  items: PublicSiteGroupItem[]
}

export interface PublicSiteSettingsResponse {
  groups: PublicSiteGroup[]
  values: PublicSiteValues
}

export interface PublicSiteOverviewStats {
  publishedPostCount: number
  approvedCommentCount: number
}

export interface PublicLatestPublishedPost {
  id: string
  title: string
  slug: string
  publishedAt: string | null
}

export interface PublicSiteOverview {
  site: PublicSiteValues['site']
  seo: PublicSiteValues['seo']
  comment: PublicSiteValues['comment']
  content: PublicSiteValues['content']
  static: PublicSiteValues['static']
  stats: PublicSiteOverviewStats
  latestPublishedPost: PublicLatestPublishedPost | null
}

export interface PublicStaticPage {
  slug: string
  title: string
  summary: string | null
  content: string | null
  seoTitle: string
  seoDescription: string | null
  updatedAt: string | null
}
