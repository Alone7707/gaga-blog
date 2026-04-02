<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

import { publicNavigation } from '../constants/navigation'
</script>

<template>
  <div class="min-h-screen bg-[#07111f] text-slate-100">
    <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_35%),radial-gradient(circle_at_right,_rgba(96,165,250,0.14),_transparent_30%)]" />
    <div class="relative mx-auto max-w-7xl px-6 pb-10 pt-6 lg:px-8">
      <header class="mb-10 flex flex-col gap-6 rounded-8 border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-md md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-sm uppercase tracking-[0.32em] text-cyan-300/80">
            Open Source Blog
          </p>
          <h1 class="mt-3 text-3xl font-semibold tracking-wide text-white md:text-4xl">
            开源博客产品
          </h1>
          <p class="mt-3 max-w-2xl text-sm text-slate-300 leading-7 md:text-base">
            以个人开发者为核心场景的博客系统。当前阶段先落地前台阅读壳层与后台管理骨架，后续逐步接入真实内容与运营能力。
          </p>
        </div>
        <nav class="flex flex-wrap items-center gap-3">
          <RouterLink
            v-for="item in publicNavigation"
            :key="item.to"
            :to="item.to"
            class="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/50 hover:text-white"
          >
            {{ item.label }}
          </RouterLink>
          <RouterLink
            to="/admin/login"
            class="rounded-full bg-cyan-400 px-4 py-2 text-sm text-slate-950 font-semibold transition hover:bg-cyan-300"
          >
            进入后台
          </RouterLink>
        </nav>
      </header>

      <main>
        <RouterView />
      </main>

      <footer class="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        <p>© 2026 开源博客产品 · 前台布局骨架</p>
        <p>技术栈：Vue 3 + Vite + Vue Router + Pinia + UnoCSS</p>
      </footer>
    </div>
  </div>
</template>
