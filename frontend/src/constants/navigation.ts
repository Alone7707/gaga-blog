import type { NavigationItem } from '../types/navigation'

// 前台主导航占位，后续可以接站点配置动态扩展。
export const publicNavigation: NavigationItem[] = [
  { label: '首页', to: '/' },
  { label: '分类', to: '/categories' },
  { label: '标签', to: '/tags' },
  { label: '搜索', to: '/search' },
  { label: '归档', to: '/archives' },
  { label: '关于', to: '/about' },
]

// 后台导航占位，后续模块逐步挂载真实页面。
export const adminNavigation: NavigationItem[] = [
  { label: '仪表盘', to: '/admin' },
  { label: '文章管理', to: '/admin/posts' },
  { label: '分类管理', to: '/admin/categories' },
  { label: '标签管理', to: '/admin/tags' },
  { label: '评论审核', to: '/admin/comments' },
  { label: '站点设置', to: '/admin/settings' },
]
