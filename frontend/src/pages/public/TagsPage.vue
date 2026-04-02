<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { getPublicTags } from '../../api/public'
import SectionCard from '../../components/common/SectionCard.vue'
import type { PublicTagSummary } from '../../types/public'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const tags = ref<PublicTagSummary[]>([])

// 标签总览页通过查询参数高亮当前选中标签，并提供详情页入口。
const activeSlug = computed(() => String(route.query.slug ?? ''))
const visibleTags = computed(() => tags.value.filter((item) => (item.postCount ?? 0) > 0))
const activeTag = computed(() => visibleTags.value.find((item) => item.slug === activeSlug.value) ?? null)

async function loadTags() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getPublicTags()
    tags.value = response.list

    if (!activeTag.value && visibleTags.value.length && !activeSlug.value) {
      await router.replace({
        name: 'public-tags',
        query: {
          slug: visibleTags.value[0].slug,
        },
      })
    }
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '标签列表加载失败'
  }
  finally {
    loading.value = false
  }
}

function selectTag(slug: string) {
  router.replace({
    name: 'public-tags',
    query: {
      slug,
    },
  })
}

onMounted(() => {
  loadTags()
})

watch(
  () => route.query.slug,
  () => {
    if (!activeSlug.value && visibleTags.value.length) {
      selectTag(visibleTags.value[0].slug)
    }
  },
)
</script>

<template>
  <div class="space-y-6">
    <SectionCard title="公开标签" description="标签页优先突出高频标签，支持快速跳转到标签文章列表。">
      <div v-if="loading" class="rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-300 leading-7">
        正在加载公开标签列表...
      </div>

      <div v-else-if="errorMessage" class="rounded-6 border border-rose-400/25 bg-rose-400/8 p-5 text-sm text-rose-100 leading-7">
        {{ errorMessage }}
      </div>

      <div v-else-if="!visibleTags.length" class="rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-300 leading-7">
        当前还没有可展示的公开标签。
      </div>

      <div v-else class="flex flex-wrap gap-3">
        <button
          v-for="tag in visibleTags"
          :key="tag.id"
          type="button"
          class="rounded-full border px-4 py-2 text-sm transition"
          :class="tag.slug === activeSlug ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-slate-950/30 text-slate-300 hover:border-cyan-300/30'"
          @click="selectTag(tag.slug)"
        >
          # {{ tag.name }} · {{ tag.postCount ?? 0 }}
        </button>
      </div>
    </SectionCard>

    <SectionCard
      v-if="activeTag"
      :title="`# ${activeTag.name} · 文章列表入口`"
      description="标签详情页用于承接同主题文章集合浏览。"
    >
      <div class="flex flex-col gap-4 rounded-6 border border-white/10 bg-slate-950/25 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-sm text-slate-300 leading-7">
            当前标签共关联 {{ activeTag.postCount ?? 0 }} 篇公开文章，点击后进入对应的标签文章页。
          </p>
          <p class="mt-3 text-xs uppercase tracking-[0.2em] text-cyan-300/80">
            slug / {{ activeTag.slug }}
          </p>
        </div>
        <RouterLink
          :to="`/tags/${activeTag.slug}`"
          class="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 px-4 py-2 text-sm text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-300/10"
        >
          查看标签文章
          <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </SectionCard>
  </div>
</template>
