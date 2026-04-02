<script setup lang="ts">
import { computed, ref } from 'vue'

import SectionCard from '../../components/common/SectionCard.vue'
import PostCard from '../../components/public/PostCard.vue'
import { articleList, featuredPosts } from '../../mock/posts'

// 首页先用本地数据模拟分页容量，后续接接口时直接替换数据源。
const visibleCount = ref(4)

const visiblePosts = computed(() => articleList.slice(0, visibleCount.value))
const hasMorePosts = computed(() => visibleCount.value < articleList.length)

// 当前阶段保留“加载更多”占位交互，避免后续改动布局结构。
function loadMorePosts() {
  visibleCount.value = Math.min(visibleCount.value + 2, articleList.length)
}
</script>

<template>
  <div class="space-y-6">
    <SectionCard title="首页精选" description="使用 mock 数据先完成首页推荐区和文章列表主链路。">
      <div class="grid gap-4 md:grid-cols-2">
        <article
          v-for="post in featuredPosts"
          :key="post.slug"
          class="rounded-6 border border-white/10 bg-slate-950/30 p-5"
        >
          <p class="text-xs uppercase tracking-[0.22em] text-cyan-300/80">
            {{ post.pinnedLabel || '精选内容' }}
          </p>
          <h3 class="mt-4 text-xl text-white font-semibold leading-8">
            {{ post.title }}
          </h3>
          <p class="mt-3 text-sm text-slate-300 leading-7">
            {{ post.summary }}
          </p>
        </article>
      </div>
    </SectionCard>

    <SectionCard title="最新文章" description="文章列表由本地 mock 数据驱动，满足当前模块自测与后续联调准备。">
      <div class="space-y-4">
        <PostCard
          v-for="post in visiblePosts"
          :key="post.slug"
          :post="post"
        />
      </div>

      <div class="mt-6 flex items-center justify-between gap-4 rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-4">
        <p class="text-sm text-slate-300 leading-6">
          当前先保留加载更多占位，后续可替换为真实分页接口。
        </p>
        <button
          type="button"
          class="rounded-full border border-cyan-300/30 px-4 py-2 text-sm text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500"
          :disabled="!hasMorePosts"
          @click="loadMorePosts"
        >
          {{ hasMorePosts ? '加载更多' : '已展示全部' }}
        </button>
      </div>
    </SectionCard>
  </div>
</template>