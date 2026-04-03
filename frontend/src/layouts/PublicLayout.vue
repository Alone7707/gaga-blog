<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import { getPublicSiteOverview } from '../api/site'
import { publicNavigation } from '../constants/navigation'
import type { PublicSiteOverview } from '../types/site'

const route = useRoute()
const siteOverview = ref<PublicSiteOverview | null>(null)

function applySiteMeta(overview: PublicSiteOverview | null) {
  const faviconUrl = overview?.site.faviconUrl?.trim()

  if (!faviconUrl) {
    return
  }

  let faviconElement = document.querySelector<HTMLLinkElement>('link[rel="icon"]')

  if (!faviconElement) {
    faviconElement = document.createElement('link')
    faviconElement.rel = 'icon'
    document.head.appendChild(faviconElement)
  }

  faviconElement.href = faviconUrl
}

async function loadSiteOverview() {
  try {
    const response = await getPublicSiteOverview()
    siteOverview.value = response
    applySiteMeta(response)
  }
  catch {
    siteOverview.value = null
  }
}

watch(
  () => route.fullPath,
  () => {
    if (!siteOverview.value) {
      return
    }

    applySiteMeta(siteOverview.value)
  },
)

onMounted(() => {
  void loadSiteOverview()
})
</script>

<template>
  <div class="app-shell overflow-hidden bg-[var(--bg-page)] text-[var(--text-2)]">
    <div class="relative mx-auto max-w-[1360px] px-5 pb-10 pt-6 lg:px-8 lg:pt-8">
      <header class="panel-surface mb-8 rounded-[32px] px-6 py-6 md:px-8 md:py-7">
        <div class="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div class="max-w-3xl">
            <p class="editor-kicker">
              {{ siteOverview?.site.subtitle?.trim() || 'Open Source Blog / Fresh Content Product' }}
            </p>
            <h1 class="editor-title mt-4 text-[36px] leading-[1.08] md:text-[48px] lg:text-[56px]">
              {{ siteOverview?.site.title?.trim() || '更轻的内容首页，更清晰的阅读入口，更克制的视觉层级。' }}
            </h1>
            <p class="mt-5 max-w-2xl text-sm text-[var(--text-3)] leading-7 md:text-[16px]">
              {{ siteOverview?.site.description?.trim() || '前台回到现代内容产品的阅读气质：以文章为中心，以分类与搜索承接流量，不再延续厚重深色、重玻璃、重发光的旧风格。' }}
            </p>
          </div>

          <div class="flex w-full max-w-[460px] flex-col gap-4 xl:items-end">
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

      <footer class="mt-10 flex flex-col gap-3 border-t border-[var(--line-soft)] px-1 pt-6 text-sm text-[var(--text-4)] md:flex-row md:items-center md:justify-between">
        <p>
          {{ siteOverview?.site.footerText?.trim() || '© 2026 开源博客产品 · 清爽版第一轮界面改版' }}
          <span v-if="siteOverview?.site.icp?.trim()"> · {{ siteOverview.site.icp }}</span>
        </p>
        <p class="editor-mono">Vue 3 / Vite / UnoCSS / Pinia / Vue Router</p>
      </footer>
    </div>
  </div>
</template>
