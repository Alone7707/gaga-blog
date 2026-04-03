<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

import ThemeToggle from '../components/common/ThemeToggle.vue'
import { adminNavigation } from '../constants/navigation'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 统一后台退出流程，保留原有认证行为。
async function handleLogout() {
  await authStore.logout()
  await router.replace('/admin/login')
}

// 顶栏根据当前路径显示简要上下文，帮助后台形成清晰工作台感。
const currentSection = computed(() => {
  const matched = [...adminNavigation].reverse().find((item) => isNavActive(item.to))
  return matched?.label ?? '内容后台'
})

// 根据路由生成当前激活页的短标签，用于顶部状态区。
const currentNavMeta = computed(() => {
  const matched = adminNavigation.find((item) => isNavActive(item.to))

  if (!matched) {
    return {
      label: '内容后台',
      hint: '统一处理内容、评论和站点设置',
      tag: '工作台',
    }
  }

  if (matched.to === '/admin/posts') {
    return {
      label: matched.label,
      hint: isPostEditorRoute.value ? '新建与编辑页统一归入文章管理菜单' : '围绕内容列表、筛选和发布动作组织工作流',
      tag: isPostEditorRoute.value ? '编辑中' : '内容流',
    }
  }

  if (matched.to === '/admin/comments') {
    return {
      label: matched.label,
      hint: '待审核列表、详情和回复区并行工作',
      tag: '审核流',
    }
  }

  if (matched.to === '/admin/settings') {
    return {
      label: matched.label,
      hint: '站点基础信息、SEO 与内容策略统一维护',
      tag: '配置流',
    }
  }

  return {
    label: matched.label,
    hint: '后台模块已统一成清爽的工作台骨架',
    tag: '模块页',
  }
})

// 新建与编辑文章页都归属于文章管理，用于菜单激活与顶部文案保持一致。
const isPostEditorRoute = computed(() => {
  return route.path === '/admin/posts/new' || /^\/admin\/posts\/[^/]+\/edit$/.test(route.path)
})

// 提供轻量导航缩写，避免侧边栏纯文字显得过于平。
function getNavAbbr(label: string) {
  return label.slice(0, 2)
}

// 后台导航高亮需要避开 /admin 对所有子路由误判，同时兼容新建页归属到文章管理。
function isNavActive(target: string) {
  if (target === '/admin') {
    return route.path === '/admin'
  }

  if (target === '/admin/posts') {
    return route.path === '/admin/posts'
      || route.path === '/admin/posts/new'
      || route.path.startsWith('/admin/posts/')
  }

  return route.path === target || route.path.startsWith(`${target}/`)
}
</script>

<template>
  <div class="app-shell bg-[var(--bg-page)] text-[var(--text-2)]">
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="panel-surface admin-sidebar-card sticky top-5">
          <div class="admin-brand">
            <span class="admin-brand-badge">Admin Workspace</span>
            <h2 class="mt-4 text-[30px] text-[var(--text-1)] font-semibold leading-tight">
              内容管理后台
            </h2>
            <p class="mt-3 text-sm text-[var(--text-3)] leading-7">
              用更清晰的导航层级和操作分区，承接文章、分类、评论与站点设置的日常维护。
            </p>
          </div>

          <nav class="admin-nav">
            <RouterLink
              v-for="item in adminNavigation"
              :key="item.to"
              :to="item.to"
              class="admin-nav-link"
              :class="isNavActive(item.to) ? 'admin-nav-link-active' : ''"
            >
              <span class="admin-nav-icon">{{ getNavAbbr(item.label) }}</span>
              <span class="admin-nav-text">
                <span class="admin-nav-label">{{ item.label }}</span>
                <span class="admin-nav-hint">
                  {{ item.to === '/admin' ? '总览' : item.to === '/admin/posts' ? '内容' : item.to === '/admin/comments' ? '审核' : '管理' }}
                </span>
              </span>
            </RouterLink>
          </nav>

          <div class="admin-sidebar-info">
            <p class="text-xs uppercase tracking-[0.2em] text-[var(--accent-primary)]">
              当前登录
            </p>
            <p class="mt-3 text-base text-[var(--text-1)] font-semibold">
              {{ authStore.profile?.displayName ?? '站点管理员' }}
            </p>
            <p class="mt-2 text-sm text-[var(--text-3)]">
              {{ authStore.profile?.role ?? 'ADMIN' }}
            </p>
          </div>

          <div class="mt-4 flex justify-end">
            <ThemeToggle />
          </div>

          <div class="admin-sidebar-metrics">
            <div class="admin-sidebar-metric">
              <div>
                <p class="text-xs text-[var(--text-4)]">当前模块</p>
                <p class="mt-1 text-sm font-semibold text-[var(--text-1)]">{{ currentNavMeta.label }}</p>
              </div>
              <span class="ui-badge">{{ currentNavMeta.tag }}</span>
            </div>
            <div class="admin-sidebar-metric">
              <div>
                <p class="text-xs text-[var(--text-4)]">工作方式</p>
                <p class="mt-1 text-sm text-[var(--text-3)]">先看状态，再做操作</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div class="admin-main">
        <header class="panel-surface admin-topbar">
          <div class="admin-topbar-grid">
            <div>
              <div class="admin-breadcrumb">
                <span>后台</span>
                <span>/</span>
                <span>{{ currentSection }}</span>
                <span v-if="isPostEditorRoute">/</span>
                <span v-if="isPostEditorRoute">编辑页</span>
              </div>
              <h1 class="admin-topbar-title mt-4">
                博客后台工作台
              </h1>
              <p class="mt-4 max-w-3xl text-sm text-[var(--text-3)] leading-7">
                {{ currentNavMeta.hint }}
              </p>
              <div class="admin-topbar-meta">
                <span class="ui-badge">{{ currentNavMeta.label }}</span>
                <span class="ui-badge">明暗主题已统一</span>
                <span class="ui-badge">路由归属已统一</span>
              </div>
            </div>

            <div class="admin-stat-grid">
              <div class="admin-top-stat">
                <p class="text-xs text-[var(--text-4)]">快捷动作</p>
                <div class="mt-4 flex flex-wrap gap-2">
                  <RouterLink to="/admin/posts/new" class="ui-btn ui-btn-primary min-h-[36px] px-4 text-xs">
                    新建文章
                  </RouterLink>
                  <RouterLink to="/admin/comments" class="ui-btn ui-btn-secondary min-h-[36px] px-4 text-xs">
                    评论审核
                  </RouterLink>
                </div>
              </div>
              <div class="admin-top-stat">
                <p class="text-xs text-[var(--text-4)]">当前账号</p>
                <p class="admin-top-stat-value text-[22px]">
                  {{ authStore.profile?.displayName ?? '管理员' }}
                </p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <span class="ui-badge">{{ authStore.profile?.role ?? 'ADMIN' }}</span>
                  <button type="button" class="ui-btn ui-btn-secondary min-h-[34px] px-4 text-xs" @click="handleLogout">
                    退出登录
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main class="panel-surface admin-workspace">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>
