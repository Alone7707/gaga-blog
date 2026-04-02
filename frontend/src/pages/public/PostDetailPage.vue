<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import SectionCard from '../../components/common/SectionCard.vue'

const route = useRoute()

// 详情页根据路由参数展示占位内容，为后续真实接口联调保留入口。
const slug = computed(() => String(route.params.slug ?? 'unknown-post'))
</script>

<template>
  <div class="space-y-6">
    <SectionCard title="文章详情占位" description="当前页面用于验证动态路由、前台详情布局和页面信息层次。后续会接入 Markdown 渲染与评论区。">
      <div class="rounded-6 border border-white/10 bg-slate-950/40 p-6">
        <p class="text-xs uppercase tracking-[0.22em] text-cyan-300/75">
          Post Detail Placeholder
        </p>
        <h2 class="mt-4 text-3xl font-semibold text-white">
          {{ slug }}
        </h2>
        <p class="mt-4 max-w-3xl text-sm text-slate-300 leading-7">
          当前为文章详情占位正文。后续这里将承接文章标题、发布时间、分类标签、Markdown 正文、目录导航、评论模块等核心阅读内容。
        </p>
      </div>
    </SectionCard>
  </div>
</template>
