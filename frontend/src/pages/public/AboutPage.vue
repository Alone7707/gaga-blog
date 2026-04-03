<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { getPublicStaticPage, getPublicSiteOverview } from '../../api/site'
import SectionCard from '../../components/common/SectionCard.vue'
import type { PublicSiteOverview, PublicStaticPage } from '../../types/site'
import { formatPublicDate } from '../../utils/public-post'

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

const loading = ref(false)
const errorMessage = ref('')
const page = ref<PublicStaticPage | null>(null)
const overview = ref<PublicSiteOverview | null>(null)

const renderedContent = computed(() => {
  const content = typeof page.value?.content === 'string' ? page.value.content.trim() : ''

  if (!content) {
    return ''
  }

  return markdown.render(content)
})

const pageSummary = computed(() => {
  const summary = typeof page.value?.summary === 'string' ? page.value.summary.trim() : ''
  if (summary) {
    return summary
  }

  const siteDescription = typeof overview.value?.site?.description === 'string'
    ? overview.value.site.description.trim()
    : ''

  return siteDescription || '当前站点还没有补充关于页摘要。'
})

const latestPostLink = computed(() => {
  const latest = overview.value?.latestPublishedPost
  if (!latest?.slug) {
    return ''
  }

  return `/posts/${latest.slug}`
})

async function loadAboutPage() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [pageResponse, overviewResponse] = await Promise.all([
      getPublicStaticPage('about'),
      getPublicSiteOverview(),
    ])

    page.value = pageResponse
    overview.value = overviewResponse
    document.title = `${pageResponse.seoTitle} · ${overviewResponse.site.title || '开源博客产品'}`
  }
  catch (error) {
    page.value = null
    overview.value = null
    errorMessage.value = error instanceof Error ? error.message : '关于页加载失败'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadAboutPage()
})
</script>

<template>
  <div class="page-grid">
    <section v-if="loading" class="panel-surface rounded-[28px] p-8">
      <p class="text-sm text-[var(--text-3)] leading-7">
        正在加载关于页内容...
      </p>
    </section>

    <section v-else-if="errorMessage" class="panel-surface rounded-[28px] border-[rgba(240,68,56,0.14)] bg-[linear-gradient(180deg,#fff7f6,#ffffff)] p-8">
      <p class="editor-kicker text-[var(--danger)]">About / Load Failed</p>
      <h2 class="mt-4 text-[34px] font-semibold text-[var(--text-1)]">
        关于页暂时不可用
      </h2>
      <p class="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-3)]">
        {{ errorMessage }}
      </p>
      <RouterLink to="/" class="ui-btn ui-btn-ghost mt-6 text-sm">
        回到首页
        <span aria-hidden="true">→</span>
      </RouterLink>
    </section>

    <template v-else>
      <section class="panel-surface overflow-hidden rounded-[32px] p-6 md:p-8">
        <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px] xl:items-start">
          <div>
            <p class="editor-kicker">About / Public Page</p>
            <h2 class="editor-title mt-4 text-[36px] leading-[1.08] md:text-[48px] lg:text-[56px]">
              {{ page?.title || '关于我' }}
            </h2>
            <p class="mt-5 max-w-3xl text-sm text-[var(--text-3)] leading-7 md:text-[16px]">
              {{ pageSummary }}
            </p>

            <div class="mt-6 flex flex-wrap gap-3 text-sm text-[var(--text-3)]">
              <span class="ui-badge">公开静态页</span>
              <span v-if="page?.updatedAt" class="editor-mono">最近更新：{{ formatPublicDate(page.updatedAt) }}</span>
              <span v-if="overview?.site?.title">站点：{{ overview.site.title }}</span>
            </div>
          </div>

          <div class="rounded-[24px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5">
            <p class="editor-kicker">站点概览</p>
            <h3 class="mt-3 text-[20px] text-[var(--text-1)] font-semibold">
              最小联调闭环已接通
            </h3>
            <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div class="rounded-[18px] border border-[var(--line-soft)] bg-white p-4">
                <p class="text-xs text-[var(--text-4)]">公开文章</p>
                <p class="mt-2 text-[28px] font-semibold text-[var(--text-1)]">{{ overview?.stats.publishedPostCount ?? 0 }}</p>
              </div>
              <div class="rounded-[18px] border border-[var(--line-soft)] bg-white p-4">
                <p class="text-xs text-[var(--text-4)]">已审评论</p>
                <p class="mt-2 text-[28px] font-semibold text-[var(--text-1)]">{{ overview?.stats.approvedCommentCount ?? 0 }}</p>
              </div>
            </div>
            <div class="mt-5 flex flex-wrap gap-3">
              <RouterLink to="/" class="ui-btn ui-btn-secondary text-sm">返回首页</RouterLink>
              <RouterLink v-if="latestPostLink" :to="latestPostLink" class="ui-btn ui-btn-ghost text-sm">查看最新文章</RouterLink>
            </div>
          </div>
        </div>
      </section>

      <SectionCard
        title="正文内容"
        description="当前 about 页面直接消费 /api/public/site/pages/about，正文为空时给出明确占位。"
        variant="panel"
        size="lg"
      >
        <article
          v-if="renderedContent"
          class="article-prose rounded-[24px] border border-[var(--line-soft)] bg-white p-6 md:p-8"
          v-html="renderedContent"
        />
        <div
          v-else
          class="rounded-[24px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-6 text-sm text-[var(--text-3)] leading-7"
        >
          当前后台还没有填写关于页正文内容。可在后台站点设置补充 static.about.content 后，前台这里会自动展示。
        </div>
      </SectionCard>
    </template>
  </div>
</template>
