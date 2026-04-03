<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { getPublicStaticPage, getPublicSiteOverview } from '../../api/site'
import SectionCard from '../../components/common/SectionCard.vue'
import PublicPageHero from '../../components/public/PublicPageHero.vue'
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
      </RouterLink>
    </section>

    <template v-else>
      <PublicPageHero
        kicker="About / Public Page"
        :title="page?.title || '关于我'"
        :description="pageSummary"
        :meta="[
          '公开静态页',
          page?.updatedAt ? `最近更新：${formatPublicDate(page.updatedAt)}` : '等待内容更新',
          overview?.site?.title ? `站点：${overview.site.title}` : '站点信息待补充',
        ]"
        :actions="[
          { label: '返回首页', to: '/', variant: 'secondary' },
          ...(latestPostLink ? [{ label: '查看最新文章', to: latestPostLink, variant: 'ghost' as const }] : []),
        ]"
        aside-title="站点概览"
        aside-text="关于页已经接入公开静态页和站点概览接口，后台保存后可直接在前台可见。"
        :aside-stats="[
          { label: '公开文章', value: overview?.stats.publishedPostCount ?? 0 },
          { label: '已审评论', value: overview?.stats.approvedCommentCount ?? 0 },
        ]"
      />

      <SectionCard
        title="正文内容"
        description="当前 about 页面直接消费 /api/public/site/pages/about，正文为空时给出明确占位。"
        variant="hero"
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
