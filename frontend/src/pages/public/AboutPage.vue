<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { getPublicStaticPage, getPublicSiteOverview } from '../../api/site'
import SectionCard from '../../components/common/SectionCard.vue'
import PublicFeedbackState from '../../components/public/PublicFeedbackState.vue'
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

const siteQuickFacts = computed(() => [
  {
    label: '公开文章',
    value: overview.value?.stats.publishedPostCount ?? 0,
  },
  {
    label: '已审评论',
    value: overview.value?.stats.approvedCommentCount ?? 0,
  },
  {
    label: '最近更新',
    value: page.value?.updatedAt ? formatPublicDate(page.value.updatedAt) : '待补充',
  },
])

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
    document.title = '关于 · 开源博客产品'
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
    <div v-if="loading">
      <PublicFeedbackState state="loading" message="正在加载关于页内容..." />
    </div>

    <div v-else-if="errorMessage" class="page-grid">
      <PublicFeedbackState state="error" title="关于页暂时不可用" :message="errorMessage" />
      <div>
        <RouterLink to="/" class="ui-btn ui-btn-ghost text-sm">
          回到首页
        </RouterLink>
      </div>
    </div>

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
        :aside-stats="siteQuickFacts"
      />

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
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
          <div v-else>
            <PublicFeedbackState state="empty" message="当前后台还没有填写关于页正文内容。可在后台站点设置补充 static.about.content 后，前台这里会自动展示。" />
          </div>
        </SectionCard>

        <SectionCard title="延展入口" description="关于页同时承担品牌说明和站内分流职责。" variant="panel">
          <div class="space-y-4">
            <div class="rounded-[20px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5">
              <p class="editor-kicker">内容说明</p>
              <p class="mt-3 text-sm text-[var(--text-3)] leading-7">
                可在后台持续维护作者介绍、站点目标、合作方式、联系方式等内容，让关于页成为可信入口，而不是空白页。
              </p>
            </div>
            <div class="grid gap-3">
              <RouterLink to="/archives" class="ui-btn ui-btn-secondary justify-start text-sm">
                浏览归档
              </RouterLink>
              <RouterLink to="/categories" class="ui-btn ui-btn-secondary justify-start text-sm">
                浏览分类
              </RouterLink>
              <RouterLink to="/search" class="ui-btn ui-btn-secondary justify-start text-sm">
                站内搜索
              </RouterLink>
            </div>
          </div>
        </SectionCard>
      </div>
    </template>
  </div>
</template>
