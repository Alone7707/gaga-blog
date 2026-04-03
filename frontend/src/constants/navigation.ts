import type { NavigationItem } from '../types/navigation'

// 前台主导航只保留核心入口，避免首轮改版继续扩散页面范围。
export const publicNavigation: NavigationItem[] = [
  { label: '首页', to: '/' },
  { label: '分类', to: '/categories' },
  { label: '标签', to: '/tags' },
  { label: '搜索', to: '/search' },
  { label: '归档', to: '/archives' },
]

// 后台导航聚焦本轮核心页面，其余模块维持可进入但不扩展样式深挖。
export const adminNavigation: NavigationItem[] = [
  { label: '仪表盘', to: '/admin' },
  { label: '文章管理', to: '/admin/posts' },
  { label: '分类管理', to: '/admin/categories' },
  { label: '标签管理', to: '/admin/tags' },
  { label: '评论审核', to: '/admin/comments' },
  { label: '站点设置', to: '/admin/settings' },
]
