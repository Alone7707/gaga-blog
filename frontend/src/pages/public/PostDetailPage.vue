<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import PostCard from '../../components/public/PostCard.vue'
import { getPostBySlug, getRelatedPosts } from '../../mock/posts'

const route = useRoute()

// 详情页统一从路由参数取 slug，后续接接口时可直接复用这个入口。
const slug = computed(() => String(route.params.slug ?? ''))

// 当前文章详情数据，未来可替换为接口返回的标准结构。
const currentPost = computed(() => getPostBySlug(slug.value))

// 相关文章区域先基于 mock 数据联动，后续可替换为独立推荐接口。
const relatedPosts = computed(() => {
  if (!currentPost.value) {
    return []
  }

  return getRelatedPosts(currentPost.value)
})
</script>

<template>
  <div class="space-y-6">
    <section
      v-if="currentPost"
      class="overflow-hidden rounded-8 border border-white/10 bg-white/6 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-md"
    >
      <div class="border-b border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(15,23,42,0.2))] px-6 py-8 md:px-8 md:py-10">
        <p class="text-xs uppercase tracking-[0.28em] text-cyan-300/80">
          {{ currentPost.coverLabel || '文章详情' }}
        </p>
        <h2 class="mt-4 max-w-4xl text-3xl font-semibold leading-tight text-white md:text-4xl">
          {{ currentPost.title }}
        </h2>
        <p class="mt-4 max-w-3xl text-sm leading-7 text-slate-200 md:text-base">
          {{ currentPost.summary }}
        </p>

        <div class="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span class="rounded-full border border-cyan-300/25 bg-cyan-300/8 px-3 py-1 text-cyan-200">
            {{ currentPost.category }}
          </span>
          <span>{{ currentPost.publishedAt }}</span>
          <span class="text-white/20">•</span>
          <span>{{ currentPost.readingTime }}</span>
          <span class="text-white/20">•</span>
          <span>作者：{{ currentPost.authorName }}</span>
        </div>

        <div class="mt-5 flex flex-wrap gap-2">
          <span
            v-for="tag in currentPost.tags"
            :key="tag"
            class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200"
          >
            # {{ tag }}
          </span>
        </div>
      </div>

      <div class="grid gap-6 px-6 py-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <article class="rounded-6 border border-white/8 bg-slate-950/35 p-6">
          <div class="space-y-8">
            <section
              v-for="section in currentPost.contentSections"
              :key="section.heading"
              class="space-y-4"
            >
              <h3 class="text-2xl font-semibold text-white">
                {{ section.heading }}
              </h3>
              <p
                v-for="paragraph in section.paragraphs"
                :key="paragraph"
                class="text-sm leading-8 text-slate-300 md:text-base"
              >
                {{ paragraph }}
              </p>
            </section>
          </div>
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
              <li>分类：{{ currentPost.category }}</li>
              <li>发布时间：{{ currentPost.publishedAt }}</li>
              <li>阅读时长：{{ currentPost.readingTime }}</li>
              <li>内容段落：{{ currentPost.contentSections.length }} 个区块</li>
            </ul>
          </section>

          <section class="rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5">
            <p class="text-xs uppercase tracking-[0.24em] text-cyan-300/80">
              后续预留
            </p>
            <p class="mt-3 text-sm leading-7 text-slate-300">
              这里后续可继续挂载 Markdown 渲染、目录导航、评论区或上一篇/下一篇模块，当前版本先保证详情页主阅读链路可用。
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

    <section
      v-else
      class="rounded-8 border border-white/10 bg-white/6 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-md"
    >
      <p class="text-xs uppercase tracking-[0.28em] text-cyan-300/80">
        文章不存在
      </p>
      <h2 class="mt-4 text-3xl font-semibold text-white">
        未找到对应文章
      </h2>
      <p class="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
        当前 slug 为 {{ slug }}，本地 mock 数据中没有匹配文章。后续接真实接口后，这里可以替换为标准化的 404 或异常态处理。
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
      v-if="currentPost && relatedPosts.length"
      class="rounded-8 border border-white/10 bg-white/6 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-md"
    >
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.28em] text-cyan-300/80">
            Related Posts
          </p>
          <h2 class="mt-3 text-2xl font-semibold text-white">
            相关文章
          </h2>
          <p class="mt-2 text-sm leading-6 text-slate-300">
            当前先基于本地 mock 数据推荐，后续可切换为 /api/public/posts/:slug/related。
          </p>
        </div>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-200"
        >
          查看全部文章
          <span aria-hidden="true">→</span>
        </RouterLink>
      </div>

      <div class="mt-6 grid gap-4 xl:grid-cols-3">
        <PostCard
          v-for="post in relatedPosts"
          :key="post.slug"
          :post="post"
        />
      </div>
    </section>
  </div>
</template>
