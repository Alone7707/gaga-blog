<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'

import { publicNavigation } from '../constants/navigation'

const route = useRoute()
</script>

<template>
  <div class="app-shell overflow-hidden bg-[var(--bg-0)] text-[var(--text-2)]">
    <div class="relative mx-auto max-w-[1360px] px-5 pb-10 pt-6 lg:px-8 lg:pt-8">
      <header class="panel-surface mb-8 rounded-[28px] px-6 py-6 md:px-8 md:py-7">
        <div class="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div class="max-w-3xl">
            <p class="editor-kicker">Open Source Blog / Technical Editorial Desk</p>
            <h1 class="editor-title mt-4 text-[36px] leading-[1.08] md:text-[48px] lg:text-[56px]">
              像技术编辑部一样组织内容，像深夜控制台一样保持秩序。
            </h1>
            <p class="mt-5 max-w-2xl text-sm text-[var(--text-3)] leading-7 md:text-[16px]">
              面向开发者的开源博客产品。前台强调长文阅读与主题归档，后台强调内容编排与运营判断，两端共享同一套深色冷静的设计语言。
            </p>
          </div>

          <div class="flex w-full max-w-[420px] flex-col gap-4 xl:items-end">
            <nav class="flex flex-wrap gap-2 xl:justify-end">
              <RouterLink
                v-for="item in publicNavigation"
                :key="item.to"
                :to="item.to"
                class="ui-btn min-h-[38px] px-4 text-sm"
                :class="route.path === item.to ? 'ui-btn-ghost' : 'ui-btn-secondary'"
              >
                {{ item.label }}
              </RouterLink>
            </nav>
            <div class="flex flex-wrap gap-3 xl:justify-end">
              <RouterLink to="/search" class="ui-btn ui-btn-secondary text-sm">
                站内搜索
              </RouterLink>
              <RouterLink to="/admin/login" class="ui-btn ui-btn-primary text-sm">
                进入后台
              </RouterLink>
            </div>
          </div>
        </div>
      </header>

      <main>
        <RouterView />
      </main>

      <footer class="mt-10 flex flex-col gap-3 border-t border-white/8 px-1 pt-6 text-sm text-[var(--text-4)] md:flex-row md:items-center md:justify-between">
        <p>© 2026 开源博客产品 · 技术编辑部风格第一轮界面改版</p>
        <p class="editor-mono">Vue 3 / Vite / UnoCSS / Pinia / Vue Router</p>
      </footer>
    </div>
  </div>
</template>
