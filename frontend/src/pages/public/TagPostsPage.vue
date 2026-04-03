<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { getPublicTagPosts, getPublicTags } from '../../api/public'
import SectionCard from '../../components/common/SectionCard.vue'
import PublicFeedbackState from '../../components/public/PublicFeedbackState.vue'
import PostCard from '../../components/public/PostCard.vue'
import PublicPageHero from '../../components/public/PublicPageHero.vue'
import type { PublicPostListItem, PublicTagSummary } from '../../types/public'
import { toPostCardItem } from '../../utils/public-post'

const route = useRoute()

const loading = ref(false)
const sidebarLoading = ref(false)
const sidebarErrorMessage = ref('')
const errorMessage = ref('')
const posts = ref<PublicPostListItem[]>([])
const tags = ref<PublicTagSummary[]>([])
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
})
const currentTag = ref<PublicTagSummary | null>(null)

const currentSlug = computed(() => String(route.params.slug ?? ''))
const postCards = computed(() => posts.value.map((item) => toPostCardItem(item)))
const siblingTags = computed(() => tags.value.filter((item) => (item.postCount ?? 0) > 0))
const relatedTags = computed(() => siblingTags.value.filter((item) => item.slug !== currentSlug.value).slice(0, 12))

async function loadTags() {
  sidebarLoading.value = true
  sidebarErrorMessage.value = ''

  try {
    const response = await getPublicTags()
    tags.value = response.list
  }
  catch (error) {
    tags.value = []
    sidebarErrorMessage.value = error instanceof Error ? error.message : '标签入口加载失败'
  }
  finally {
    sidebarLoading.value = false
  }
}

async function loadTagPosts(page = 1) {
  if (!currentSlug.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getPublicTagPosts(currentSlug.value, {
      page,
      pageSize: 10,
    })

    currentTag.value = response.tag
    posts.value = response.list
    pagination.value = response.pagination
  }
  catch (error) {
    currentTag.value = null
    posts.value = []
    pagination.value = {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    }
    errorMessage.value = error instanceof Error ? error.message : '标签文章加载失败'
  }
  finally {
    loading.value = false
  }
}

function changePage(nextPage: number) {
  if (nextPage < 1 || nextPage > pagination.value.totalPages || nextPage === pagination.value.page) {
    return
  }

  void loadTagPosts(nextPage)
}

onMounted(() => {
  void loadTags()
  void loadTagPosts()
})

watch(
  () => route.params.slug,
  () => {
    void loadTagPosts(1)
  },
)
</script>

<template>
  <div class="page-grid">
    <PublicPageHero
      :kicker="currentTag ? `Tag / ${currentTag.name}` : 'Tag / Posts'"
      :title="currentTag ? `# ${currentTag.name}` : '标签文章列表'"
      description="标签详情页负责承接同主题文章集合，并让横向内容关系更容易被看见。"
      :meta="[
        `${pagination.total} 篇结果`,
        `${pagination.totalPages || 1} 页内容`,
      ]"
      :actions="[
        { label: '返回标签总览', to: '/tags', variant: 'secondary' },
        { label: '去搜索', to: '/search', variant: 'ghost' },
      ]"
      aside-title="当前标签正在承接横向主题"
      aside-text="左侧保留全部标签入口，右侧继续复用统一文章卡片，保证视觉和阅读逻辑一致。"
      :aside-stats="[
        { label: '当前页码', value: pagination.page },
        { label: '同类入口', value: siblingTags.length },
      ]"
    />

    <div class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div class="space-y-6">
        <SectionCard title="全部标签" description="左侧保留标签入口，支持围绕相同主题快速切换文章集合。" variant="dashed">
          <div v-if="sidebarLoading">
            <PublicFeedbackState state="loading" message="标签入口加载中..." inset />
          </div>

          <div v-else-if="sidebarErrorMessage">
            <PublicFeedbackState state="error" :message="sidebarErrorMessage" inset />
          </div>

          <div v-else class="flex flex-wrap gap-3 lg:flex-col">
            <RouterLink
              v-for="tag in siblingTags"
              :key="tag.id"
              :to="`/tags/${tag.slug}`"
              class="rounded-full border px-4 py-2 text-sm transition"
              :class="tag.slug === currentSlug
                ? 'border-[rgba(76,139,245,0.22)] bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]'
                : 'border-[var(--line-soft)] bg-white text-[var(--text-3)] hover:border-[rgba(76,139,245,0.22)] hover:text-[var(--text-1)]'"
            >
              # {{ tag.name }} · {{ tag.postCount ?? 0 }}
            </RouterLink>
          </div>
        </SectionCard>

        <SectionCard title="推荐切换" description="保留若干相近标签，帮助用户沿主题网络继续浏览。" variant="panel">
          <div class="flex flex-wrap gap-2">
            <RouterLink
              v-for="tag in relatedTags"
              :key="tag.id"
              :to="`/tags/${tag.slug}`"
              class="ui-badge border border-[var(--line-soft)] bg-white text-[var(--text-3)] transition hover:border-[rgba(76,139,245,0.22)] hover:text-[var(--text-1)]"
            >
              # {{ tag.name }}
            </RouterLink>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        :title="currentTag ? `# ${currentTag.name} · 标签文章` : '标签文章列表'"
        description="展示当前标签下所有公开可见文章。"
        variant="hero"
        size="lg"
      >
        <div v-if="loading">
          <PublicFeedbackState state="loading" message="正在加载标签文章..." />
        </div>

        <div v-else-if="errorMessage">
          <PublicFeedbackState state="error" :message="errorMessage" />
        </div>

        <div v-else-if="!postCards.length">
          <PublicFeedbackState state="empty" message="当前标签下还没有公开文章。" />
        </div>

        <div v-else class="space-y-4">
          <PostCard
            v-for="post in postCards"
            :key="post.slug"
            :post="post"
          />
        </div>

        <div v-if="pagination.totalPages > 1" class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line-soft)] pt-5">
          <p class="text-sm text-[var(--text-3)]">
            共 {{ pagination.total }} 篇，当前第 {{ pagination.page }} / {{ pagination.totalPages }} 页
          </p>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="ui-btn ui-btn-secondary text-sm disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="pagination.page <= 1"
              @click="changePage(pagination.page - 1)"
            >
              上一页
            </button>
            <button
              type="button"
              class="ui-btn ui-btn-secondary text-sm disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="pagination.page >= pagination.totalPages"
              @click="changePage(pagination.page + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  </div>
</template>
