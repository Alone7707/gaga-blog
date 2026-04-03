<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { getPublicCategories, getPublicPosts, getPublicTags } from '../../api/public'
import SectionCard from '../../components/common/SectionCard.vue'
import PostCard from '../../components/public/PostCard.vue'
import type { PublicCategorySummary, PublicTagSummary } from '../../types/public'
import { toPostCardItem } from '../../utils/public-post'

const loading = ref(false)
const errorMessage = ref('')
const visiblePosts = ref<ReturnType<typeof toPostCardItem>[]>([])
const categories = ref<PublicCategorySummary[]>([])
const tags = ref<PublicTagSummary[]>([])

const heroPost = computed(() => visiblePosts.value[0] ?? null)
const latestPosts = computed(() => visiblePosts.value.slice(1, 5))
const highlightedCategories = computed(() => categories.value.slice(0, 4))
const highlightedTags = computed(() => tags.value.slice(0, 12))

// 首页聚合公开文章、分类和标签入口，首轮只服务于首页主叙事与阅读动线。
async function loadHomeData() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [postResponse, categoryResponse, tagResponse] = await Promise.all([
      getPublicPosts({ page: 1, pageSize: 6 }),
      getPublicCategories(),
      getPublicTags(),
    ])

    visiblePosts.value = postResponse.list.map((item) => toPostCardItem(item))
    categories.value = categoryResponse.list.filter((item) => (item.postCount ?? 0) > 0)
    tags.value = tagResponse.list.filter((item) => (item.postCount ?? 0) > 0)
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '首页数据加载失败'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadHomeData()
})
</script>

<template>
  <div class="page-grid">
    <section class="panel-surface overflow-hidden rounded-[28px] p-6 md:p-8">
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_420px] xl:items-stretch">
        <div class="flex flex-col justify-between gap-8">
          <div>
            <p class="editor-kicker">首页 / Technical Editorial Intro</p>
            <h2 class="editor-title mt-4 max-w-4xl text-[38px] leading-[1.08] md:text-[52px]">
              把最新内容、主题入口和站点判断收束在同一个首屏。
            </h2>
            <p class="mt-5 max-w-3xl text-sm text-[var(--text-3)] leading-7 md:text-[16px]">
              首页不是接口列表，而是整站的编辑部封面：先说明内容方向，再推荐值得先读的文章，最后给出分类、标签和搜索入口。
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div class="rounded-[20px] border border-white/8 bg-black/18 p-5">
              <p class="editor-kicker">公开文章</p>
              <p class="mt-4 text-[34px] text-white font-semibold">
                {{ visiblePosts.length }}
              </p>
              <p class="mt-2 text-sm text-slate-400 leading-6">
                首页首屏优先展示可读内容，不做无意义占位。
              </p>
            </div>
            <div class="rounded-[20px] border border-white/8 bg-black/18 p-5">
              <p class="editor-kicker">主题分类</p>
              <p class="mt-4 text-[34px] text-white font-semibold">
                {{ categories.length }}
              </p>
              <p class="mt-2 text-sm text-slate-400 leading-6">
                分类承接归档路径，帮助读者快速进入主题。
              </p>
            </div>
            <div class="rounded-[20px] border border-white/8 bg-black/18 p-5">
              <p class="editor-kicker">标签话题</p>
              <p class="mt-4 text-[34px] text-white font-semibold">
                {{ tags.length }}
              </p>
              <p class="mt-2 text-sm text-slate-400 leading-6">
                标签负责横向串联，提升继续浏览效率。
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
          </div>
        </div>

        <div class="rounded-[24px] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(15,26,40,0.98),rgba(8,16,28,0.95))] p-6">
          <div class="flex items-center justify-between gap-3">
            <p class="editor-kicker">精选主推</p>
            <span class="ui-badge">本周优先阅读</span>
          </div>

          <div v-if="heroPost" class="mt-5 space-y-5">
            <div class="rounded-[20px] border border-white/8 bg-white/4 p-5">
              <p class="text-xs uppercase tracking-[0.22em] text-cyan-300/78">
                {{ heroPost.category }} · {{ heroPost.publishedAt }}
              </p>
              <h3 class="mt-4 text-[28px] text-white font-semibold leading-[1.25]">
                {{ heroPost.title }}
              </h3>
              <p class="mt-4 text-sm text-slate-300 leading-7">
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

          <div v-else class="mt-5 rounded-[20px] border border-dashed border-white/10 bg-black/16 p-5 text-sm text-slate-300 leading-7">
            公开文章加载完成后，这里会展示首页主推内容。
          </div>
        </div>
      </div>
    </section>

    <SectionCard
      title="最新文章"
      description="先给出一篇主推，再让次级文章形成稳定的浏览节奏。"
      variant="hero"
      size="lg"
    >
      <div v-if="loading" class="rounded-[20px] border border-dashed border-white/10 bg-black/16 p-5 text-sm text-slate-300 leading-7">
        正在加载公开文章...
      </div>

      <div v-else-if="errorMessage" class="rounded-[20px] border border-rose-400/25 bg-rose-400/8 p-5 text-sm text-rose-100 leading-7">
        {{ errorMessage }}
      </div>

      <div v-else-if="!visiblePosts.length" class="rounded-[20px] border border-dashed border-white/10 bg-black/16 p-5 text-sm text-slate-300 leading-7">
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
        description="分类负责纵向结构，先展示最有内容密度的几个主题。"
        variant="panel"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <RouterLink
            v-for="category in highlightedCategories"
            :key="category.id"
            :to="`/categories/${category.slug}`"
            class="rounded-[20px] border border-white/8 bg-black/14 p-5 transition hover:border-cyan-300/20 hover:bg-white/4"
          >
            <p class="editor-kicker">分类导航</p>
            <h3 class="mt-4 text-[22px] text-white font-semibold leading-tight">
              {{ category.name }}
            </h3>
            <p class="mt-3 text-sm text-slate-300 leading-7">
              {{ category.description || '点击后查看该主题下的全部公开文章。' }}
            </p>
            <p class="mt-4 text-xs text-slate-400">
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
              ? 'border-cyan-300/28 bg-cyan-300/10 text-cyan-100'
              : 'border-white/10 bg-white/4 text-slate-300 hover:border-cyan-300/18 hover:text-white'"
          >
            # {{ tag.name }}
          </RouterLink>
        </div>
        <div class="mt-6 rounded-[20px] border border-dashed border-white/10 bg-black/16 p-5">
          <p class="text-sm text-slate-300 leading-7">
            当你不确定从哪里开始，搜索页会是更直接的入口；当你已经知道主题，分类与标签会更高效。
          </p>
          <RouterLink to="/search" class="ui-btn ui-btn-ghost mt-5 text-sm">
            进入搜索页
          </RouterLink>
        </div>
      </SectionCard>
    </div>
  </div>
</template>
