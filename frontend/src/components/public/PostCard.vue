<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import type { PostItem } from '../../types/post'

const props = defineProps<{
  post: PostItem
  featured?: boolean
}>()

// 首页和其他列表共用同一套文章卡，但首条可切换为强视觉主推样式。
const isFeatured = computed(() => Boolean(props.featured || props.post.featured))
</script>

<template>
  <article
    class="group overflow-hidden rounded-[24px] border transition duration-200"
    :class="isFeatured
      ? 'border-cyan-300/18 bg-[linear-gradient(135deg,rgba(14,27,42,0.98),rgba(10,20,32,0.94))] shadow-[0_26px_90px_rgba(2,6,23,0.35)]'
      : 'border-white/10 bg-[linear-gradient(180deg,rgba(13,22,35,0.92),rgba(9,16,28,0.88))] hover:border-cyan-300/18 hover:bg-[linear-gradient(180deg,rgba(15,26,40,0.96),rgba(9,16,28,0.94))] hover:-translate-y-[2px]'
    "
  >
    <div class="grid gap-5 p-6" :class="isFeatured ? 'lg:grid-cols-[minmax(0,1.3fr)_280px] lg:items-end' : ''">
      <div>
        <div class="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-cyan-300/78">
          <span>{{ post.category }}</span>
          <span class="text-white/18">•</span>
          <span class="editor-mono">{{ post.publishedAt }}</span>
          <span class="text-white/18">•</span>
          <span>{{ post.readingTime }}</span>
        </div>

        <h3 class="mt-4 text-[22px] text-white font-semibold leading-[1.35] md:text-[28px]" :class="isFeatured ? 'md:text-[34px]' : ''">
          {{ post.title }}
        </h3>

        <p class="mt-4 max-w-3xl text-sm text-slate-300 leading-7 md:text-[15px]">
          {{ post.excerpt }}
        </p>

        <div class="mt-5 flex flex-wrap gap-2">
          <span
            v-for="tag in post.tags"
            :key="tag"
            class="inline-flex items-center rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-slate-300"
          >
            # {{ tag }}
          </span>
        </div>
      </div>

      <div class="flex flex-col justify-between gap-5 rounded-[20px] border border-white/8 bg-black/16 p-5">
        <div>
          <p class="editor-kicker">文章档案</p>
          <p class="mt-3 text-sm text-slate-300 leading-7">
            作者：{{ post.authorName }}
          </p>
          <p class="mt-2 text-sm text-slate-400 leading-7">
            {{ isFeatured ? '作为首页主推内容展示，优先承接首屏阅读动线。' : '适合继续阅读、跳转详情或进入相关主题。' }}
          </p>
        </div>

        <RouterLink
          :to="`/posts/${post.slug}`"
          class="ui-btn ui-btn-ghost w-fit text-sm"
        >
          查看详情
          <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </div>
  </article>
</template>
