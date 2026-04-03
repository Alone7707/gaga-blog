<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { getPublicCategories, getPublicCategoryPosts } from '../../api/public'
import SectionCard from '../../components/common/SectionCard.vue'
import PostCard from '../../components/public/PostCard.vue'
import PublicPageHero from '../../components/public/PublicPageHero.vue'
import type { PublicCategorySummary, PublicPostListItem } from '../../types/public'
import { toPostCardItem } from '../../utils/public-post'

const route = useRoute()

const loading = ref(false)
const sidebarLoading = ref(false)
const sidebarErrorMessage = ref('')
const errorMessage = ref('')
const posts = ref<PublicPostListItem[]>([])
const categories = ref<PublicCategorySummary[]>([])
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
})
const currentCategory = ref<PublicCategorySummary | null>(null)

const currentSlug = computed(() => String(route.params.slug ?? ''))
const postCards = computed(() => posts.value.map((item) => toPostCardItem(item)))
const siblingCategories = computed(() => categories.value.filter((item) => (item.postCount ?? 0) > 0))

async function loadCategories() {
  sidebarLoading.value = true
  sidebarErrorMessage.value = ''

  try {
    const response = await getPublicCategories()
    categories.value = response.list
  }
  catch (error) {
    categories.value = []
    sidebarErrorMessage.value = error instanceof Error ? error.message : '分类入口加载失败'
  }
  finally {
    sidebarLoading.value = false
  }
}

async function loadCategoryPosts(page = 1) {
  if (!currentSlug.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getPublicCategoryPosts(currentSlug.value, {
      page,
      pageSize: 10,
    })

    currentCategory.value = response.category
    posts.value = response.list
    pagination.value = response.pagination
  }
  catch (error) {
    currentCategory.value = null
    posts.value = []
    pagination.value = {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    }
    errorMessage.value = error instanceof Error ? error.message : '分类文章加载失败'
  }
  finally {
    loading.value = false
  }
}

function changePage(nextPage: number) {
  if (nextPage < 1 || nextPage > pagination.value.totalPages || nextPage === pagination.value.page) {
    return
  }

  void loadCategoryPosts(nextPage)
}

onMounted(() => {
  void loadCategories()
  void loadCategoryPosts()
})

watch(
  () => route.params.slug,
  () => {
    void loadCategoryPosts(1)
  },
)
</script>

<template>
  <div class="page-grid">
    <PublicPageHero
      :kicker="currentCategory ? `Category / ${currentCategory.name}` : 'Category / Posts'"
      :title="currentCategory ? currentCategory.name : '分类文章列表'"
      :description="currentCategory?.description || '展示当前分类下所有公开可见文章。'"
      :meta="[
        `${pagination.total} 篇结果`,
        `${pagination.totalPages || 1} 页内容`,
      ]"
      :actions="[
        { label: '返回分类总览', to: '/categories', variant: 'secondary' },
        { label: '去搜索', to: '/search', variant: 'ghost' },
      ]"
      aside-title="当前分类正在承接纵向阅读"
      aside-text="左侧保留全部分类入口，右侧用统一文章卡片继续阅读，结构更清楚。"
      :aside-stats="[
        { label: '当前页码', value: pagination.page },
        { label: '同类入口', value: siblingCategories.length },
      ]"
    />

    <div class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <SectionCard title="全部分类" description="左侧保留公开分类入口，便于用户快速切换浏览范围。" variant="dashed">
        <div v-if="sidebarLoading" class="text-sm text-[var(--text-3)] leading-7">
          分类入口加载中...
        </div>

        <div v-else-if="sidebarErrorMessage" class="rounded-[18px] border border-[rgba(240,68,56,0.14)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)] leading-7">
          {{ sidebarErrorMessage }}
        </div>

        <div v-else class="space-y-3">
          <RouterLink
            v-for="category in siblingCategories"
            :key="category.id"
            :to="`/categories/${category.slug}`"
            class="block rounded-[18px] border px-4 py-3 text-sm transition"
            :class="category.slug === currentSlug
              ? 'border-[rgba(76,139,245,0.22)] bg-[var(--accent-primary-soft)] text-[var(--text-1)]'
              : 'border-[var(--line-soft)] bg-white text-[var(--text-3)] hover:border-[rgba(76,139,245,0.22)]'"
          >
            <div class="flex items-center justify-between gap-3">
              <span>{{ category.name }}</span>
              <span class="text-xs text-[var(--text-4)]">{{ category.postCount ?? 0 }}</span>
            </div>
          </RouterLink>
        </div>
      </SectionCard>

      <SectionCard
        :title="currentCategory ? `${currentCategory.name} · 分类文章` : '分类文章列表'"
        :description="currentCategory?.description || '展示当前分类下所有公开可见文章。'"
        variant="hero"
        size="lg"
      >
        <div v-if="loading" class="rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5 text-sm text-[var(--text-3)] leading-7">
          正在加载分类文章...
        </div>

        <div v-else-if="errorMessage" class="rounded-[20px] border border-[rgba(240,68,56,0.14)] bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)] leading-7">
          {{ errorMessage }}
        </div>

        <div v-else-if="!postCards.length" class="rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5 text-sm text-[var(--text-3)] leading-7">
          当前分类下还没有公开文章。
        </div>

        <div v-else class="space-y-4">
          <PostCard
            v-for="post in postCards"
            :key="post.slug"
            :post="post"
          />
        </div>

        <div v-if="pagination.totalPages > 1" class="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            class="ui-btn ui-btn-secondary text-sm disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="pagination.page <= 1"
            @click="changePage(pagination.page - 1)"
          >
            上一页
          </button>
          <span class="text-sm text-[var(--text-3)]">{{ pagination.page }} / {{ pagination.totalPages }}</span>
          <button
            type="button"
            class="ui-btn ui-btn-secondary text-sm disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="pagination.page >= pagination.totalPages"
            @click="changePage(pagination.page + 1)"
          >
            下一页
          </button>
        </div>
      </SectionCard>
    </div>
  </div>
</template>
