<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { getAdminPosts } from '../../api/posts'
import SectionCard from '../../components/common/SectionCard.vue'
import type { AdminPostItem, PostStatus } from '../../types/post'

interface StatusOption {
  label: string
  value: '' | PostStatus
}

const statusOptions: StatusOption[] = [
  { label: '全部状态', value: '' },
  { label: '草稿', value: 'DRAFT' },
  { label: '已发布', value: 'PUBLISHED' },
  { label: '已归档', value: 'ARCHIVED' },
]

const queryForm = reactive({
  keyword: '',
  status: '' as '' | PostStatus,
})

const loading = ref(false)
const errorMessage = ref('')
const posts = ref<AdminPostItem[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
})

const totalLabel = computed(() => `共 ${pagination.total} 篇文章`)
const hasData = computed(() => posts.value.length > 0)

onMounted(() => {
  loadPosts()
})

// 拉取后台文章列表，优先走真实接口，失败时直接反馈联调问题。
async function loadPosts(page = pagination.page) {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getAdminPosts({
      page,
      pageSize: pagination.pageSize,
      keyword: queryForm.keyword,
      status: queryForm.status,
    })

    posts.value = response.list
    pagination.page = response.pagination.page
    pagination.pageSize = response.pagination.pageSize
    pagination.total = response.pagination.total
    pagination.totalPages = response.pagination.totalPages
  }
  catch (error) {
    posts.value = []
    pagination.page = 1
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = resolveErrorMessage(error)
  }
  finally {
    loading.value = false
  }
}

// 搜索与状态筛选当前以最小能力提供，后续可以继续补分类筛选与排序。
function handleSearch() {
  void loadPosts(1)
}

function handleReset() {
  queryForm.keyword = ''
  queryForm.status = ''
  void loadPosts(1)
}

function handlePageChange(nextPage: number) {
  if (nextPage < 1 || nextPage > Math.max(pagination.totalPages, 1) || nextPage === pagination.page) {
    return
  }

  void loadPosts(nextPage)
}

function getStatusLabel(status: PostStatus) {
  if (status === 'PUBLISHED') {
    return '已发布'
  }

  if (status === 'ARCHIVED') {
    return '已归档'
  }

  return '草稿'
}

function getStatusClass(status: PostStatus) {
  if (status === 'PUBLISHED') {
    return 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
  }

  if (status === 'ARCHIVED') {
    return 'border-amber-400/25 bg-amber-500/10 text-amber-200'
  }

  return 'border-slate-400/20 bg-slate-500/10 text-slate-200'
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '--'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function resolveErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'message' in error) {
    const message = Reflect.get(error, 'message')

    if (typeof message === 'string' && message) {
      return message
    }
  }

  return '文章列表加载失败，请稍后重试'
}
</script>

<template>
  <div class="space-y-6">
    <SectionCard title="文章管理" description="面向后台高频内容管理场景，当前先交付文章列表、基础筛选和新建/编辑入口。">
      <template #action>
        <RouterLink
          to="/admin/posts/new"
          class="inline-flex items-center rounded-full bg-cyan-400 px-4 py-2 text-sm text-slate-950 font-semibold transition hover:bg-cyan-300"
        >
          新建文章
        </RouterLink>
      </template>

      <div class="flex flex-col gap-4 rounded-6 border border-white/8 bg-slate-950/35 p-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="grid flex-1 gap-4 md:grid-cols-[minmax(0,1.6fr)_220px]">
          <label class="block">
            <span class="mb-2 block text-sm text-slate-300">搜索文章</span>
            <input
              v-model="queryForm.keyword"
              type="text"
              placeholder="输入标题、slug 或摘要关键词"
              class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70"
              @keyup.enter="handleSearch"
            >
          </label>

          <label class="block">
            <span class="mb-2 block text-sm text-slate-300">状态筛选</span>
            <select
              v-model="queryForm.status"
              class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70"
            >
              <option
                v-for="option in statusOptions"
                :key="option.value || 'all'"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-full border border-white/12 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:text-white"
            @click="handleReset"
          >
            重置
          </button>
          <button
            type="button"
            class="rounded-full bg-cyan-400 px-4 py-2 text-sm text-slate-950 font-semibold transition hover:bg-cyan-300"
            @click="handleSearch"
          >
            查询
          </button>
        </div>
      </div>

      <div class="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
        <div class="flex flex-wrap items-center gap-3">
          <span>{{ totalLabel }}</span>
          <span class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
            分类筛选占位：待分类模块接入后补充
          </span>
        </div>
        <p>默认按最近更新时间倒序展示</p>
      </div>

      <div class="mt-5 overflow-hidden rounded-6 border border-white/8 bg-slate-950/30">
        <div v-if="loading" class="px-5 py-14 text-center text-sm text-slate-300">
          正在加载文章列表...
        </div>

        <div v-else-if="errorMessage" class="px-5 py-10">
          <p class="rounded-4 border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {{ errorMessage }}
          </p>
        </div>

        <div v-else-if="!hasData" class="px-5 py-14 text-center text-sm text-slate-300">
          当前暂无符合条件的文章，可以先新建一篇内容。
        </div>

        <table v-else class="min-w-full border-collapse text-sm">
          <thead class="bg-white/5 text-left text-slate-300">
            <tr>
              <th class="px-5 py-4 font-medium">标题</th>
              <th class="px-5 py-4 font-medium">状态</th>
              <th class="px-5 py-4 font-medium">分类</th>
              <th class="px-5 py-4 font-medium">标签数</th>
              <th class="px-5 py-4 font-medium">更新时间</th>
              <th class="px-5 py-4 font-medium">发布时间</th>
              <th class="px-5 py-4 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="post in posts"
              :key="post.id"
              class="border-t border-white/6 transition hover:bg-white/4"
            >
              <td class="px-5 py-4 align-top">
                <div class="space-y-2">
                  <div class="text-sm text-white font-medium leading-6">
                    {{ post.title }}
                  </div>
                  <p class="text-xs text-slate-400">/{{ post.slug }}</p>
                  <p class="line-clamp-2 text-xs text-slate-400 leading-6">
                    {{ post.summary || '暂无摘要，后续可在编辑页补充。' }}
                  </p>
                </div>
              </td>
              <td class="px-5 py-4 align-top">
                <span class="inline-flex rounded-full border px-3 py-1 text-xs" :class="getStatusClass(post.status)">
                  {{ getStatusLabel(post.status) }}
                </span>
              </td>
              <td class="px-5 py-4 align-top text-slate-300">
                {{ post.category?.name || '未分类' }}
              </td>
              <td class="px-5 py-4 align-top text-slate-300">
                {{ post.counts.tags }} 个标签 / {{ post.counts.comments }} 条评论
              </td>
              <td class="px-5 py-4 align-top text-slate-300">
                {{ formatDateTime(post.updatedAt) }}
              </td>
              <td class="px-5 py-4 align-top text-slate-300">
                {{ formatDateTime(post.publishedAt) }}
              </td>
              <td class="px-5 py-4 align-top text-right">
                <div class="inline-flex flex-wrap justify-end gap-2">
                  <RouterLink
                    :to="`/admin/posts/${post.id}/edit`"
                    class="rounded-full border border-white/12 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-300/40 hover:text-white"
                  >
                    编辑
                  </RouterLink>
                  <RouterLink
                    :to="`/posts/${post.slug}`"
                    target="_blank"
                    class="rounded-full border border-white/12 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-300/40 hover:text-white"
                  >
                    预览
                  </RouterLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-5 flex flex-col gap-3 border-t border-white/8 pt-5 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        <p>第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</p>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="rounded-full border border-white/12 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="pagination.page <= 1"
            @click="handlePageChange(pagination.page - 1)"
          >
            上一页
          </button>
          <button
            type="button"
            class="rounded-full border border-white/12 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="pagination.page >= Math.max(pagination.totalPages, 1)"
            @click="handlePageChange(pagination.page + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
