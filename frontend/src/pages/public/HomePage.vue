<script setup lang="ts">
import { RouterLink } from 'vue-router'

import SectionCard from '../../components/common/SectionCard.vue'

// 首页占位数据用于验证前台布局和信息层级是否合理。
const featuredPosts = [
  {
    title: '欢迎来到开源博客产品',
    slug: 'hello-open-blog',
    summary: '这是首页第一篇占位文章，用于承接后续文章列表与详情接口联调。',
    meta: '产品规划 · 5 分钟阅读',
  },
  {
    title: '前端模块拆解如何落到代码结构',
    slug: 'frontend-module-setup',
    summary: '当前版本先把壳层、布局、路由和目录结构建立清楚，确保后续模块能按边界自然扩展。',
    meta: '工程设计 · 7 分钟阅读',
  },
  {
    title: '后台与前台双布局的初始思路',
    slug: 'dual-layout-notes',
    summary: '前台聚焦阅读体验，后台聚焦高频内容操作，两者需要共享基础设施但保持边界清晰。',
    meta: '架构说明 · 4 分钟阅读',
  },
]
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
    <div class="space-y-6">
      <SectionCard title="前台首页" description="这里是博客产品的前台入口，当前先呈现 Hero 区和文章卡片骨架，后续接入真实接口后即可替换占位数据。">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="post in featuredPosts"
            :key="post.slug"
            class="rounded-6 border border-white/10 bg-slate-950/30 p-5 transition hover:border-cyan-300/50 hover:-translate-y-1"
          >
            <p class="text-xs uppercase tracking-[0.22em] text-cyan-300/80">
              {{ post.meta }}
            </p>
            <h3 class="mt-4 text-xl text-white font-semibold leading-8">
              {{ post.title }}
            </h3>
            <p class="mt-3 text-sm text-slate-300 leading-7">
              {{ post.summary }}
            </p>
            <RouterLink :to="`/posts/${post.slug}`" class="mt-6 inline-flex items-center text-sm text-cyan-300 hover:text-cyan-200">
              查看详情 →
            </RouterLink>
          </article>
        </div>
      </SectionCard>
    </div>

    <div class="space-y-6">
      <SectionCard title="当前阶段范围" description="按照文档要求，第一模块只完成项目初始化、布局和路由骨架，不提前侵入真实业务逻辑。">
        <ul class="space-y-3 text-sm text-slate-300 leading-7">
          <li>• 前台布局：Hero、导航、页脚、首页内容区。</li>
          <li>• 路由骨架：首页、文章详情、后台登录、后台仪表盘。</li>
          <li>• 技术底座：Vue Router、Pinia、UnoCSS、目录分层。</li>
        </ul>
      </SectionCard>

      <SectionCard title="后续接入点" description="下一阶段可以直接在现有结构上补首页列表接口、文章详情接口和后台鉴权逻辑。">
        <div class="space-y-3 text-sm text-slate-300 leading-7">
          <p>1. `src/api`：增加文章与登录接口封装。</p>
          <p>2. `src/stores`：补齐文章、站点配置等状态管理。</p>
          <p>3. `src/pages`：逐页替换占位内容为真实联调页面。</p>
        </div>
      </SectionCard>
    </div>
  </div>
</template>
