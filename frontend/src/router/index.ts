import {
  createRouter as createVueRouter,
  createWebHistory,
  type RouteLocationNormalized,
  type RouteRecordRaw,
} from 'vue-router'

import AdminLayout from '../layouts/AdminLayout.vue'
import PublicLayout from '../layouts/PublicLayout.vue'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.vue'
import AdminLoginPage from '../pages/admin/AdminLoginPage.vue'
import HomePage from '../pages/public/HomePage.vue'
import PostDetailPage from '../pages/public/PostDetailPage.vue'
import { useAuthStore } from '../stores/auth'

// 定义应用路由骨架，后续模块在此基础上继续扩展。
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
