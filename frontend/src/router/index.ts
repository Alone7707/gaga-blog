import {
  createRouter as createVueRouter,
  createWebHistory,
  type RouteLocationNormalized,
  type RouteRecordRaw,
} from 'vue-router'

import AdminLayout from '../layouts/AdminLayout.vue'
import PublicLayout from '../layouts/PublicLayout.vue'
import AdminCategoriesPage from '../pages/admin/AdminCategoriesPage.vue'
import AdminCommentsPage from '../pages/admin/AdminCommentsPage.vue'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.vue'
import AdminLoginPage from '../pages/admin/AdminLoginPage.vue'
import AdminPostEditorPage from '../pages/admin/AdminPostEditorPage.vue'
import AdminPostsPage from '../pages/admin/AdminPostsPage.vue'
import AdminSettingsPage from '../pages/admin/AdminSettingsPage.vue'
import AdminTagsPage from '../pages/admin/AdminTagsPage.vue'
import ArchivesPage from '../pages/public/ArchivesPage.vue'
import CategoriesPage from '../pages/public/CategoriesPage.vue'
import CategoryPostsPage from '../pages/public/CategoryPostsPage.vue'
import HomePage from '../pages/public/HomePage.vue'
import PostDetailPage from '../pages/public/PostDetailPage.vue'
import SearchPage from '../pages/public/SearchPage.vue'
import TagPostsPage from '../pages/public/TagPostsPage.vue'
import TagsPage from '../pages/public/TagsPage.vue'
import { useAuthStore } from '../stores/auth'

// 定义应用路由骨架，保持前台公开阅读链路和后台管理链路边界清晰。
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: PublicLayout,
    meta: {
      title: '开源博客',
      layout: 'public',
    },
    children: [
      {
        path: '',
        name: 'home',
        component: HomePage,
        meta: {
          title: '首页',
        },
      },
      {
        path: 'posts/:slug',
        name: 'post-detail',
        component: PostDetailPage,
        meta: {
          title: '文章详情',
        },
      },
      {
        path: 'categories',
        name: 'public-categories',
        component: CategoriesPage,
        meta: {
          title: '分类总览',
        },
      },
      {
        path: 'categories/:slug',
        name: 'public-category-posts',
        component: CategoryPostsPage,
        meta: {
          title: '分类文章',
        },
      },
      {
        path: 'tags',
        name: 'public-tags',
        component: TagsPage,
        meta: {
          title: '标签总览',
        },
      },
      {
        path: 'tags/:slug',
        name: 'public-tag-posts',
        component: TagPostsPage,
        meta: {
          title: '标签文章',
        },
      },
      {
        path: 'search',
        name: 'public-search',
        component: SearchPage,
        meta: {
          title: '公开搜索',
        },
      },
      {
        path: 'archives',
        name: 'public-archives',
        component: ArchivesPage,
        meta: {
          title: '公开归档',
        },
      },
    ],
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: AdminLoginPage,
    meta: {
      title: '后台登录',
      guestOnly: true,
      layout: 'admin-auth',
    },
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: {
      title: '后台管理',
      requiresAuth: true,
      layout: 'admin',
    },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: AdminDashboardPage,
        meta: {
          title: '仪表盘',
          requiresAuth: true,
        },
      },
      {
        path: 'posts',
        name: 'admin-posts',
        component: AdminPostsPage,
        meta: {
          title: '文章管理',
          requiresAuth: true,
        },
      },
      {
        path: 'posts/new',
        name: 'admin-post-create',
        component: AdminPostEditorPage,
        meta: {
          title: '新建文章',
          requiresAuth: true,
        },
      },
      {
        path: 'posts/:id/edit',
        name: 'admin-post-edit',
        component: AdminPostEditorPage,
        meta: {
          title: '编辑文章',
          requiresAuth: true,
        },
      },
      {
        path: 'categories',
        name: 'admin-categories',
        component: AdminCategoriesPage,
        meta: {
          title: '分类管理',
          requiresAuth: true,
        },
      },
      {
        path: 'tags',
        name: 'admin-tags',
        component: AdminTagsPage,
        meta: {
          title: '标签管理',
          requiresAuth: true,
        },
      },
      {
        path: 'comments',
        name: 'admin-comments',
        component: AdminCommentsPage,
        meta: {
          title: '评论审核',
          requiresAuth: true,
        },
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: AdminSettingsPage,
        meta: {
          title: '站点设置',
          requiresAuth: true,
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

// 创建 Vue Router 实例，并统一处理登录守卫与标题更新。
export function createRouter() {
  const router = createVueRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
      return {
        top: 0,
      }
    },
  })

  router.beforeEach(async (to) => {
    const authStore = useAuthStore()

    await authStore.ensureSessionChecked()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return {
        name: 'admin-login',
        query: {
          redirect: to.fullPath,
        },
      }
    }

    if (to.meta.guestOnly && authStore.isAuthenticated) {
      return {
        name: 'admin-dashboard',
      }
    }

    updateDocumentTitle(to)

    return true
  })

  router.afterEach((to) => {
    updateDocumentTitle(to)
  })

  return router
}

// 根据路由元信息更新页面标题，避免页面标题缺失。
function updateDocumentTitle(route: RouteLocationNormalized) {
  const pageTitle = typeof route.meta.title === 'string' ? route.meta.title : '开源博客'
  document.title = `${pageTitle} · 开源博客产品`
}
