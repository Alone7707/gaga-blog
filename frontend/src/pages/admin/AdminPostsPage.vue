<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { archiveAdminPost, getAdminPosts, publishAdminPost, unpublishAdminPost } from '../../api/posts'
import SectionCard from '../../components/common/SectionCard.vue'
import type { AdminPostItem, PostStatus } from '../../types/post'

interface StatusOption {
  label: string
  value: '' | PostStatus
}

type PostActionType = 'publish' | 'unpublish' | 'archive'

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
const actionLoadingId = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const posts = ref<AdminPostItem[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
})

const totalLabel = computed(() => `共 ${pagination.total} 篇文章`)
const hasData = computed(() => posts.value.length > 0)
const publishedCount = computed(() => posts.value.filter((post) => post.status === 'PUBLISHED').length)
const draftCount = computed(() => posts.value.filter((post) => post.status === 'DRAFT').length)
const archivedCount = computed(() => posts.value.filter((post) => post.status === 'ARCHIVED').length)
const latestUpdatedAt = computed(() => posts.value[0]?.updatedAt ?? null)

onMounted(() => {
  void loadPosts()
})

// 文章管理页优先保证真实列表、筛选与分页可用，再重组为更像工作台的界面。
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

    posts.value = Array.isArray(response.list) ? response.list : []
    pagination.page = response.pagination?.page ?? page
    pagination.pageSize = response.pagination?.pageSize ?? pagination.pageSize
    pagination.total = response.pagination?.total ?? 0
    pagination.totalPages = response.pagination?.totalPages ?? 0
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

async function handlePostAction(post: AdminPostItem, action: PostActionType) {
  if (actionLoadingId.value) {
    return
  }

  actionLoadingId.value = post.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await (action === 'publish'
      ? publishAdminPost(post.id)
      : action === 'unpublish'
        ? unpublishAdminPost(post.id)
        : archiveAdminPost(post.id))

    successMessage.value = getActionSuccessMessage(action)
    await loadPosts(pagination.page)
  }
  catch (error) {
    errorMessage.value = resolveErrorMessage(error, getActionFallbackMessage(action))
  }
  finally {
    actionLoadingId.value = ''
  }
}

function isActionPending(postId: string) {
  return actionLoadingId.value === postId
}

function canPublish(post: AdminPostItem) {
  return post.status !== 'PUBLISHED'
}

function canUnpublish(post: AdminPostItem) {
  return post.status === 'PUBLISHED'
}

function canArchive(post: AdminPostItem) {
  return post.status !== 'ARCHIVED'
}

function getActionSuccessMessage(action: PostActionType) {
  if (action === 'publish') {
    return '文章已发布'
  }

  if (action === 'unpublish') {
    return '文章已下线为草稿'
  }

  return '文章已归档'
}

function getActionFallbackMessage(action: PostActionType) {
  if (action === 'publish') {
    return '文章发布失败，请稍后重试'
  }

  if (action === 'unpublish') {
    return '文章下线失败，请稍后重试'
  }

  return '文章归档失败，请稍后重试'
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
    return 'ui-badge ui-badge-status-published'
  }

  if (status === 'ARCHIVED') {
    return 'ui-badge ui-badge-status-archived'
  }

  return 'ui-badge ui-badge-status-draft'
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

function resolveErrorMessage(error: unknown, fallback = '文章列表加载失败，请稍后重试') {
  if (typeof error === 'object' && error && 'message' in error) {
    const message = Reflect.get(error, 'message')

    if (typeof message === 'string' && message) {
      return message
    }
  }

  return fallback
}
</script>

<template>
  <div class="page-grid">
    <SectionCard
      title="文章管理"
      description="后台最核心的工作页。首轮已补齐独立发布动作，状态切换不再依赖保存表单。"
      variant="hero"
      size="lg"
    >
      <template #action>
        <RouterLink to="/admin/posts/new" class="ui-btn ui-btn-primary text-sm">
          新建文章
        </RouterLink>
      </template>

      <div class="grid gap-4 xl:grid-cols-4">
        <article class="rounded-[22px] border border-[rgba(76,139,245,0.16)] bg-[linear-gradient(180deg,#f8fbff,#ffffff)] p-5">
          <p class="editor-kicker">文章总量</p>
          <p class="mt-4 text-[38px] text-[var(--text-1)] font-semibold">{{ pagination.total }}</p>
          <p class="mt-3 text-xs text-[var(--text-3)]">覆盖当前筛选条件下的内容范围</p>
        </article>
        <article class="rounded-[22px] border border-[var(--line-soft)] bg-[linear-gradient(180deg,#ffffff,#fbfcfe)] p-5">
          <p class="editor-kicker">草稿</p>
          <p class="mt-4 text-[38px] text-[var(--text-1)] font-semibold">{{ draftCount }}</p>
          <p class="mt-3 text-xs text-[var(--text-3)]">仍需编辑或待发布的文章</p>
        </article>
        <article class="rounded-[22px] border border-[rgba(18,183,106,0.14)] bg-[linear-gradient(180deg,#f4fdf8,#ffffff)] p-5">
          <p class="editor-kicker">已发布</p>
          <p class="mt-4 text-[38px] text-[var(--text-1)] font-semibold">{{ publishedCount }}</p>
          <p class="mt-3 text-xs text-[var(--success)]">当前对外可见的公开内容</p>
        </article>
        <article class="rounded-[22px] border border-[rgba(247,144,9,0.14)] bg-[linear-gradient(180deg,#fffaf2,#ffffff)] p-5">
          <p class="editor-kicker">最近更新</p>
          <p class="mt-4 text-base text-[var(--text-1)] font-semibold leading-7">
            {{ formatDateTime(latestUpdatedAt) }}
          </p>
          <p class="mt-3 text-xs text-[var(--warning)]">已归档 {{ archivedCount }} 篇</p>
        </article>
      </div>

      <div class="mt-6 rounded-[24px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4 md:p-5">
        <div class="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_220px_auto] xl:items-end">
          <label class="block">
            <span class="mb-2 block text-sm text-[var(--text-2)]">搜索文章</span>
            <input
              v-model="queryForm.keyword"
              type="text"
              placeholder="输入标题、slug 或摘要关键词"
              class="ui-input"
              @keyup.enter="handleSearch"
            >
          </label>

          <label class="block">
            <span class="mb-2 block text-sm text-[var(--text-2)]">状态筛选</span>
            <select v-model="queryForm.status" class="ui-select">
              <option v-for="option in statusOptions" :key="option.value || 'all'" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <div class="flex flex-wrap gap-3 xl:justify-end">
            <button type="button" class="ui-btn ui-btn-secondary text-sm" @click="handleReset">
              重置
            </button>
            <button type="button" class="ui-btn ui-btn-primary text-sm" @click="handleSearch">
              查询
            </button>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-4)]">
          <div class="flex flex-wrap items-center gap-3">
            <span>{{ totalLabel }}</span>
            <span class="ui-badge">分类筛选下一轮再接入</span>
            <span class="ui-badge">已接独立发布动作</span>
          </div>
          <p class="editor-mono">默认按最近更新时间倒序展示</p>
        </div>
      </div>
    </SectionCard>

    <SectionCard title="文章列表" description="标题作为主视觉，状态、分类、更新时间围绕它组织。" variant="panel">
      <div v-if="successMessage" class="mb-4 rounded-[18px] border border-[rgba(18,183,106,0.16)] bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)]">
        {{ successMessage }}
      </div>

      <div v-if="loading" class="rounded-[20px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-5 py-14 text-center text-sm text-[var(--text-3)]">
        正在加载文章列表...
      </div>

      <div v-else-if="errorMessage" class="rounded-[20px] border border-[rgba(240,68,56,0.14)] bg-[var(--danger-soft)] px-5 py-10">
        <p class="text-sm text-[var(--danger)]">
          {{ errorMessage }}
        </p>
      </div>

      <div v-else-if="!hasData" class="rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-5 py-14 text-center text-sm text-[var(--text-3)]">
        当前暂无符合条件的文章，可以先新建一篇内容。
      </div>

      <div v-else class="space-y-4">
        <article
          v-for="post in posts"
          :key="post.id"
          class="rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card)] p-5 transition hover:border-[rgba(76,139,245,0.18)] hover:shadow-[var(--shadow-xs)]"
        >
          <div class="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_180px_180px_280px] xl:items-start">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="truncate text-[18px] text-[var(--text-1)] font-semibold leading-7">{{ post.title }}</h3>
                <span :class="getStatusClass(post.status)">
                  {{ getStatusLabel(post.status) }}
                </span>
              </div>
              <p class="mt-2 text-xs text-[var(--text-4)] editor-mono">/{{ post.slug }}</p>
              <p class="mt-3 line-clamp-2 text-sm text-[var(--text-3)] leading-7">
                {{ post.summary || '暂无摘要，后续可在编辑页补充。' }}
              </p>
              <div class="mt-4 flex flex-wrap gap-2 text-xs text-[var(--text-4)]">
                <span class="ui-badge">分类：{{ post.category?.name || '未分类' }}</span>
                <span class="ui-badge">标签 {{ post.counts?.tags ?? 0 }}</span>
                <span class="ui-badge">评论 {{ post.counts?.comments ?? 0 }}</span>
              </div>
            </div>

            <div class="text-sm text-[var(--text-3)] leading-7">
              <p class="text-xs uppercase tracking-[0.16em] text-[var(--text-4)]">更新时间</p>
              <p class="mt-2 editor-mono">{{ formatDateTime(post.updatedAt ?? null) }}</p>
            </div>

            <div class="text-sm text-[var(--text-3)] leading-7">
              <p class="text-xs uppercase tracking-[0.16em] text-[var(--text-4)]">发布时间</p>
              <p class="mt-2 editor-mono">{{ formatDateTime(post.publishedAt ?? null) }}</p>
            </div>

            <div class="flex flex-wrap gap-2 xl:justify-end">
              <RouterLink :to="`/admin/posts/${post.id}/edit`" class="ui-btn ui-btn-primary min-h-[38px] px-4 text-sm">
                编辑
              </RouterLink>
              <RouterLink :to="`/posts/${post.slug}`" target="_blank" class="ui-btn ui-btn-secondary min-h-[38px] px-4 text-sm">
                预览
              </RouterLink>
              <button type="button" class="ui-btn ui-btn-secondary min-h-[38px] px-4 text-sm" :disabled="!canPublish(post) || isActionPending(post.id)" @click="handlePostAction(post, 'publish')">
                {{ isActionPending(post.id) ? '处理中...' : '发布' }}
              </button>
              <button type="button" class="ui-btn ui-btn-secondary min-h-[38px] px-4 text-sm" :disabled="!canUnpublish(post) || isActionPending(post.id)" @click="handlePostAction(post, 'unpublish')">
                {{ isActionPending(post.id) ? '处理中...' : '下线' }}
              </button>
              <button type="button" class="ui-btn ui-btn-secondary min-h-[38px] px-4 text-sm" :disabled="!canArchive(post) || isActionPending(post.id)" @click="handlePostAction(post, 'archive')">
                {{ isActionPending(post.id) ? '处理中...' : '归档' }}
              </button>
            </div>
          </div>
        </article>
      </div>

      <div class="mt-5 flex flex-col gap-3 border-t border-[var(--line-soft)] pt-5 text-sm text-[var(--text-4)] md:flex-row md:items-center md:justify-between">
        <p>第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</p>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="ui-btn ui-btn-secondary min-h-[38px] px-4 text-sm"
            :disabled="pagination.page <= 1"
            @click="handlePageChange(pagination.page - 1)"
          >
            上一页
          </button>
          <button
            type="button"
            class="ui-btn ui-btn-secondary min-h-[38px] px-4 text-sm"
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
