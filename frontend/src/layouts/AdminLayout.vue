<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'

import { adminNavigation } from '../constants/navigation'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 退出后台时同步清理服务端 Cookie 与前端缓存，并返回登录页。
async function handleLogout() {
  await authStore.logout()
  await router.replace('/admin/login')
}
</script>

<template>
  <div class="min-h-screen bg-[#020617] text-slate-100">
    <div class="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-4 lg:px-6">
      <aside class="hidden w-70 shrink-0 rounded-8 border border-white/8 bg-white/5 p-5 backdrop-blur-md lg:flex lg:flex-col">
        <div class="border-b border-white/8 pb-5">
          <p class="text-xs uppercase tracking-[0.3em] text-cyan-300/70">
            Admin Console
          </p>
          <h2 class="mt-3 text-2xl font-semibold text-white">
            内容后台
          </h2>
          <p class="mt-3 text-sm text-slate-400 leading-6">
            当前已接入基础登录态。后续业务模块可以直接复用这里的鉴权状态与退出能力。
          </p>
        </div>

        <nav class="mt-5 flex-1 space-y-2">
          <RouterLink
            v-for="item in adminNavigation"
            :key="item.to"
            :to="item.to"
            class="block rounded-4 px-4 py-3 text-sm text-slate-300 transition hover:bg-cyan-400/10 hover:text-white"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="rounded-6 border border-white/8 bg-slate-950/40 p-4 text-sm text-slate-400 leading-6">
          <p class="text-white font-medium">
            当前登录
          </p>
          <p class="mt-2">{{ authStore.profile?.displayName ?? '未登录' }}</p>
          <p>{{ authStore.profile?.role ?? '--' }}</p>
        </div>
      </aside>

      <div class="flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-8 border border-white/8 bg-white/5 backdrop-blur-md">
        <header class="flex flex-col gap-4 border-b border-white/8 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.24em] text-cyan-300/70">
              Dashboard Shell
            </p>
            <h1 class="mt-2 text-2xl font-semibold text-white">
              博客后台管理
            </h1>
          </div>
          <div class="flex items-center gap-3">
            <span class="rounded-full border border-cyan-300/30 px-4 py-2 text-sm text-cyan-200">
              {{ authStore.profile?.displayName ?? '站点管理员' }}
            </span>
            <button
              type="button"
              class="rounded-full bg-white/10 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/16"
              @click="handleLogout"
            >
              退出登录
            </button>
          </div>
        </header>

        <main class="flex-1 px-5 py-5">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>
