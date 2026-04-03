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

// 顶栏根据当前路径显示简要上下文，帮助后台形成工作台感。
const currentSection = computed(() => {
  const matched = [...adminNavigation].reverse().find((item) => route.path === item.to || route.path.startsWith(`${item.to}/`))
  return matched?.label ?? '内容后台'
})
</script>

<template>
  <div class="app-shell bg-[var(--bg-0)] text-[var(--text-2)]">
    <div class="mx-auto flex min-h-screen max-w-[1360px] gap-5 px-4 py-4 lg:px-6">
      <aside class="panel-surface hidden w-[258px] shrink-0 rounded-[28px] p-5 lg:flex lg:flex-col">
        <div class="border-b border-white/8 pb-5">
          <p class="editor-kicker">Admin Console</p>
          <h2 class="mt-4 text-[30px] text-white font-semibold leading-tight">
            内容控制台
          </h2>
          <p class="mt-3 text-sm text-[var(--text-3)] leading-7">
            统一管理文章、评论与站点配置。本轮优先强化仪表盘与文章管理的可读性和操作聚焦。
          </p>
        </div>

        <nav class="mt-6 flex-1 space-y-2">
          <RouterLink
            v-for="item in adminNavigation"
            :key="item.to"
            :to="item.to"
            class="flex items-center justify-between rounded-[18px] border px-4 py-3 text-sm transition"
            :class="route.path === item.to || route.path.startsWith(`${item.to}/`)
              ? 'border-cyan-300/20 bg-cyan-300/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
              : 'border-transparent bg-transparent text-slate-300 hover:border-white/8 hover:bg-white/4 hover:text-white'"
          >
            <span>{{ item.label }}</span>
            <span class="text-xs editor-mono text-slate-500">/</span>
          </RouterLink>
        </nav>

        <div class="rounded-[22px] border border-white/8 bg-black/16 p-4">
          <p class="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
            当前登录
          </p>
          <p class="mt-3 text-base text-white font-semibold">
            {{ authStore.profile?.displayName ?? '站点管理员' }}
          </p>
          <p class="mt-2 text-sm text-slate-400">
            {{ authStore.profile?.role ?? 'ADMIN' }}
          </p>
        </div>
      </aside>

      <div class="panel-surface flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-[28px] overflow-hidden">
        <header class="border-b border-white/8 px-5 py-5 md:px-6">
          <div class="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p class="editor-kicker">深夜控制台 / {{ currentSection }}</p>
              <h1 class="mt-3 text-[28px] text-white font-semibold leading-tight md:text-[34px]">
                博客后台管理
              </h1>
              <p class="mt-3 text-sm text-[var(--text-3)] leading-7">
                先读状态，再做动作。重要操作集中在顶部，正文区域专注当前任务。
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
