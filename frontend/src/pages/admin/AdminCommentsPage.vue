<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'

import {
  approveAdminComment,
  getAdminCommentDetail,
  getAdminComments,
  getAdminCommentStats,
  markAdminCommentSpam,
  rejectAdminComment,
  replyAdminComment,
} from '../../api/comments'
import SectionCard from '../../components/common/SectionCard.vue'
import PublicPageHero from '../../components/public/PublicPageHero.vue'
import type {
  AdminCommentDetail,
  AdminCommentItem,
  AdminCommentReviewAction,
  AdminCommentStatus,
  AdminCommentStatsResponse,
} from '../../types/comment'
import { useAuthStore } from '../../stores/auth'

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
  { label: '已通过', value: 'APPROVED', hint: '已经展示在前台' },
  { label: '已驳回', value: 'REJECTED', hint: '人工筛掉的评论' },
  { label: '垃圾评论', value: 'SPAM', hint: '命中垃圾评论池' },
]

const queryForm = reactive({
  keyword: '',
  status: 'PENDING' as '' | AdminCommentStatus,
})

const replyForm = reactive({
  content: '',
  reason: '',
})

const authStore = useAuthStore()
const { profile } = storeToRefs(authStore)

const listLoading = ref(false)
const statsLoading = ref(false)
const detailLoading = ref(false)
const actionLoadingId = ref('')
const replySubmitting = ref(false)
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
const pendingFirstHint = computed(() => {
  if (!stats.value) {
    return '优先处理待审核评论，减少前台阻塞。'
  }

  return `当前待审核 ${stats.value.pending} 条，建议先处理最新提交评论。`
})

const canReplySelectedComment = computed(() => {
  if (!selectedCommentDetail.value) {
    return false
  }

  return !selectedCommentDetail.value.parentId
})

onMounted(() => {
  void refreshComments()
})

// 统一刷新评论统计与评论列表，保持头区指标与列表状态同步。
async function refreshComments() {
  await Promise.all([loadCommentStats(), loadComments(pagination.page)])
}

// 拉取评论统计，用于支撑头区概览和审核节奏判断。
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

// 评论列表按状态和关键词拉取，列表与详情联动保持一套工作流。
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

// 详情区展示回复链、父评论和审核备注，避免审核时来回跳页。
async function loadCommentDetail(commentId: string) {
  if (!commentId) {
    selectedCommentId.value = ''
    selectedCommentDetail.value = null
    resetReplyForm()
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
  resetReplyForm()
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
  resetReplyForm()
  await loadCommentDetail(commentId)
}

// 审核动作仍然使用 prompt 收集备注，先保证联调闭环和审核效率。
function resetReplyForm() {
  replyForm.content = ''
  replyForm.reason = ''
}

async function handleReplySubmit() {
  const comment = selectedCommentDetail.value

  if (!comment || !comment.id || replySubmitting.value || !canReplySelectedComment.value) {
    return
  }

  const replyContent = replyForm.content.trim()

  if (replyContent.length < 2) {
    errorMessage.value = '回复内容至少 2 个字符'
    successMessage.value = ''
    return
  }

  replySubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await replyAdminComment(comment.id, {
      content: replyContent,
      reason: replyForm.reason,
    })

    successMessage.value = '管理员回复已发布'
    resetReplyForm()
    await Promise.all([
      loadCommentStats(),
      loadComments(pagination.page),
      loadCommentDetail(comment.id),
    ])
  }
  catch (error) {
    errorMessage.value = resolveErrorMessage(error, '管理员回复失败，请稍后重试')
  }
  finally {
    replySubmitting.value = false
  }
}

async function handleReviewAction(comment: AdminCommentItem, action: AdminCommentReviewAction) {
  if (actionLoadingId.value || replySubmitting.value) {
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
    return 'ui-badge-status-approved'
  }

  if (status === 'REJECTED') {
    return 'ui-badge-status-danger'
  }

  if (status === 'SPAM') {
    return 'ui-badge-status-warning'
  }

  return 'ui-badge-status-draft'
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
    return 'border-[rgba(18,183,106,0.16)] bg-[var(--success-soft)] text-[var(--success)] hover:border-[rgba(18,183,106,0.28)]'
  }

  if (action === 'reject') {
    return 'border-[rgba(240,68,56,0.14)] bg-[var(--danger-soft)] text-[var(--danger)] hover:border-[rgba(240,68,56,0.24)]'
  }

  return 'border-[rgba(247,144,9,0.16)] bg-[var(--warning-soft)] text-[var(--warning)] hover:border-[rgba(247,144,9,0.28)]'
}

function maskEmail(email: string | null | undefined) {
  if (!email) {
    return '--'
  }

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
  <div class="page-grid">
    <PublicPageHero
      kicker="Admin / Comment Review"
      title="评论审核台"
      description="把评论审核从旧版深色工作流切回清爽后台：先看状态分布，再处理列表，最后查看详情与回复链。"
      :meta="[
        selectedStatusLabel,
        totalLabel,
        stats?.latestComment ? `最近评论：${formatDateTime(stats.latestComment.createdAt)}` : '等待最新评论',
      ]"
      :actions="[
        { label: '返回仪表盘', to: '/admin', variant: 'secondary' },
        { label: '刷新评论', to: '/admin/comments', variant: 'ghost' },
      ]"
      aside-title="审核节奏"
      :aside-text="pendingFirstHint"
      :aside-stats="[
        { label: '待审核', value: statsLoading ? '--' : String(stats?.pending ?? 0) },
        { label: '已通过', value: statsLoading ? '--' : String(stats?.approved ?? 0) },
      ]"
    />

    <SectionCard title="状态概览" description="统一使用浅色卡片展示评论池状态，帮助先做优先级判断。" variant="panel">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="item in statCards"
          :key="item.label"
          class="rounded-[22px] border border-[var(--line-soft)] bg-white p-5"
        >
          <p class="text-sm text-[var(--text-4)]">{{ item.label }}</p>
          <p class="mt-4 text-[34px] font-semibold text-[var(--text-1)]">{{ statsLoading ? '--' : item.value }}</p>
          <p class="mt-3 text-sm text-[var(--text-3)] leading-6">{{ item.hint }}</p>
        </div>
      </div>
    </SectionCard>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
      <SectionCard title="评论列表" description="左侧处理筛选、列表和分页，保持单页审核闭环。" variant="hero" size="lg">
        <template #action>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="ui-btn ui-btn-secondary text-sm"
              :disabled="listLoading || statsLoading"
              @click="handleReset"
            >
              重置筛选
            </button>
            <button
              type="button"
              class="ui-btn ui-btn-primary text-sm"
              :disabled="listLoading || statsLoading"
              @click="refreshComments"
            >
              刷新评论
            </button>
          </div>
        </template>

        <div class="space-y-5">
          <div class="flex flex-wrap gap-3">
            <button
              v-for="option in statusOptions"
              :key="option.value || 'all'"
              type="button"
              class="rounded-full border px-4 py-2 text-sm transition"
              :class="queryForm.status === option.value
                ? 'border-[rgba(76,139,245,0.22)] bg-[var(--accent-primary-soft)] text-[var(--text-1)]'
                : 'border-[var(--line-soft)] bg-white text-[var(--text-3)] hover:border-[rgba(76,139,245,0.22)] hover:text-[var(--text-1)]'"
              @click="handleStatusTabClick(option.value)"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="grid gap-4 rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4 lg:grid-cols-[minmax(0,1.6fr)_220px_auto] lg:items-end">
            <label class="block">
              <span class="mb-2 block text-sm text-[var(--text-3)]">搜索评论</span>
              <input
                v-model="queryForm.keyword"
                type="text"
                placeholder="输入评论人、邮箱、内容或文章标题关键词"
                class="ui-input"
                @keyup.enter="handleSearch"
              >
            </label>

            <label class="block">
              <span class="mb-2 block text-sm text-[var(--text-3)]">当前筛选</span>
              <div class="ui-input flex items-center bg-white text-sm text-[var(--text-2)]">
                {{ selectedStatusLabel }}
              </div>
            </label>

            <button
              type="button"
              class="ui-btn ui-btn-primary text-sm"
              @click="handleSearch"
            >
              查询评论
            </button>
          </div>

          <div v-if="successMessage" class="rounded-[18px] border border-[rgba(18,183,106,0.16)] bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)]">
            {{ successMessage }}
          </div>
          <div v-if="errorMessage" class="rounded-[18px] border border-[rgba(240,68,56,0.14)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            {{ errorMessage }}
          </div>

          <div v-if="listLoading" class="rounded-[22px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-5 py-14 text-center text-sm text-[var(--text-3)]">
            正在加载评论列表...
          </div>

          <div v-else-if="!hasData" class="rounded-[22px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-5 py-14 text-center text-sm text-[var(--text-3)]">
            当前暂无符合条件的评论。
          </div>

          <div v-else class="space-y-4">
            <article
              v-for="comment in comments"
              :key="comment.id"
              class="cursor-pointer rounded-[22px] border p-5 transition"
              :class="selectedCommentId === comment.id
                ? 'border-[rgba(76,139,245,0.22)] bg-[var(--accent-primary-soft)] shadow-[var(--shadow-sm)]'
                : 'border-[var(--line-soft)] bg-white hover:-translate-y-[1px] hover:border-[rgba(76,139,245,0.22)] hover:shadow-[var(--shadow-sm)]'"
              @click="handleSelectComment(comment.id)"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--text-1)]">
                    <span>{{ comment.authorName }}</span>
                    <span class="text-xs text-[var(--text-4)]">{{ maskEmail(comment.authorEmail) }}</span>
                  </div>
                  <p class="mt-3 line-clamp-3 text-sm text-[var(--text-3)] leading-7">
                    {{ comment.content }}
                  </p>
                </div>
                <span class="ui-badge" :class="getCommentStatusClass(comment.status)">
                  {{ getCommentStatusLabel(comment.status) }}
                </span>
              </div>

              <div class="mt-4 grid gap-3 text-xs text-[var(--text-4)] md:grid-cols-2">
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
                  class="rounded-full border border-[var(--line-soft)] bg-white px-3 py-1.5 text-xs text-[var(--text-3)] transition hover:border-[rgba(76,139,245,0.22)] hover:text-[var(--text-1)]"
                >
                  查看文章
                </RouterLink>
              </div>
            </article>
          </div>

          <div class="flex flex-col gap-3 border-t border-[var(--line-soft)] pt-5 text-sm text-[var(--text-3)] md:flex-row md:items-center md:justify-between">
            <p>第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</p>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="ui-btn ui-btn-secondary text-sm disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="pagination.page <= 1"
                @click="handlePageChange(pagination.page - 1)"
              >
                上一页
              </button>
              <button
                type="button"
                class="ui-btn ui-btn-secondary text-sm disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="pagination.page >= Math.max(pagination.totalPages, 1)"
                @click="handlePageChange(pagination.page + 1)"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="评论详情" description="右侧固定承接当前评论详情、父评论和回复链，减少切页损耗。" variant="dashed">
        <div v-if="detailLoading" class="rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-5 py-14 text-center text-sm text-[var(--text-3)]">
          正在加载评论详情...
        </div>

        <div v-else-if="!selectedCommentDetail" class="rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-5 py-14 text-center text-sm text-[var(--text-3)]">
          请选择一条评论查看详情。
        </div>

        <div v-else class="space-y-4">
          <div class="rounded-[22px] border border-[var(--line-soft)] bg-white p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-lg font-semibold text-[var(--text-1)]">{{ selectedCommentDetail.authorName }}</p>
                <p class="mt-1 text-sm text-[var(--text-4)]">{{ maskEmail(selectedCommentDetail.authorEmail) }}</p>
              </div>
              <span class="ui-badge" :class="getCommentStatusClass(selectedCommentDetail.status)">
                {{ getCommentStatusLabel(selectedCommentDetail.status) }}
              </span>
            </div>

            <div class="mt-4 rounded-[18px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4">
              <p class="text-sm text-[var(--text-2)] leading-7">{{ selectedCommentDetail.content }}</p>
            </div>

            <div class="mt-4 grid gap-3 text-sm text-[var(--text-3)]">
              <p>所属文章：<span class="text-[var(--text-1)]">{{ selectedCommentDetail.post.title }}</span></p>
              <p>提交时间：<span class="text-[var(--text-1)]">{{ formatDateTime(selectedCommentDetail.createdAt) }}</span></p>
              <p>审核时间：<span class="text-[var(--text-1)]">{{ formatDateTime(selectedCommentDetail.approvedAt) }}</span></p>
              <p>审核备注：<span class="text-[var(--text-1)]">{{ selectedCommentDetail.reviewReason || '暂无备注' }}</span></p>
              <p>评论网址：<span class="break-all text-[var(--text-1)]">{{ selectedCommentDetail.authorWebsite || '未填写' }}</span></p>
              <p>来源标识：<span class="break-all text-[var(--text-1)]">{{ selectedCommentDetail.ipHash || '无' }}</span></p>
            </div>
          </div>

          <div v-if="selectedCommentDetail.parent" class="rounded-[22px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4">
            <p class="text-sm font-medium text-[var(--text-1)]">父评论</p>
            <p class="mt-2 text-xs text-[var(--text-4)]">{{ selectedCommentDetail.parent.authorName }}</p>
            <p class="mt-3 text-sm text-[var(--text-3)] leading-7">{{ selectedCommentDetail.parent.content }}</p>
          </div>

          <div class="rounded-[22px] border border-[var(--line-soft)] bg-white p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-medium text-[var(--text-1)]">管理员回复</p>
                <p class="mt-1 text-xs text-[var(--text-4)]">
                  直接为当前评论补一条单层回复，默认立即公开展示。
                </p>
              </div>
              <span class="ui-badge ui-badge-status-approved">{{ profile?.displayName ?? '管理员' }}</span>
            </div>

            <div v-if="!canReplySelectedComment" class="mt-4 rounded-[18px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-4 py-3 text-sm text-[var(--text-3)]">
              当前评论本身就是回复，暂不支持继续向下嵌套回复。
            </div>
            <form v-else class="mt-4 space-y-4" @submit.prevent="handleReplySubmit">
              <label class="block">
                <span class="mb-2 block text-sm text-[var(--text-3)]">回复内容</span>
                <textarea
                  v-model="replyForm.content"
                  class="ui-input min-h-[120px] resize-y"
                  placeholder="输入管理员回复内容，提交后将直接出现在前台已审核回复中。"
                  maxlength="1000"
                />
              </label>
              <label class="block">
                <span class="mb-2 block text-sm text-[var(--text-3)]">回复备注（可选）</span>
                <input
                  v-model="replyForm.reason"
                  type="text"
                  class="ui-input"
                  maxlength="200"
                  placeholder="仅后台可见，可用于记录本次回复说明。"
                >
              </label>
              <div class="flex flex-wrap gap-3">
                <button type="submit" class="ui-btn ui-btn-primary text-sm" :disabled="replySubmitting || !selectedCommentDetail.id">
                  {{ replySubmitting ? '回复中...' : '发布管理员回复' }}
                </button>
                <button type="button" class="ui-btn ui-btn-secondary text-sm" :disabled="replySubmitting" @click="resetReplyForm">
                  清空内容
                </button>
              </div>
            </form>
          </div>

          <div class="rounded-[22px] border border-[var(--line-soft)] bg-white p-4">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-medium text-[var(--text-1)]">已通过回复</p>
              <span class="text-xs text-[var(--text-4)]">{{ selectedCommentDetail.replies.length }} 条</span>
            </div>
            <div v-if="selectedCommentDetail.replies.length === 0" class="mt-3 text-sm text-[var(--text-3)]">
              当前暂无回复。
            </div>
            <div v-else class="mt-3 space-y-3">
              <article
                v-for="reply in selectedCommentDetail.replies"
                :key="reply.id"
                class="rounded-[18px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-3"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-sm font-medium text-[var(--text-1)]">{{ reply.authorName }}</span>
                  <span class="ui-badge" :class="getCommentStatusClass(reply.status)">
                    {{ getCommentStatusLabel(reply.status) }}
                  </span>
                </div>
                <p class="mt-3 text-sm text-[var(--text-3)] leading-6">{{ reply.content }}</p>
                <p class="mt-3 text-xs text-[var(--text-4)]">{{ formatDateTime(reply.createdAt) }}</p>
              </article>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  </div>
</template>
