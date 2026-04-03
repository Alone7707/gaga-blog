<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'

import {
  approveAdminComment,
  getAdminCommentDetail,
  getAdminComments,
  getAdminCommentStats,
  markAdminCommentSpam,
  rejectAdminComment,
} from '../../api/comments'
import SectionCard from '../../components/common/SectionCard.vue'
import type {
  AdminCommentDetail,
  AdminCommentItem,
  AdminCommentReviewAction,
  AdminCommentStatus,
  AdminCommentStatsResponse,
} from '../../types/comment'

interface StatusOption {
  label: string
  value: '' | AdminCommentStatus
  hint: string
}

interface StatCardItem {
  label: string
  value: string
  hint: string
}

const statusOptions: StatusOption[] = [
  { label: '全部评论', value: '', hint: '查看全部状态的评论' },
  { label: '待审核', value: 'PENDING', hint: '优先处理新提交评论' },
  { label: '已通过', value: 'APPROVED', hint: '已展示在前台的评论' },
  { label: '已驳回', value: 'REJECTED', hint: '人工驳回的评论' },
  { label: '垃圾评论', value: 'SPAM', hint: '已标记为垃圾内容' },
]

const queryForm = reactive({
  keyword: '',
  status: 'PENDING' as '' | AdminCommentStatus,
})

const listLoading = ref(false)
const statsLoading = ref(false)
const detailLoading = ref(false)
const actionLoadingId = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const comments = ref<AdminCommentItem[]>([])
const stats = ref<AdminCommentStatsResponse | null>(null)
const selectedCommentId = ref('')
const selectedCommentDetail = ref<AdminCommentDetail | null>(null)
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
})

const statCards = computed<StatCardItem[]>(() => {
  if (!stats.value) {
    return []
  }

  return [
    {
      label: '评论总数',
      value: String(stats.value.total),
      hint: '后台审核池累计评论量',
    },
    {
      label: '待审核',
      value: String(stats.value.pending),
      hint: `待审核占比 ${formatRate(stats.value.pendingRate)}`,
    },
    {
      label: '已通过',
      value: String(stats.value.approved),
      hint: `通过率 ${formatRate(stats.value.approvedRate)}`,
    },
    {
      label: '垃圾评论',
      value: String(stats.value.spam),
      hint: `已驳回 ${stats.value.rejected} 条`,
    },
  ]
})

const totalLabel = computed(() => `共 ${pagination.total} 条评论`)
const hasData = computed(() => comments.value.length > 0)
const selectedStatusLabel = computed(() => {
  const matched = statusOptions.find((item) => item.value === queryForm.status)
  return matched?.label ?? '全部评论'
})

onMounted(() => {
  void Promise.all([loadCommentStats(), loadComments(1)])
})

// 拉取后台评论统计，优先展示审核池概况，方便运营确认处理优先级。
async function loadCommentStats() {
  statsLoading.value = true

  try {
    const response = await getAdminCommentStats()
    stats.value = response.stats
  }
  catch (error) {
    stats.value = null
    errorMessage.value = resolveErrorMessage(error, '评论统计加载失败，请确认后端评论模块是否已启动')
  }
  finally {
    statsLoading.value = false
  }
}

// 评论列表按状态和关键词拉取，满足后台审核页最小交付能力。
async function loadComments(page = pagination.page) {
  listLoading.value = true
  errorMessage.value = ''

  try {
    const response = await getAdminComments({
      page,
      pageSize: pagination.pageSize,
      keyword: queryForm.keyword,
      status: queryForm.status,
    })

    comments.value = response.list
    pagination.page = response.pagination.page
    pagination.pageSize = response.pagination.pageSize
    pagination.total = response.pagination.total
    pagination.totalPages = response.pagination.totalPages

    if (comments.value.length === 0) {
      selectedCommentId.value = ''
      selectedCommentDetail.value = null
      return
    }

    const nextSelectedId = comments.value.some((item) => item.id === selectedCommentId.value)
      ? selectedCommentId.value
      : comments.value[0].id

    await loadCommentDetail(nextSelectedId)
  }
  catch (error) {
    comments.value = []
    selectedCommentId.value = ''
    selectedCommentDetail.value = null
    pagination.page = 1
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = resolveErrorMessage(error, '评论列表加载失败，请稍后重试')
  }
  finally {
    listLoading.value = false
  }
}

// 详情区展示回复链、审核备注和来源信息，避免审核时来回跳页。
async function loadCommentDetail(commentId: string) {
  if (!commentId) {
    selectedCommentId.value = ''
    selectedCommentDetail.value = null
    return
  }

  detailLoading.value = true

  try {
    const response = await getAdminCommentDetail(commentId)
    selectedCommentId.value = commentId
    selectedCommentDetail.value = response.comment
  }
  catch (error) {
    selectedCommentDetail.value = null
    errorMessage.value = resolveErrorMessage(error, '评论详情加载失败，请稍后重试')
  }
  finally {
    detailLoading.value = false
  }
}

function handleSearch() {
  void loadComments(1)
}

function handleReset() {
  queryForm.keyword = ''
  queryForm.status = 'PENDING'
  successMessage.value = ''
  void loadComments(1)
}

function handleStatusTabClick(status: '' | AdminCommentStatus) {
  if (queryForm.status === status) {
    return
  }

  queryForm.status = status
  successMessage.value = ''
  void loadComments(1)
}

function handlePageChange(nextPage: number) {
  if (nextPage < 1 || nextPage > Math.max(pagination.totalPages, 1) || nextPage === pagination.page) {
    return
  }

  void loadComments(nextPage)
}

async function handleSelectComment(commentId: string) {
  successMessage.value = ''
  await loadCommentDetail(commentId)
}

// 审核动作当前采用 prompt 收集备注，减少表单复杂度，先保证联调闭环可用。
async function handleReviewAction(comment: AdminCommentItem, action: AdminCommentReviewAction) {
  if (actionLoadingId.value) {
    return
  }

  const actionText = getActionLabel(action)
  const shouldContinue = window.confirm(`确认${actionText}该评论吗？`)

  if (!shouldContinue) {
    return
  }

  const inputReason = window.prompt(`可选：填写${actionText}备注（可留空）`, comment.reviewReason ?? '')

  if (inputReason === null) {
    return
  }

  actionLoadingId.value = comment.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (action === 'approve') {
      await approveAdminComment(comment.id, { reason: inputReason })
    }
    else if (action === 'reject') {
      await rejectAdminComment(comment.id, { reason: inputReason })
    }
    else {
      await markAdminCommentSpam(comment.id, { reason: inputReason })
    }

    successMessage.value = `评论已${actionText}`
    await Promise.all([
      loadCommentStats(),
      loadComments(pagination.page),
    ])
  }
  catch (error) {
    errorMessage.value = resolveErrorMessage(error, `评论${actionText}失败，请稍后重试`)
  }
  finally {
    actionLoadingId.value = ''
  }
}

function getCommentStatusLabel(status: AdminCommentStatus) {
  if (status === 'APPROVED') {
    return '已通过'
  }

  if (status === 'REJECTED') {
    return '已驳回'
  }

  if (status === 'SPAM') {
    return '垃圾评论'
  }

  return '待审核'
}

function getCommentStatusClass(status: AdminCommentStatus) {
  if (status === 'APPROVED') {
    return 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
  }

  if (status === 'REJECTED') {
    return 'border-rose-400/25 bg-rose-500/10 text-rose-200'
  }

  if (status === 'SPAM') {
    return 'border-amber-400/25 bg-amber-500/10 text-amber-200'
  }

  return 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200'
}

function getActionLabel(action: AdminCommentReviewAction) {
  if (action === 'approve') {
    return '通过'
  }

  if (action === 'reject') {
    return '驳回'
  }

  return '标记为垃圾评论'
}

function getActionButtonClass(action: AdminCommentReviewAction) {
  if (action === 'approve') {
    return 'border-emerald-400/25 text-emerald-200 hover:border-emerald-300/40 hover:bg-emerald-500/10'
  }

  if (action === 'reject') {
    return 'border-rose-400/25 text-rose-200 hover:border-rose-300/40 hover:bg-rose-500/10'
  }

  return 'border-amber-400/25 text-amber-200 hover:border-amber-300/40 hover:bg-amber-500/10'
}

function maskEmail(email: string) {
  const [name, domain] = email.split('@')

  if (!name || !domain) {
    return '--'
  }

  if (name.length <= 2) {
    return `${name[0]}***@${domain}`
  }

  return `${name.slice(0, 2)}***@${domain}`
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

function formatRate(rate: number) {
  return `${(rate * 100).toFixed(1)}%`
}

function resolveErrorMessage(error: unknown, fallback: string) {
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
  <div class="space-y-6">
    <SectionCard title="评论审核" description="已接入后台评论统计、评论列表和审核动作接口。当前版本优先保证待审核处理、状态筛选和单条审核闭环可用。">
      <template #action>
        <div class="flex flex-wrap gap-3">
          <RouterLink
            to="/admin"
            class="inline-flex items-center rounded-full border border-white/12 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-300/30 hover:text-white"
          >
            返回仪表盘
          </RouterLink>
          <button
            type="button"
            class="inline-flex items-center rounded-full bg-cyan-400 px-4 py-2 text-sm text-slate-950 font-semibold transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="listLoading || statsLoading"
            @click="Promise.all([loadCommentStats(), loadComments(pagination.page)])"
          >
            刷新评论
          </button>
        </div>
      </template>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="item in statCards"
          :key="item.label"
          class="rounded-6 border border-white/10 bg-slate-950/35 p-5"
        >
          <p class="text-sm text-slate-400">{{ item.label }}</p>
          <p class="mt-4 text-4xl font-semibold text-white">{{ statsLoading ? '--' : item.value }}</p>
          <p class="mt-3 text-xs text-cyan-200/80">{{ item.hint }}</p>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap gap-3">
        <button
          v-for="option in statusOptions"
          :key="option.value || 'all'"
          type="button"
          class="rounded-full border px-4 py-2 text-sm transition"
          :class="queryForm.status === option.value
            ? 'border-cyan-300/35 bg-cyan-400/12 text-white'
            : 'border-white/12 text-slate-300 hover:border-cyan-300/20 hover:text-white'"
          @click="handleStatusTabClick(option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="mt-5 flex flex-col gap-4 rounded-6 border border-white/8 bg-slate-950/35 p-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="grid flex-1 gap-4 md:grid-cols-[minmax(0,1.6fr)_220px]">
          <label class="block">
            <span class="mb-2 block text-sm text-slate-300">搜索评论</span>
            <input
              v-model="queryForm.keyword"
              type="text"
              placeholder="输入评论人、邮箱、内容或文章标题关键词"
              class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70"
              @keyup.enter="handleSearch"
            >
          </label>

          <label class="block">
            <span class="mb-2 block text-sm text-slate-300">当前筛选</span>
            <div class="rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100">
              {{ selectedStatusLabel }}
            </div>
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
          <span v-if="stats?.latestComment" class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
            最近评论：{{ formatDateTime(stats.latestComment.createdAt) }}
          </span>
        </div>
        <p>列表默认按评论提交时间倒序展示</p>
      </div>

      <div v-if="successMessage" class="mt-5 rounded-4 border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="mt-5 rounded-4 border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
        {{ errorMessage }}
      </div>

      <div class="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div class="overflow-hidden rounded-6 border border-white/8 bg-slate-950/30">
          <div v-if="listLoading" class="px-5 py-14 text-center text-sm text-slate-300">
            正在加载评论列表...
          </div>

          <div v-else-if="!hasData" class="px-5 py-14 text-center text-sm text-slate-300">
            当前暂无符合条件的评论。
          </div>

          <div v-else class="divide-y divide-white/6">
            <article
              v-for="comment in comments"
              :key="comment.id"
              class="cursor-pointer p-5 transition hover:bg-white/4"
              :class="selectedCommentId === comment.id ? 'bg-cyan-400/6' : ''"
              @click="handleSelectComment(comment.id)"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2 text-sm text-white font-medium">
                    <span>{{ comment.authorName }}</span>
                    <span class="text-xs text-slate-500">{{ maskEmail(comment.authorEmail) }}</span>
                  </div>
                  <p class="mt-3 line-clamp-3 text-sm text-slate-300 leading-7">
                    {{ comment.content }}
                  </p>
                </div>
                <span class="inline-flex rounded-full border px-3 py-1 text-xs" :class="getCommentStatusClass(comment.status)">
                  {{ getCommentStatusLabel(comment.status) }}
                </span>
              </div>

              <div class="mt-4 grid gap-3 text-xs text-slate-400 md:grid-cols-2">
                <p>所属文章：{{ comment.post.title }}</p>
                <p>提交时间：{{ formatDateTime(comment.createdAt) }}</p>
                <p>回复概览：{{ comment.approvedReplyCount }} / {{ comment.replyCount }}</p>
                <p>审核人：{{ comment.reviewedBy?.displayName ?? '未审核' }}</p>
              </div>

              <div class="mt-4 flex flex-wrap gap-2" @click.stop>
                <button
                  type="button"
                  class="rounded-full border px-3 py-1.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-50"
                  :class="getActionButtonClass('approve')"
                  :disabled="actionLoadingId === comment.id || comment.status === 'APPROVED'"
                  @click="handleReviewAction(comment, 'approve')"
                >
                  {{ actionLoadingId === comment.id ? '处理中...' : '通过' }}
                </button>
                <button
                  type="button"
                  class="rounded-full border px-3 py-1.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-50"
                  :class="getActionButtonClass('reject')"
                  :disabled="actionLoadingId === comment.id || comment.status === 'REJECTED'"
                  @click="handleReviewAction(comment, 'reject')"
                >
                  驳回
                </button>
                <button
                  type="button"
                  class="rounded-full border px-3 py-1.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-50"
                  :class="getActionButtonClass('spam')"
                  :disabled="actionLoadingId === comment.id || comment.status === 'SPAM'"
                  @click="handleReviewAction(comment, 'spam')"
                >
                  标记垃圾
                </button>
                <RouterLink
                  :to="`/posts/${comment.post.slug}`"
                  target="_blank"
                  class="rounded-full border border-white/12 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-300/40 hover:text-white"
                >
                  查看文章
                </RouterLink>
              </div>
            </article>
          </div>

          <div class="flex flex-col gap-3 border-t border-white/8 px-5 py-5 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
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
        </div>

        <SectionCard title="评论详情" description="右侧用于查看当前评论的详细内容、父评论和审核信息。">
          <div v-if="detailLoading" class="rounded-6 border border-white/8 bg-slate-950/30 px-5 py-14 text-center text-sm text-slate-300">
            正在加载评论详情...
          </div>

          <div v-else-if="!selectedCommentDetail" class="rounded-6 border border-white/8 bg-slate-950/30 px-5 py-14 text-center text-sm text-slate-300">
            请选择一条评论查看详情。
          </div>

          <div v-else class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-lg text-white font-semibold">{{ selectedCommentDetail.authorName }}</p>
                <p class="mt-1 text-sm text-slate-400">{{ maskEmail(selectedCommentDetail.authorEmail) }}</p>
              </div>
              <span class="inline-flex rounded-full border px-3 py-1 text-xs" :class="getCommentStatusClass(selectedCommentDetail.status)">
                {{ getCommentStatusLabel(selectedCommentDetail.status) }}
              </span>
            </div>

            <div class="rounded-6 border border-white/8 bg-slate-950/30 p-4">
              <p class="text-sm text-slate-300 leading-7">{{ selectedCommentDetail.content }}</p>
            </div>

            <div class="grid gap-3 text-sm text-slate-400">
              <p>所属文章：<span class="text-slate-200">{{ selectedCommentDetail.post.title }}</span></p>
              <p>提交时间：<span class="text-slate-200">{{ formatDateTime(selectedCommentDetail.createdAt) }}</span></p>
              <p>审核时间：<span class="text-slate-200">{{ formatDateTime(selectedCommentDetail.approvedAt) }}</span></p>
              <p>审核备注：<span class="text-slate-200">{{ selectedCommentDetail.reviewReason || '暂无备注' }}</span></p>
              <p>评论网址：<span class="text-slate-200 break-all">{{ selectedCommentDetail.authorWebsite || '未填写' }}</span></p>
              <p>来源标识：<span class="text-slate-200 break-all">{{ selectedCommentDetail.ipHash || '无' }}</span></p>
            </div>

            <div v-if="selectedCommentDetail.parent" class="rounded-6 border border-dashed border-white/12 bg-white/3 p-4">
              <p class="text-sm text-white font-medium">父评论</p>
              <p class="mt-2 text-xs text-slate-400">{{ selectedCommentDetail.parent.authorName }}</p>
              <p class="mt-3 text-sm text-slate-300 leading-7">{{ selectedCommentDetail.parent.content }}</p>
            </div>

            <div class="rounded-6 border border-dashed border-cyan-300/20 bg-cyan-400/5 p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm text-white font-medium">已通过回复</p>
                <span class="text-xs text-slate-400">{{ selectedCommentDetail.replies.length }} 条</span>
              </div>
              <div v-if="selectedCommentDetail.replies.length === 0" class="mt-3 text-sm text-slate-400">
                当前暂无回复。
              </div>
              <div v-else class="mt-3 space-y-3">
                <article v-for="reply in selectedCommentDetail.replies" :key="reply.id" class="rounded-4 border border-white/8 bg-slate-950/30 p-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-sm text-slate-200 font-medium">{{ reply.authorName }}</span>
                    <span class="inline-flex rounded-full border px-2.5 py-1 text-[11px]" :class="getCommentStatusClass(reply.status)">
                      {{ getCommentStatusLabel(reply.status) }}
                    </span>
                  </div>
                  <p class="mt-3 text-sm text-slate-300 leading-6">{{ reply.content }}</p>
                  <p class="mt-3 text-xs text-slate-400">{{ formatDateTime(reply.createdAt) }}</p>
                </article>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </SectionCard>
  </div>
</template>
