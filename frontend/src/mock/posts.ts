import type { PostItem } from '../types/post'

// 首页和详情页都复用本地 mock 数据，后续接后端时只替换数据获取层。
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
    coverLabel: '文章详情模块 / 第三个前端模块',
    authorName: '产可精',
    relatedSlugs: ['mock-driven-module-dev', 'post-card-design-system', 'content-first-home-layout'],
    contentSections: [
      {
        heading: '先把详情页当成内容消费主场',
        paragraphs: [
          '首页负责分发，详情页负责完成阅读。用户点进来以后，最关心的是这篇内容值不值得继续看，所以标题、摘要、发布时间、分类、标签这些元信息必须在第一屏交代清楚。',
          '如果详情页一开始就只有一个大标题，剩下内容全部混在一起，用户会很难建立阅读预期。MVP 阶段不需要把评论、目录、推荐区都做满，但主结构必须先立住。',
        ],
      },
      {
        heading: '字段边界现在就要为真实接口预留',
        paragraphs: [
          '哪怕当前还在使用 mock 数据，也应该先把 authorName、contentSections、relatedSlugs 这类字段拆出来。这样后面接 /api/public/posts/:slug 时，只需要替换数据源，不需要重写页面结构。',
          '详情页的组件职责也要尽量单一：头部负责信息聚合，正文区负责内容渲染，辅助区负责返回列表与相关文章。这样后续无论接 Markdown、目录导航还是评论模块，改动范围都可控。',
        ],
      },
      {
        heading: 'MVP 阶段先解决可读性，再扩展互动能力',
        paragraphs: [
          '当前版本可以先采用分段文本的 mock 结构，把正文可读性、间距、层级、辅助区块做完整。等后端提供 Markdown 内容后，再补 MarkdownRenderer、TocNav 和评论组件，不会影响现有布局。',
          '换句话说，这一阶段不是把功能做满，而是把阅读路径做顺，把接口边界做清，把后续扩展成本压低。',
        ],
      },
    ],
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
    coverLabel: '首页信息组织 / 推荐区节奏',
    authorName: '产可精',
    relatedSlugs: ['build-open-blog-with-vue3', 'post-card-design-system', 'load-more-placeholder-plan'],
    contentSections: [
      {
        heading: '首页的价值不是堆内容，而是做选择',
        paragraphs: [
          '推荐区的本质是替用户先做一次筛选，把值得点击的内容提前暴露出来。这样首页不会变成单纯的信息堆叠，而是会形成明确的阅读动线。',
          '当推荐区和列表区都在同一页面时，信息层级一定要有明显差异，否则用户看不出哪里是重点。',
        ],
      },
      {
        heading: '节奏控制决定首页会不会显得乱',
        paragraphs: [
          '推荐区负责制造兴趣，文章列表负责承接深读，分页或加载更多负责控制信息密度。三者之间要有明确的留白和层次。',
          '如果所有内容都同权展示，页面就很容易变平，用户浏览效率也会下降。',
        ],
      },
    ],
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
    coverLabel: 'Mock 数据 / 前后端并行',
    authorName: '产可精',
    relatedSlugs: ['build-open-blog-with-vue3', 'public-admin-layout-boundary'],
    contentSections: [
      {
        heading: 'mock 的意义是把等待变成前置推进',
        paragraphs: [
          '接口没有好之前，前端最容易陷入“先等等”的状态。但页面结构、字段边界、空态和错误态，其实完全可以先跑通。',
          '只要 mock 数据结构设计得足够贴近真实接口，后续联调就只是替换入口，不是推倒重来。',
        ],
      },
      {
        heading: '真正要避免的是假数据和真实模型脱节',
        paragraphs: [
          '如果 mock 只是随手拼几个字段，后面接接口时就会发现页面大量返工。正确做法是从一开始就按未来接口思路组织数据。',
        ],
      },
    ],
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
    coverLabel: '布局边界 / 路由分层',
    authorName: '产可精',
    relatedSlugs: ['build-open-blog-with-vue3', 'mock-driven-module-dev'],
    contentSections: [
      {
        heading: '布局边界先划清，后续开发才不会互相拖累',
        paragraphs: [
          '前台关注内容消费，后台关注高频操作，两者的视觉密度、交互节奏和组件职责都不同。共仓开发不代表共用一套页面壳子。',
          '把 layout、router、page 边界先定清，后面新增模块时会轻很多。',
        ],
      },
    ],
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
    coverLabel: '卡片组件 / 阅读效率',
    authorName: '产可精',
    relatedSlugs: ['content-first-home-layout', 'build-open-blog-with-vue3'],
    contentSections: [
      {
        heading: '卡片承担的是阅读筛选，不是内容复述',
        paragraphs: [
          '用户在列表页不会逐字看完每一张卡片，真正有用的是建立预期：这篇文章讲什么、值不值得点、打开以后会看到什么。',
          '所以信息密度应该克制，但层级一定要准确。',
        ],
      },
    ],
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
    coverLabel: '分页策略 / 交互占位',
    authorName: '产可精',
    relatedSlugs: ['content-first-home-layout'],
    contentSections: [
      {
        heading: '占位不是敷衍，而是给接口落地留位置',
        paragraphs: [
          '在 MVP 阶段，交互路径先成立比完全真实更重要。加载更多按钮、分页容器、空态反馈这些位置先定下来，后面替换实现成本才低。',
        ],
      },
    ],
  },
]

// 首页顶部推荐区优先展示标记为精选的文章。
export const featuredPosts = mockPosts.filter(post => post.featured)

// 首页文章流展示完整列表，页面内自行控制展示数量。
export const articleList = mockPosts

// 详情页按 slug 查找文章，未来可直接替换为接口请求。
export function getPostBySlug(slug: string) {
  return mockPosts.find(post => post.slug === slug)
}

// 详情页相关文章先复用本地数据，后续可切换为独立推荐接口。
export function getRelatedPosts(post: PostItem, limit = 3) {
  const relatedPool = post.relatedSlugs?.length
    ? post.relatedSlugs
        .map(slug => getPostBySlug(slug))
        .filter((item): item is PostItem => Boolean(item))
    : mockPosts.filter(item => item.slug !== post.slug && item.category === post.category)

  return relatedPool.filter(item => item.slug !== post.slug).slice(0, limit)
}
