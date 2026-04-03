<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { getPublicCategories } from '../../api/public'
import SectionCard from '../../components/common/SectionCard.vue'
import type { PublicCategorySummary } from '../../types/public'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const categories = ref<PublicCategorySummary[]>([])

// 当前高亮分类由查询参数驱动，便于和分类文章页形成入口联动。
const activeSlug = computed(() => String(route.query.slug ?? ''))

// 仅展示有公开文章的分类，降低空入口干扰。
const visibleCategories = computed(() => categories.value.filter((item) => (item.postCount ?? 0) > 0))

// 非法 slug 统一回退到首个可用分类，避免总览页出现上方列表正常、下方入口缺失的半空态。
const normalizedActiveSlug = computed(() => {
  if (!visibleCategories.value.length) {
    return ''
  }

  const matched = visibleCategories.value.find((item) => item.slug === activeSlug.value)
  return matched?.slug ?? visibleCategories.value[0].slug
})

const activeCategory = computed(() => visibleCategories.value.find((item) => item.slug === normalizedActiveSlug.value) ?? null)

async function loadCategories() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getPublicCategories()
    categories.value = response.list

    // 若查询参数缺失或非法，则统一回退到第一个可用分类。
    if (visibleCategories.value.length && normalizedActiveSlug.value !== activeSlug.value) {
      await router.replace({
        name: 'public-categories',
        query: {
          slug: normalizedActiveSlug.value,
        },
      })
    }
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '分类列表加载失败'
  }
  finally {
    loading.value = false
  }
}

function selectCategory(slug: string) {
  router.replace({
    name: 'public-categories',
    query: {
      slug,
    },
  })
}

onMounted(() => {
  loadCategories()
})

watch(
  () => route.query.slug,
  () => {
    if (visibleCategories.value.length && normalizedActiveSlug.value !== activeSlug.value) {
      selectCategory(normalizedActiveSlug.value)
    }
  },
)
</script>

<template>
  <div class="space-y-6">
    <SectionCard title="公开分类" description="聚合所有对外可见的文章分类，并提供跳转到分类文章列表的入口。">
      <div v-if="loading" class="rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-300 leading-7">
        正在加载公开分类列表...
      </div>

      <div v-else-if="errorMessage" class="rounded-6 border border-rose-400/25 bg-rose-400/8 p-5 text-sm text-rose-100 leading-7">
        {{ errorMessage }}
      </div>

      <div v-else-if="!visibleCategories.length" class="rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-300 leading-7">
        当前还没有可展示的公开分类。
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <button
          v-for="category in visibleCategories"
          :key="category.id"
          type="button"
          class="rounded-6 border p-5 text-left transition"
          :class="category.slug === activeSlug ? 'border-cyan-300/50 bg-cyan-300/10' : 'border-white/10 bg-slate-950/30 hover:border-cyan-300/30'"
          @click="selectCategory(category.slug)"
        >
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-lg text-white font-semibold">
              {{ category.name }}
            </h3>
            <span class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
              {{ category.postCount ?? 0 }} 篇
            </span>
          </div>
          <p class="mt-3 text-sm text-slate-300 leading-7">
            {{ category.description || '当前分类暂无补充说明，点击可查看公开文章列表。' }}
          </p>
          <p class="mt-4 text-xs uppercase tracking-[0.2em] text-cyan-300/80">
            slug / {{ category.slug }}
          </p>
        </button>
      </div>
    </SectionCard>

    <SectionCard
      v-if="activeCategory"
      :title="`${activeCategory.name} · 文章列表入口`"
      description="当前分类已提供独立文章列表页，便于用户继续深入浏览。"
    >
      <div class="flex flex-col gap-4 rounded-6 border border-white/10 bg-slate-950/25 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-sm text-slate-300 leading-7">
            {{ activeCategory.description || '点击下方按钮后，将进入该分类对应的公开文章列表页。' }}
          </p>
          <p class="mt-3 text-xs uppercase tracking-[0.2em] text-cyan-300/80">
            当前收录 {{ activeCategory.postCount ?? 0 }} 篇公开文章
          </p>
        </div>
        <RouterLink
          :to="`/categories/${activeCategory.slug}`"
          class="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 px-4 py-2 text-sm text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-300/10"
        >
          查看分类文章
          <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </SectionCard>
  </div>
</template>
