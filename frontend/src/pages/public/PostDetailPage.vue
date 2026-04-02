<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { getPublicPostDetail } from '../../api/public'
import type { PublicPostDetailResponse } from '../../types/public'
import { formatPublicDate } from '../../utils/public-post'

const route = useRoute()
const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

const loading = ref(false)
const errorMessage = ref('')
const currentPost = ref<PublicPostDetailResponse | null>(null)

// 详情页统一从路由参数取 slug，后续继续扩展 SEO 或相关文章时可直接复用。
const slug = computed(() => String(route.params.slug ?? ''))

// 优先使用服务端已生成的 HTML；若为空，则回退 Markdown 渲染结果。
const renderedContent = computed(() => {
  if (!currentPost.value) {
    return ''
  }

  if (currentPost.value.contentHtml?.trim()) {
    return currentPost.value.contentHtml
  }

  return markdown.render(currentPost.value.contentMarkdown)
})

async function loadPostDetail() {
  if (!slug.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    currentPost.value = await getPublicPostDetail(slug.value)
  }
  catch (error) {
    currentPost.value = null
    errorMessage.value = error instanceof Error ? error.message : '文章详情加载失败'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPostDetail()
})

watch(
  () => route.params.slug,
  () => {
    loadPostDetail()
  },
)
</script>

<template>
  <div class="space-y-6">
    <section v-if="loading" class="rounded-8 border border-white/10 bg-white/6 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-md">
      <p class="text-sm text-slate-300 leading-7">
        正在加载文章详情...
      </p>
    </section>

    <section v-else-if="errorMessage" class="rounded-8 border border-rose-400/25 bg-rose-400/8 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-md">
      <p class="text-xs uppercase tracking-[0.28em] text-rose-100/80">
        文章不存在
      </p>
      <h2 class="mt-4 text-3xl font-semibold text-white">
        未找到对应文章
      </h2>
      <p class="mt-4 max-w-2xl text-sm leading-7 text-rose-50/90">
        {{ errorMessage }}
      </p>
      <RouterLink
        to="/"
        class="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 px-4 py-2 text-sm text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-300/10"
      >
        回到首页
        <span aria-hidden="true">→</span>
      </RouterLink>
    </section>

    <section
      v-else-if="currentPost"
      class="overflow-hidden rounded-8 border border-white/10 bg-white/6 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-md"
    >
      <div class="border-b border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(15,23,42,0.2))] px-6 py-8 md:px-8 md:py-10">
        <p class="text-xs uppercase tracking-[0.28em] text-cyan-300/80">
          公开文章详情
        </p>
        <h2 class="mt-4 max-w-4xl text-3xl font-semibold leading-tight text-white md:text-4xl">
          {{ currentPost.title }}
        </h2>
        <p class="mt-4 max-w-3xl text-sm leading-7 text-slate-200 md:text-base">
          {{ currentPost.summary || '当前文章暂无摘要。' }}
        </p>

        <div class="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <RouterLink
            v-if="currentPost.category"
            :to="`/categories/${currentPost.category.slug}`"
            class="rounded-full border border-cyan-300/25 bg-cyan-300/8 px-3 py-1 text-cyan-200 transition hover:border-cyan-200"
          >
            {{ currentPost.category.name }}
          </RouterLink>
          <span>{{ formatPublicDate(currentPost.publishedAt ?? currentPost.createdAt) }}</span>
          <span class="text-white/20">•</span>
          <span>作者：{{ currentPost.author.displayName }}</span>
        </div>

        <div class="mt-5 flex flex-wrap gap-2">
          <RouterLink
            v-for="tag in currentPost.tags"
            :key="tag.id"
            :to="`/tags/${tag.slug}`"
            class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-100"
          >
            # {{ tag.name }}
          </RouterLink>
        </div>
      </div>

      <div class="grid gap-6 px-6 py-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <article class="prose prose-invert max-w-none rounded-6 border border-white/8 bg-slate-950/35 p-6">
          <div v-html="renderedContent" />
        </article>

        <aside class="space-y-4">
          <section class="rounded-6 border border-white/8 bg-slate-950/35 p-5">
            <p class="text-xs uppercase tracking-[0.24em] text-cyan-300/80">
              阅读辅助
            </p>
            <h3 class="mt-3 text-lg font-semibold text-white">
              当前文章信息
            </h3>
            <ul class="mt-4 space-y-3 text-sm leading-7 text-slate-300">
              <li>发布时间：{{ formatPublicDate(currentPost.publishedAt ?? currentPost.createdAt) }}</li>
              <li>作者：{{ currentPost.author.displayName }}</li>
              <li>分类：{{ currentPost.category?.name || '未分类' }}</li>
              <li>标签数：{{ currentPost.tags.length }}</li>
            </ul>
          </section>

          <section class="rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5">
            <p class="text-xs uppercase tracking-[0.24em] text-cyan-300/80">
              浏览扩展
            </p>
            <p class="mt-3 text-sm leading-7 text-slate-300">
              当前可继续从分类、标签和搜索页扩展浏览路径，满足公开前台最小阅读闭环。
            </p>
          </section>

          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 px-4 py-2 text-sm text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-300/10"
          >
            返回文章列表
            <span aria-hidden="true">←</span>
          </RouterLink>
        </aside>
      </div>
    </section>
  </div>
</template>
