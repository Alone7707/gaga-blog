<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { searchPublicPosts } from '../../api/public'
import SectionCard from '../../components/common/SectionCard.vue'
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
      description="搜索入口不再只是一个孤立输入框，而是前台内容发现链路的主入口之一：知道主题时可直达，不知道主题时也能快速试错。"
      :meta="resultKeyword
        ? [`关键词：${resultKeyword}`, `共 ${pagination.total} 条结果`]
        : ['支持标题、摘要、正文、标签检索', '默认每页 10 条结果']"
      :actions="[
        { label: '查看分类', to: '/categories', variant: 'secondary' },
        { label: '查看标签', to: '/tags', variant: 'ghost' },
      ]"
      aside-title="搜索比导航更直接"
      aside-text="当用户不知道该去哪个分类或标签时，搜索页负责成为最快的进入方式。"
      :aside-stats="[
        { label: '当前页码', value: pagination.page },
        { label: '结果总量', value: pagination.total },
      ]"
    />

    <SectionCard title="输入关键词" description="对接公开搜索接口，支持通过标题、摘要、正文和标签进行检索。" variant="panel">
      <form class="flex flex-col gap-4 md:flex-row" @submit.prevent="submitSearch">
        <input
          v-model="keywordInput"
          type="text"
          placeholder="请输入关键词，例如 Vue、NestJS、部署"
          class="h-12 flex-1 rounded-full border border-[var(--line-soft)] bg-white px-5 text-sm text-[var(--text-1)] outline-none transition placeholder:text-[var(--text-4)] focus:border-[rgba(76,139,245,0.28)] focus:shadow-[0_0_0_4px_rgba(76,139,245,0.08)]"
        >
        <button
          type="submit"
          class="ui-btn ui-btn-primary h-12 px-6 text-sm"
        >
          搜索文章
        </button>
      </form>

      <p class="mt-4 text-sm text-[var(--text-3)] leading-7">
        <template v-if="resultKeyword">
          当前关键词：<span class="text-[var(--accent-primary)]">{{ resultKeyword }}</span>
          <span class="ml-2 text-[var(--text-4)]">共 {{ pagination.total }} 条结果</span>
        </template>
        <template v-else>
          输入关键词后可直接检索公开文章。
        </template>
      </p>
    </SectionCard>

    <SectionCard title="搜索结果" description="结果列表与分类/标签文章列表复用同一套文章卡片结构。" variant="hero" size="lg">
      <div v-if="loading" class="rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5 text-sm text-[var(--text-3)] leading-7">
        正在搜索相关文章...
      </div>

      <div v-else-if="errorMessage" class="rounded-[20px] border border-[rgba(240,68,56,0.14)] bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)] leading-7">
        {{ errorMessage }}
      </div>

      <div v-else-if="!resultKeyword" class="rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5 text-sm text-[var(--text-3)] leading-7">
        暂未输入搜索关键词。
      </div>

      <div v-else-if="!postCards.length" class="rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5 text-sm text-[var(--text-3)] leading-7">
        未找到与“{{ resultKeyword }}”相关的公开文章，请尝试更换关键词。
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
</template>
