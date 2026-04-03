<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { searchPublicPosts } from '../../api/public'
import SectionCard from '../../components/common/SectionCard.vue'
import PublicFeedbackState from '../../components/public/PublicFeedbackState.vue'
import PostCard from '../../components/public/PostCard.vue'
import PublicPageHero from '../../components/public/PublicPageHero.vue'
import type { PublicPostListItem } from '../../types/public'
import { toPostCardItem } from '../../utils/public-post'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const keywordInput = ref('')
const resultKeyword = ref('')
const posts = ref<PublicPostListItem[]>([])
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
})

const routeKeyword = computed(() => String(route.query.q ?? '').trim())
const postCards = computed(() => posts.value.map((item) => toPostCardItem(item)))
const hasKeyword = computed(() => Boolean(resultKeyword.value))
const hasResults = computed(() => postCards.value.length > 0)
const resultSummary = computed(() => {
  if (!hasKeyword.value) {
    return '输入关键词后即可检索公开文章。'
  }

  if (!hasResults.value) {
    return `关键词“${resultKeyword.value}”暂未命中公开文章。`
  }

  return `关键词“${resultKeyword.value}”共命中 ${pagination.value.total} 条结果。`
})

const quickSuggestions = ['Vue 3', 'TypeScript', '内容设计', '性能优化', '部署']

async function executeSearch(page = 1) {
  const keyword = routeKeyword.value
  keywordInput.value = keyword

  if (!keyword) {
    resultKeyword.value = ''
    posts.value = []
    pagination.value = {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    }
    errorMessage.value = ''
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await searchPublicPosts({
      q: keyword,
      page,
      pageSize: 10,
    })

    resultKeyword.value = response.keyword
    posts.value = response.list
    pagination.value = response.pagination
  }
  catch (error) {
    resultKeyword.value = keyword
    posts.value = []
    pagination.value = {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    }
    errorMessage.value = error instanceof Error ? error.message : '公开搜索失败'
  }
  finally {
    loading.value = false
  }
}

function submitSearch() {
  const keyword = keywordInput.value.trim()

  void router.replace({
    name: 'public-search',
    query: keyword ? { q: keyword } : {},
  })
}

function applySuggestion(keyword: string) {
  keywordInput.value = keyword
  submitSearch()
}

function clearSearch() {
  keywordInput.value = ''
  void router.replace({
    name: 'public-search',
    query: {},
  })
}

function changePage(nextPage: number) {
  if (nextPage < 1 || nextPage > pagination.value.totalPages || nextPage === pagination.value.page) {
    return
  }

  void executeSearch(nextPage)
}

onMounted(() => {
  keywordInput.value = routeKeyword.value
  void executeSearch()
})

watch(
  () => route.query.q,
  () => {
    void executeSearch(1)
  },
)
</script>

<template>
  <div class="page-grid">
    <PublicPageHero
      kicker="Search / Public Discovery"
      title="站内搜索"
      description="搜索页承担最直接的发现入口：用户知道主题时可立即直达，不知道主题时也能靠推荐词和结果反馈快速试错。"
      :meta="hasKeyword
        ? [`关键词：${resultKeyword}`, `共 ${pagination.total} 条结果`, `当前第 ${pagination.page} 页`]
        : ['支持标题、摘要、正文、标签检索', '默认每页 10 条结果']"
      :actions="[
        { label: '查看分类', to: '/categories', variant: 'secondary' },
        { label: '查看标签', to: '/tags', variant: 'ghost' },
      ]"
      aside-title="搜索比导航更直接"
      aside-text="当用户不知道该去哪个分类或标签时，搜索页负责提供最快的进入方式，并明确反馈命中情况。"
      :aside-stats="[
        { label: '当前页码', value: pagination.page },
        { label: '结果总量', value: pagination.total },
      ]"
    />

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <SectionCard title="搜索操作区" description="统一输入、推荐词和结果摘要，降低试错成本。" variant="panel" size="lg">
        <form class="flex flex-col gap-4" @submit.prevent="submitSearch">
          <div class="flex flex-col gap-4 md:flex-row">
            <input
              v-model="keywordInput"
              type="text"
              placeholder="请输入关键词，例如 Vue、NestJS、部署"
              class="ui-input flex-1 rounded-full px-5"
            >
            <div class="flex gap-3">
              <button type="submit" class="ui-btn ui-btn-primary h-[46px] px-6 text-sm">
                搜索文章
              </button>
              <button type="button" class="ui-btn ui-btn-secondary h-[46px] px-6 text-sm" @click="clearSearch">
                清空
              </button>
            </div>
          </div>

          <div class="rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5">
            <p class="editor-kicker">搜索提示</p>
            <p class="mt-3 text-sm text-[var(--text-3)] leading-7">
              {{ resultSummary }}
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <button
                v-for="item in quickSuggestions"
                :key="item"
                type="button"
                class="ui-badge cursor-pointer bg-white transition hover:border-[rgba(76,139,245,0.22)] hover:text-[var(--text-1)]"
                @click="applySuggestion(item)"
              >
                {{ item }}
              </button>
            </div>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="搜索侧栏" description="给出用途说明与浏览分流。" variant="dashed">
        <div class="space-y-4">
          <div class="rounded-[20px] border border-[var(--line-soft)] bg-white p-4">
            <p class="text-sm text-[var(--text-2)] leading-7">
              搜索适合明确主题词的场景；如果你更想按主题慢慢逛，可以直接走分类、标签或归档。
            </p>
          </div>
          <div class="grid gap-3">
            <RouterLink to="/categories" class="ui-btn ui-btn-secondary justify-start text-sm">
              浏览分类
            </RouterLink>
            <RouterLink to="/tags" class="ui-btn ui-btn-secondary justify-start text-sm">
              浏览标签
            </RouterLink>
            <RouterLink to="/archives" class="ui-btn ui-btn-secondary justify-start text-sm">
              浏览归档
            </RouterLink>
          </div>
        </div>
      </SectionCard>
    </div>

    <SectionCard title="搜索结果" description="结果列表、分页与状态反馈统一收口，和分类/标签详情页保持同一阅读节奏。" variant="hero" size="lg">
      <div v-if="loading">
        <PublicFeedbackState state="loading" message="正在搜索相关文章，请稍候..." />
      </div>

      <div v-else-if="errorMessage">
        <PublicFeedbackState state="error" :message="errorMessage" />
      </div>

      <div v-else-if="!hasKeyword">
        <PublicFeedbackState state="empty" message="暂未输入搜索关键词，可先点击上方推荐词快速体验。" />
      </div>

      <div v-else-if="!hasResults">
        <PublicFeedbackState state="empty" :message="`未找到与“${resultKeyword}”相关的公开文章，请尝试更换关键词。`" />
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
          共 {{ pagination.total }} 条结果，当前第 {{ pagination.page }} / {{ pagination.totalPages }} 页
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
</template>
