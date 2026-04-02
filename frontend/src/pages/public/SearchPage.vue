<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { searchPublicPosts } from '../../api/public'
import SectionCard from '../../components/common/SectionCard.vue'
import PostCard from '../../components/public/PostCard.vue'
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

  router.replace({
    name: 'public-search',
    query: keyword ? { q: keyword } : {},
  })
}

function changePage(nextPage: number) {
  if (nextPage < 1 || nextPage > pagination.value.totalPages || nextPage === pagination.value.page) {
    return
  }

  executeSearch(nextPage)
}

onMounted(() => {
  keywordInput.value = routeKeyword.value
  executeSearch()
})

watch(
  () => route.query.q,
  () => {
    executeSearch(1)
  },
)
</script>

<template>
  <div class="space-y-6">
    <SectionCard title="公开搜索" description="对接公开搜索接口，支持通过标题、摘要、正文和标签进行检索。">
      <form class="flex flex-col gap-4 md:flex-row" @submit.prevent="submitSearch">
        <input
          v-model="keywordInput"
          type="text"
          placeholder="请输入关键词，例如 Vue、NestJS、部署"
          class="h-12 flex-1 rounded-full border border-white/10 bg-slate-950/30 px-5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
        >
        <button
          type="submit"
          class="h-12 rounded-full bg-cyan-400 px-6 text-sm text-slate-950 font-semibold transition hover:bg-cyan-300"
        >
          搜索文章
        </button>
      </form>

      <p class="mt-4 text-sm text-slate-300 leading-7">
        <template v-if="resultKeyword">
          当前关键词：<span class="text-cyan-200">{{ resultKeyword }}</span>
          <span class="ml-2 text-slate-400">共 {{ pagination.total }} 条结果</span>
        </template>
        <template v-else>
          输入关键词后可直接检索公开文章。
        </template>
      </p>
    </SectionCard>

    <SectionCard title="搜索结果" description="结果列表与分类/标签文章列表复用同一套文章卡片结构。">
      <div v-if="loading" class="rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-300 leading-7">
        正在搜索相关文章...
      </div>

      <div v-else-if="errorMessage" class="rounded-6 border border-rose-400/25 bg-rose-400/8 p-5 text-sm text-rose-100 leading-7">
        {{ errorMessage }}
      </div>

      <div v-else-if="!resultKeyword" class="rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-300 leading-7">
        暂未输入搜索关键词。
      </div>

      <div v-else-if="!postCards.length" class="rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-300 leading-7">
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
          class="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="pagination.page <= 1"
          @click="changePage(pagination.page - 1)"
        >
          上一页
        </button>
        <span class="text-sm text-slate-300">{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <button
          type="button"
          class="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="pagination.page >= pagination.totalPages"
          @click="changePage(pagination.page + 1)"
        >
          下一页
        </button>
      </div>
    </SectionCard>
  </div>
</template>
