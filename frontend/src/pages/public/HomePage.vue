<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { getPublicCategories, getPublicPosts, getPublicTags } from '../../api/public'
import { getPublicSiteOverview } from '../../api/site'
import SectionCard from '../../components/common/SectionCard.vue'
import PostCard from '../../components/public/PostCard.vue'
import type { PublicCategorySummary, PublicTagSummary } from '../../types/public'
import type { PublicSiteOverview } from '../../types/site'
import { toPostCardItem } from '../../utils/public-post'

const loading = ref(false)
const errorMessage = ref('')
const visiblePosts = ref<ReturnType<typeof toPostCardItem>[]>([])
const categories = ref<PublicCategorySummary[]>([])
const tags = ref<PublicTagSummary[]>([])
const siteOverview = ref<PublicSiteOverview | null>(null)

const heroPost = computed(() => visiblePosts.value[0] ?? null)
const latestPosts = computed(() => visiblePosts.value.slice(1, 5))
const highlightedCategories = computed(() => categories.value.slice(0, 4))
const highlightedTags = computed(() => tags.value.slice(0, 12))
const siteTitle = computed(() => siteOverview.value?.site.title?.trim() || '开源博客')
const siteSubtitle = computed(() => siteOverview.value?.site.subtitle?.trim() || 'Fresh Editorial Cover')
const siteDescription = computed(() => siteOverview.value?.site.description?.trim() || '首页回归年轻、简约、清爽的内容产品感：不靠厚重面板压气氛，而是靠信息结构、留白和阅读节奏把内容自然托起来。')
const aboutSummary = computed(() => siteOverview.value?.static['about.summary']?.trim() || '关于页已接入公开站点设置，可直接承接品牌介绍、作者介绍与站点说明。')

// 首页聚合公开文章、分类、标签与站点概览，优先打通站点设置消费闭环。
async function loadHomeData() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [postResponse, categoryResponse, tagResponse, overviewResponse] = await Promise.all([
      getPublicPosts({ page: 1, pageSize: 6 }),
      getPublicCategories(),
      getPublicTags(),
      getPublicSiteOverview(),
    ])

    visiblePosts.value = postResponse.list.map((item) => toPostCardItem(item))
    categories.value = categoryResponse.list.filter((item) => (item.postCount ?? 0) > 0)
    tags.value = tagResponse.list.filter((item) => (item.postCount ?? 0) > 0)
    siteOverview.value = overviewResponse

    const siteTitle = overviewResponse.site.title?.trim() || '开源博客'
    document.title = `${siteTitle} · 首页`
  }
  catch (error) {
    visiblePosts.value = []
    categories.value = []
    tags.value = []
    siteOverview.value = null
    errorMessage.value = error instanceof Error ? error.message : '首页数据加载失败'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadHomeData()
})
</script>

<template>
  <div class="page-grid">
    <section class="panel-surface overflow-hidden rounded-[32px] p-6 md:p-8">
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_400px] xl:items-stretch">
        <div class="flex flex-col justify-between gap-8">
          <div>
            <p class="editor-kicker">首页 / {{ siteSubtitle }}</p>
            <h2 class="editor-title mt-4 max-w-4xl text-[38px] leading-[1.08] md:text-[52px]">
              {{ siteTitle }}
            </h2>
            <p class="mt-5 max-w-3xl text-sm text-[var(--text-3)] leading-7 md:text-[16px]">
              {{ siteDescription }}
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div class="rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5">
              <p class="editor-kicker">公开文章</p>
              <p class="mt-4 text-[34px] text-[var(--text-1)] font-semibold">
                {{ siteOverview?.stats.publishedPostCount ?? visiblePosts.length }}
              </p>
              <p class="mt-2 text-sm text-[var(--text-3)] leading-6">
                首屏只放真实内容，不再堆无效装饰块。
              </p>
            </div>
            <div class="rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5">
              <p class="editor-kicker">主题分类</p>
              <p class="mt-4 text-[34px] text-[var(--text-1)] font-semibold">
                {{ categories.length }}
              </p>
              <p class="mt-2 text-sm text-[var(--text-3)] leading-6">
                分类承接纵向阅读路径和主题归档。
              </p>
            </div>
            <div class="rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5">
              <p class="editor-kicker">已审评论</p>
              <p class="mt-4 text-[34px] text-[var(--text-1)] font-semibold">
                {{ siteOverview?.stats.approvedCommentCount ?? 0 }}
              </p>
              <p class="mt-2 text-sm text-[var(--text-3)] leading-6">
                评论数据已纳入公开站点概览接口。
              </p>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <RouterLink to="/search" class="ui-btn ui-btn-primary text-sm">
              立即搜索内容
            </RouterLink>
            <RouterLink to="/archives" class="ui-btn ui-btn-secondary text-sm">
              进入归档
            </RouterLink>
            <RouterLink to="/about" class="ui-btn ui-btn-secondary text-sm">
              查看关于页
            </RouterLink>
          </div>
        </div>

        <div class="rounded-[28px] border border-[var(--line-soft)] bg-[linear-gradient(180deg,#ffffff,#f7fbff)] p-6">
          <div class="flex items-center justify-between gap-3">
            <p class="editor-kicker">精选主推</p>
            <span class="ui-badge">本周优先阅读</span>
          </div>

          <div v-if="heroPost" class="mt-5 space-y-5">
            <div class="rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card)] p-5">
              <p class="text-xs uppercase tracking-[0.18em] text-[var(--accent-primary)]">
                {{ heroPost.category }} · {{ heroPost.publishedAt }}
              </p>
              <h3 class="mt-4 text-[28px] text-[var(--text-1)] font-semibold leading-[1.25]">
                {{ heroPost.title }}
              </h3>
              <p class="mt-4 text-sm text-[var(--text-3)] leading-7">
                {{ heroPost.excerpt }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in heroPost.tags" :key="tag" class="ui-badge">
                # {{ tag }}
              </span>
            </div>
            <RouterLink :to="`/posts/${heroPost.slug}`" class="ui-btn ui-btn-ghost text-sm">
              打开主推文章
              <span aria-hidden="true">→</span>
            </RouterLink>
          </div>

          <div v-else class="mt-5 rounded-[22px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5 text-sm text-[var(--text-3)] leading-7">
            公开文章加载完成后，这里会展示首页主推内容。
          </div>
        </div>
      </div>
    </section>

    <SectionCard
      title="最新文章"
      description="先给出一篇主推，再让次级文章形成稳定浏览节奏。"
      variant="hero"
      size="lg"
    >
      <div v-if="loading" class="rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5 text-sm text-[var(--text-3)] leading-7">
        正在加载公开文章...
      </div>

      <div v-else-if="errorMessage" class="rounded-[20px] border border-[rgba(240,68,56,0.14)] bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)] leading-7">
        {{ errorMessage }}
      </div>

      <div v-else-if="!visiblePosts.length" class="rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5 text-sm text-[var(--text-3)] leading-7">
        当前还没有可展示的公开文章，请先发布内容。
      </div>

      <div v-else class="space-y-5">
        <PostCard v-if="heroPost" :post="heroPost" featured />
        <div v-if="latestPosts.length" class="grid gap-4 xl:grid-cols-2">
          <PostCard v-for="post in latestPosts" :key="post.slug" :post="post" />
        </div>
      </div>
    </SectionCard>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <SectionCard
        title="主题归档"
        description="分类负责纵向结构，优先展示最有内容密度的几个主题。"
        variant="panel"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <RouterLink
            v-for="category in highlightedCategories"
            :key="category.id"
            :to="`/categories/${category.slug}`"
            class="rounded-[20px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5 transition hover:border-[rgba(76,139,245,0.22)] hover:bg-white"
          >
            <p class="editor-kicker">分类导航</p>
            <h3 class="mt-4 text-[22px] text-[var(--text-1)] font-semibold leading-tight">
              {{ category.name }}
            </h3>
            <p class="mt-3 text-sm text-[var(--text-3)] leading-7">
              {{ category.description || '点击后查看该主题下的全部公开文章。' }}
            </p>
            <p class="mt-4 text-xs text-[var(--text-4)]">
              {{ category.postCount ?? 0 }} 篇公开文章
            </p>
          </RouterLink>
        </div>
      </SectionCard>

      <SectionCard
        title="热门标签与检索入口"
        description="标签不再只是平铺按钮，而是站内主题网络的快捷入口。"
        variant="panel"
      >
        <div class="flex flex-wrap gap-2">
          <RouterLink
            v-for="tag in highlightedTags"
            :key="tag.id"
            :to="`/tags/${tag.slug}`"
            class="inline-flex items-center rounded-full border px-3 py-2 text-xs transition"
            :class="(tag.postCount ?? 0) >= 5
              ? 'border-[rgba(76,139,245,0.18)] bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]'
              : 'border-[var(--line-soft)] bg-white text-[var(--text-3)] hover:border-[rgba(76,139,245,0.18)] hover:text-[var(--text-1)]'"
          >
            # {{ tag.name }}
          </RouterLink>
        </div>
        <div class="mt-6 rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5">
          <p class="text-sm text-[var(--text-3)] leading-7">
            当你不确定从哪里开始，搜索页会更直接；当你已经知道主题，分类与标签会更高效。
          </p>
          <RouterLink to="/search" class="ui-btn ui-btn-ghost mt-5 text-sm">
            进入搜索页
          </RouterLink>
        </div>
      </SectionCard>
    </div>

    <SectionCard
      title="关于页入口"
      description="前台 about 已接入公开站点设置与静态页接口，先完成设置保存到前台可见的最小闭环。"
      variant="dashed"
    >
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-center">
        <div>
          <p class="text-sm text-[var(--text-3)] leading-7">
            {{ aboutSummary }}
          </p>
          <p class="mt-3 text-xs text-[var(--text-4)]">
            支持后台维护：static.about.title / summary / content / seoTitle / seoDescription
          </p>
        </div>
        <div class="flex flex-wrap gap-3 xl:justify-end">
          <RouterLink to="/about" class="ui-btn ui-btn-primary text-sm">
            打开关于页
          </RouterLink>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
