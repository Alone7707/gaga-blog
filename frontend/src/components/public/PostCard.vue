<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import type { PostItem } from '../../types/post'

const props = defineProps<{
  post: PostItem
  featured?: boolean
}>()

// 首页和列表页共用文章卡，首条主推仅放大信息层级，不再堆重面板效果。
const isFeatured = computed(() => Boolean(props.featured || props.post.featured))
</script>

<template>
  <article
    class="group overflow-hidden rounded-[26px] border transition duration-200"
    :class="isFeatured
      ? 'border-[var(--line-accent-soft)] bg-[var(--bg-gradient-card-featured)] shadow-[var(--shadow-sm)]'
      : 'border-[var(--line-soft)] bg-[var(--bg-card)] hover:-translate-y-[2px] hover:border-[var(--line-accent-soft-hover)] hover:shadow-[var(--shadow-sm)]'
    "
  >
    <div class="grid gap-5 p-6" :class="isFeatured ? 'lg:grid-cols-[minmax(0,1.3fr)_280px] lg:items-end' : ''">
      <div>
        <div class="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--accent-primary)]">
          <span>{{ post.category }}</span>
          <span class="text-[var(--text-3)]">•</span>
          <span class="editor-mono text-[var(--text-3)]">{{ post.publishedAt }}</span>
          <span class="text-[var(--text-3)]">•</span>
          <span class="text-[var(--text-3)]">{{ post.readingTime }}</span>
        </div>

        <h3 class="mt-4 text-[22px] text-[var(--text-1)] font-semibold leading-[1.35] tracking-[-0.03em] md:text-[28px]" :class="isFeatured ? 'md:text-[34px]' : ''">
          {{ post.title }}
        </h3>

        <p class="mt-4 max-w-3xl text-sm text-[var(--text-3)] leading-7 md:text-[15px]">
          {{ post.excerpt }}
        </p>

        <div class="mt-5 flex flex-wrap gap-2">
          <span
            v-for="tag in post.tags"
            :key="tag"
            class="inline-flex items-center rounded-full border border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-3 py-1 text-xs text-[var(--text-3)]"
          >
            # {{ tag }}
          </span>
        </div>
      </div>

      <div class="flex flex-col justify-between gap-5 rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-gradient-card-hero)] p-5">
        <div>
          <p class="editor-kicker">文章档案</p>
          <p class="mt-3 text-sm text-[var(--text-2)] leading-7">
            作者：{{ post.authorName }}
          </p>
          <p class="mt-2 text-sm text-[var(--text-3)] leading-7">
            {{ isFeatured ? '首页主推卡强调首屏承接与进入详情。' : '列表卡强调快速识别主题并继续阅读。' }}
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
