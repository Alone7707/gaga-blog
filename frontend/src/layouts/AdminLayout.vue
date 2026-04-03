<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

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

// 后台导航高亮需要避开 /admin 对所有子路由误判的问题。
function isNavActive(target: string) {
  if (target === '/admin') {
    return route.path === '/admin'
  }

  return route.path === target || route.path.startsWith(`${target}/`)
}
</script>

<template>
  <div class="app-shell bg-[var(--bg-page)] text-[var(--text-2)]">
    <div class="mx-auto flex min-h-screen max-w-[1360px] gap-5 px-4 py-4 lg:px-6">
      <aside class="panel-surface hidden w-[248px] shrink-0 rounded-[28px] p-5 lg:flex lg:flex-col">
        <div class="border-b border-[var(--line-soft)] pb-5">
          <p class="editor-kicker">Admin Console</p>
          <h2 class="mt-4 text-[30px] text-[var(--text-1)] font-semibold leading-tight">
            内容控制台
          </h2>
          <p class="mt-3 text-sm text-[var(--text-3)] leading-7">
            后台本轮只优先解决状态浏览、文章管理与信息分层，不再延续旧版厚重外壳。
          </p>
        </div>

        <nav class="mt-6 flex-1 space-y-2">
          <RouterLink
            v-for="item in adminNavigation"
            :key="item.to"
            :to="item.to"
            class="flex items-center justify-between rounded-[18px] border px-4 py-3 text-sm transition"
            :class="isNavActive(item.to)
              ? 'border-[rgba(76,139,245,0.24)] bg-[#e8f1ff] text-[var(--text-1)] shadow-[var(--shadow-xs)]'
              : 'border-transparent bg-transparent text-[var(--text-3)] hover:border-[var(--line-soft)] hover:bg-[var(--bg-card-soft)] hover:text-[var(--text-1)]'"
          >
            <span>{{ item.label }}</span>
            <span class="text-xs editor-mono text-[var(--text-4)]">/</span>
          </RouterLink>
        </nav>

        <div class="rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4">
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
      </aside>

      <div class="panel-surface flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-[28px] overflow-hidden">
        <header class="border-b border-[var(--line-soft)] bg-[rgba(255,255,255,0.72)] px-5 py-5 md:px-6">
          <div class="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p class="editor-kicker">内容后台 / {{ currentSection }}</p>
              <h1 class="mt-3 text-[28px] text-[var(--text-1)] font-semibold leading-tight md:text-[34px]">
                博客后台管理
              </h1>
              <p class="mt-3 text-sm text-[var(--text-3)] leading-7">
                先判断当前状态，再进入编辑动作。信息和操作分栏，避免界面噪音压过内容本身。
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <RouterLink to="/admin/posts/new" class="ui-btn ui-btn-primary text-sm">
                新建文章
              </RouterLink>
              <RouterLink to="/admin/comments" class="ui-btn ui-btn-secondary text-sm">
                去审评论
              </RouterLink>
              <button type="button" class="ui-btn ui-btn-secondary text-sm" @click="handleLogout">
                退出登录
              </button>
            </div>
          </div>
        </header>

        <main class="flex-1 px-5 py-5 md:px-6 md:py-6">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>
