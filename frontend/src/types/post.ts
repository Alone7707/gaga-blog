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
