<script setup lang="ts">
import { onMounted, ref } from 'vue'
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

// 首页聚合公开文章、分类和标签入口，保证前台主阅读链路最短可达。
async function loadHomeData() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [postResponse, categoryResponse, tagResponse] = await Promise.all([
      getPublicPosts({
        page: 1,
        pageSize: 6,
      }),
      getPublicCategories(),
      getPublicTags(),
    ])

    visiblePosts.value = postResponse.list.map((item) => toPostCardItem(item))
    categories.value = categoryResponse.list.filter((item) => (item.postCount ?? 0) > 0).slice(0, 6)
    tags.value = tagResponse.list.filter((item) => (item.postCount ?? 0) > 0).slice(0, 12)
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
  <div class="space-y-6">
    <SectionCard title="内容导航" description="首页直接暴露分类、标签与搜索入口，缩短读者进入目标内容的路径。">
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div class="grid gap-4 md:grid-cols-2">
          <RouterLink
            v-for="category in categories"
            :key="category.id"
            :to="`/categories/${category.slug}`"
            class="rounded-6 border border-white/10 bg-slate-950/30 p-5 transition hover:border-cyan-300/30"
          >
            <p class="text-xs uppercase tracking-[0.22em] text-cyan-300/80">
              分类导航
            </p>
            <h3 class="mt-4 text-xl text-white font-semibold leading-8">
              {{ category.name }}
            </h3>
            <p class="mt-3 text-sm text-slate-300 leading-7">
              {{ category.description || '点击后查看该分类下的全部公开文章。' }}
            </p>
            <p class="mt-4 text-xs text-slate-400">
              {{ category.postCount ?? 0 }} 篇公开文章
            </p>
          </RouterLink>
        </div>

        <div class="rounded-6 border border-white/10 bg-slate-950/30 p-5">
          <p class="text-xs uppercase tracking-[0.22em] text-cyan-300/80">
            热门标签
          </p>
          <div class="mt-4 flex flex-wrap gap-2">
            <RouterLink
              v-for="tag in tags"
              :key="tag.id"
              :to="`/tags/${tag.slug}`"
              class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-100"
            >
              # {{ tag.name }}
            </RouterLink>
          </div>
          <RouterLink
            to="/search"
            class="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 px-4 py-2 text-sm text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-300/10"
          >
            进入搜索页
            <span aria-hidden="true">→</span>
          </RouterLink>
        </div>
      </div>
    </SectionCard>

    <SectionCard title="最新文章" description="首页文章列表已对接公开文章接口，作为最小可交付阅读入口。">
      <div v-if="loading" class="rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-300 leading-7">
        正在加载公开文章...
      </div>

      <div v-else-if="errorMessage" class="rounded-6 border border-rose-400/25 bg-rose-400/8 p-5 text-sm text-rose-100 leading-7">
        {{ errorMessage }}
      </div>

      <div v-else-if="!visiblePosts.length" class="rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-300 leading-7">
        当前还没有可展示的公开文章。
      </div>

      <div v-else class="space-y-4">
        <PostCard
          v-for="post in visiblePosts"
          :key="post.slug"
          :post="post"
        />
      </div>
    </SectionCard>
  </div>
</template>
