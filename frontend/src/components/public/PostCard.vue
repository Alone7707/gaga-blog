<script setup lang="ts">
import { RouterLink } from 'vue-router'

import type { PostItem } from '../../types/post'

defineProps<{
  post: PostItem
}>()
</script>

<template>
  <article class="rounded-6 border border-white/10 bg-slate-950/30 p-5">
    <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-300/78">
      <span>{{ post.category }}</span>
      <span class="text-white/20">•</span>
      <span>{{ post.publishedAt }}</span>
      <span class="text-white/20">•</span>
      <span>{{ post.readingTime }}</span>
    </div>

    <h3 class="mt-4 text-xl text-white font-semibold leading-8">
      {{ post.title }}
    </h3>

    <p class="mt-3 text-sm text-slate-300 leading-7">
      {{ post.excerpt }}
    </p>

    <div class="mt-4 flex flex-wrap gap-2">
      <span
        v-for="tag in post.tags"
        :key="tag"
        class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
      >
        # {{ tag }}
      </span>
    </div>

    <RouterLink
      :to="`/posts/${post.slug}`"
      class="mt-5 inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200"
    >
      查看详情
      <span aria-hidden="true">→</span>
    </RouterLink>
  </article>
</template>