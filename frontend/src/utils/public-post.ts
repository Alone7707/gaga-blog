import type { PostItem } from '../types/post'
import type { PublicPostListItem } from '../types/public'

// 将公开接口返回的文章结构映射为现有卡片组件可消费的最小结构。
export function toPostCardItem(post: PublicPostListItem): PostItem {
  return {
    id: Number(post.id) || 0,
    slug: post.slug,
    title: post.title,
    summary: post.summary ?? '当前文章暂无摘要。',
    excerpt: post.summary ?? '当前文章暂无摘要。',
    category: post.category?.name ?? '未分类',
    tags: post.tags.map((item) => item.name),
    readingTime: '公开阅读',
    publishedAt: formatPublicDate(post.publishedAt ?? post.createdAt),
    featured: false,
    authorName: post.author.displayName,
    contentSections: [],
  }
}

// 统一格式化公开接口时间，避免页面里反复处理日期字符串。
export function formatPublicDate(value: string | null | undefined) {
  if (!value) {
    return '待发布'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
