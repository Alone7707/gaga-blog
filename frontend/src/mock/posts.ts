import type { PostItem } from '../types/post'

// 首页模块使用本地 mock 数据，后续接后端接口时只替换数据来源。
export const mockPosts: PostItem[] = [
  {
    id: 1,
    slug: 'build-open-blog-with-vue3',
    title: '用 Vue 3 搭一个真正可扩展的开源博客前台',
    summary: '从布局壳层、模块边界到内容区组织方式，先把阅读路径做顺，再谈功能堆叠。',
    excerpt: '首页不是把文章堆上去就结束，而是要先把核心内容有层次地展示出来。当前版本先用 mock 数据跑通首页模块。',
    category: '前端工程',
    tags: ['Vue 3', '博客系统', '模块设计'],
    readingTime: '6 分钟阅读',
    publishedAt: '2026-04-02',
    featured: true,
    pinnedLabel: '置顶精选',
  },
  {
    id: 2,
    slug: 'content-first-home-layout',
    title: '内容优先的首页应该怎么摆：推荐区、列表区与节奏控制',
    summary: '站点简介负责立住调性，推荐区负责拉高点击意愿，文章流负责承接持续阅读。',
    excerpt: '推荐区不需要复杂，但必须把最值得看的内容提前抬出来，再通过列表承接持续阅读。',
    category: '体验设计',
    tags: ['信息架构', '首页设计', '推荐区'],
    readingTime: '5 分钟阅读',
    publishedAt: '2026-03-29',
    featured: true,
    pinnedLabel: '推荐阅读',
  },
  {
    id: 3,
    slug: 'mock-driven-module-dev',
    title: '先用 mock 数据推进模块开发，能省掉哪些无效等待',
    summary: '接口未就绪时，前端也可以先把状态、交互和结构走通。',
    excerpt: 'mock 数据不是临时凑合，而是前端模块化开发的缓冲层。',
    category: '工程协作',
    tags: ['Mock', '并行开发'],
    readingTime: '4 分钟阅读',
    publishedAt: '2026-03-27',
    featured: false,
  },
  {
    id: 4,
    slug: 'public-admin-layout-boundary',
    title: '前台与后台共仓开发时，怎样保证布局边界不互相污染',
    summary: '公共能力共享，视觉与交互职责分离，后续扩展才不会互相牵连。',
    excerpt: '共仓不是共锅，布局和业务内容区必须明确分层。',
    category: '架构设计',
    tags: ['Layout', 'Router'],
    readingTime: '7 分钟阅读',
    publishedAt: '2026-03-24',
    featured: false,
  },
  {
    id: 5,
    slug: 'post-card-design-system',
    title: '文章卡片不是列表重复件，而是首页阅读效率的核心组件',
    summary: '标题、摘要、分类和动作入口的层级，决定用户是否继续点击。',
    excerpt: '卡片信息不需要过多，重点是让用户快速判断值不值得看。',
    category: '组件设计',
    tags: ['PostCard', '组件'],
    readingTime: '5 分钟阅读',
    publishedAt: '2026-03-22',
    featured: false,
  },
  {
    id: 6,
    slug: 'load-more-placeholder-plan',
    title: '分页还是加载更多：MVP 阶段先把占位方案想清楚',
    summary: '真实接口未接入前，可以先把交互位置和反馈方式定下来。',
    excerpt: '先保留加载更多入口，后续接真实分页时就不用返工页面布局。',
    category: '交互策略',
    tags: ['分页', '加载更多'],
    readingTime: '3 分钟阅读',
    publishedAt: '2026-03-19',
    featured: false,
  },
]

// 首页顶部推荐区优先展示标记为精选的文章。
export const featuredPosts = mockPosts.filter(post => post.featured)

// 首页文章流展示完整列表，页面内自行控制展示数量。
export const articleList = mockPosts