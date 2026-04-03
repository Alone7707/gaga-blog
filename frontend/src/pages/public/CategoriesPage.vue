<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { getPublicCategories } from '../../api/public'
import PublicPageHero from '../../components/public/PublicPageHero.vue'
import SectionCard from '../../components/common/SectionCard.vue'
import type { PublicCategorySummary } from '../../types/public'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const categories = ref<PublicCategorySummary[]>([])

const activeSlug = computed(() => String(route.query.slug ?? ''))
const visibleCategories = computed(() => categories.value.filter((item) => (item.postCount ?? 0) > 0))
const normalizedActiveSlug = computed(() => {
  if (!visibleCategories.value.length) {
    return ''
  }

  const matched = visibleCategories.value.find((item) => item.slug === activeSlug.value)
  return matched?.slug ?? visibleCategories.value[0].slug
})

const activeCategory = computed(() => visibleCategories.value.find((item) => item.slug === normalizedActiveSlug.value) ?? null)
const topCategories = computed(() => [...visibleCategories.value].sort((left, right) => (right.postCount ?? 0) - (left.postCount ?? 0)).slice(0, 3))
const totalPosts = computed(() => visibleCategories.value.reduce((sum, item) => sum + (item.postCount ?? 0), 0))

async function loadCategories() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getPublicCategories()
    categories.value = response.list

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
  void router.replace({
    name: 'public-categories',
    query: {
      slug,
    },
  })
}

onMounted(() => {
  void loadCategories()
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
  <div class="page-grid">
    <PublicPageHero
      kicker="Categories / Public Taxonomy"
      title="分类导航"
      description="分类页回到内容产品该有的样子：先让用户判断主题，再决定是否继续深入文章列表，不再用厚重列表堆砌入口。"
      :meta="[
        `${visibleCategories.length} 个公开分类`,
        `${totalPosts} 篇已收录文章`,
      ]"
      :actions="[
        { label: '查看归档', to: '/archives', variant: 'secondary' },
        { label: '去搜索', to: '/search', variant: 'ghost' },
      ]"
      aside-title="分类承担纵向阅读路径"
      aside-text="优先展示真正有内容的分类，并让当前焦点分类始终有明确的下钻入口。"
      :aside-stats="[
        { label: '公开分类', value: visibleCategories.length },
        { label: '聚合文章', value: totalPosts },
      ]"
    />

    <SectionCard title="全部公开分类" description="仅展示已有公开文章的分类，降低空入口噪音。" variant="panel" size="lg">
      <div v-if="loading" class="rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5 text-sm text-[var(--text-3)] leading-7">
        正在加载公开分类列表...
      </div>

      <div v-else-if="errorMessage" class="rounded-[20px] border border-[rgba(240,68,56,0.14)] bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)] leading-7">
        {{ errorMessage }}
      </div>

      <div v-else-if="!visibleCategories.length" class="rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5 text-sm text-[var(--text-3)] leading-7">
        当前还没有可展示的公开分类。
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <button
          v-for="category in visibleCategories"
          :key="category.id"
          type="button"
          class="rounded-[22px] border p-5 text-left transition hover:-translate-y-[2px]"
          :class="category.slug === normalizedActiveSlug
            ? 'border-[rgba(76,139,245,0.22)] bg-[var(--accent-primary-soft)] shadow-[var(--shadow-sm)]'
            : 'border-[var(--line-soft)] bg-white hover:border-[rgba(76,139,245,0.22)] hover:shadow-[var(--shadow-sm)]'"
          @click="selectCategory(category.slug)"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="editor-kicker">分类主题</p>
              <h3 class="mt-4 text-[22px] text-[var(--text-1)] font-semibold leading-tight">
                {{ category.name }}
              </h3>
            </div>
            <span class="ui-badge">{{ category.postCount ?? 0 }} 篇</span>
          </div>
          <p class="mt-4 text-sm text-[var(--text-3)] leading-7">
            {{ category.description || '当前分类暂无补充说明，点击后可直接进入对应文章列表。' }}
          </p>
          <p class="mt-4 text-xs text-[var(--text-4)] editor-mono">
            /{{ category.slug }}
          </p>
        </button>
      </div>
    </SectionCard>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <SectionCard
        v-if="activeCategory"
        :title="`${activeCategory.name} · 当前焦点分类`"
        :description="activeCategory.description || '当前分类已提供独立文章列表页，便于继续深入浏览。'"
        variant="hero"
      >
        <div class="flex flex-col gap-4 rounded-[20px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-sm text-[var(--text-3)] leading-7">
              当前分类共收录 {{ activeCategory.postCount ?? 0 }} 篇公开文章。分类总览负责帮助用户确认主题，详情页负责继续阅读。
            </p>
            <p class="mt-3 text-xs text-[var(--text-4)] editor-mono">
              slug / {{ activeCategory.slug }}
            </p>
          </div>
          <RouterLink
            :to="`/categories/${activeCategory.slug}`"
            class="ui-btn ui-btn-primary text-sm"
          >
            查看分类文章
          </RouterLink>
        </div>
      </SectionCard>

      <SectionCard title="高频分类" description="先把文章密度最高的几个主题推到右侧。" variant="dashed">
        <div class="space-y-3">
          <RouterLink
            v-for="category in topCategories"
            :key="category.id"
            :to="`/categories/${category.slug}`"
            class="block rounded-[18px] border border-[var(--line-soft)] bg-white px-4 py-4 transition hover:border-[rgba(76,139,245,0.22)]"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm font-medium text-[var(--text-1)]">{{ category.name }}</span>
              <span class="text-xs text-[var(--text-4)]">{{ category.postCount ?? 0 }} 篇</span>
            </div>
          </RouterLink>
        </div>
      </SectionCard>
    </div>
  </div>
</template>
