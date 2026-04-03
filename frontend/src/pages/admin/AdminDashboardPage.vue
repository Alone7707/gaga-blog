<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { getAdminDashboardOverview } from '../../api/dashboard'
import SectionCard from '../../components/common/SectionCard.vue'
import type {
  AdminDashboardOverviewResponse,
  AdminDashboardRecentCommentItem,
  AdminDashboardRecentPostItem,
} from '../../types/dashboard'

interface StatCardItem {
  label: string
  value: string
  hint: string
  tone: 'info' | 'success' | 'warning' | 'default'
}

const loading = ref(false)
const errorMessage = ref('')
const overview = ref<AdminDashboardOverviewResponse | null>(null)

const statCards = computed<StatCardItem[]>(() => {
  if (!overview.value) {
    return []
  }

  return [
    {
      label: '文章总数',
      value: String(overview.value.stats.posts.total),
      hint: `已发布 ${overview.value.stats.posts.published ?? 0} / 草稿 ${overview.value.stats.posts.draft ?? 0}`,
      tone: 'info',
    },
    {
      label: '分类数量',
      value: String(overview.value.stats.categories.total),
      hint: '支撑前台主题归档与导航结构',
      tone: 'default',
    },
    {
      label: '标签数量',
      value: String(overview.value.stats.tags.total),
      hint: '用于横向串联话题与搜索入口',
      tone: 'success',
    },
    {
      label: '待审核评论',
      value: String(overview.value.stats.comments.pending ?? 0),
      hint: `评论总数 ${overview.value.stats.comments.total} / 已通过 ${overview.value.stats.comments.approved ?? 0}`,
      tone: 'warning',
    },
  ]
})

const pendingCommentCount = computed(() => overview.value?.stats.comments.pending ?? 0)
const recentPosts = computed(() => overview.value?.recentPosts ?? [])
const recentComments = computed(() => overview.value?.recentComments ?? [])

onMounted(() => {
  void loadDashboardOverview()
})

// 拉取后台仪表盘概览数据，首轮改版仍以真实接口联调为准。
async function loadDashboardOverview() {
  loading.value = true
  errorMessage.value = ''

  try {
    overview.value = await getAdminDashboardOverview()
  }
  catch (error) {
    overview.value = null
    errorMessage.value = resolveErrorMessage(error, '仪表盘数据加载失败，请确认后端服务是否已启动')
  }
  finally {
    loading.value = false
  }
}

function getPostStatusLabel(status: AdminDashboardRecentPostItem['status']) {
  if (status === 'PUBLISHED') {
    return '已发布'
  }

  if (status === 'ARCHIVED') {
    return '已归档'
  }

  return '草稿'
}

function getPostStatusClass(status: AdminDashboardRecentPostItem['status']) {
  if (status === 'PUBLISHED') {
    return 'ui-badge ui-badge-status-published'
  }

  if (status === 'ARCHIVED') {
    return 'ui-badge ui-badge-status-archived'
  }

  return 'ui-badge ui-badge-status-draft'
}

function getCommentStatusLabel(status: AdminDashboardRecentCommentItem['status']) {
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

function getCommentStatusClass(status: AdminDashboardRecentCommentItem['status']) {
  if (status === 'APPROVED') {
    return 'ui-badge ui-badge-status-approved'
  }

  if (status === 'REJECTED') {
    return 'ui-badge ui-badge-status-rejected'
  }

  if (status === 'SPAM') {
    return 'ui-badge ui-badge-status-spam'
  }

  return 'ui-badge ui-badge-status-warning'
}

function getStatCardClass(tone: StatCardItem['tone']) {
  if (tone === 'info') {
    return 'admin-overview-card admin-overview-card-primary'
  }

  if (tone === 'success') {
    return 'admin-overview-card admin-overview-card-success'
  }

  if (tone === 'warning') {
    return 'admin-overview-card admin-overview-card-warning'
  }

  return 'admin-overview-card'
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
    <SectionCard
      title="后台仪表盘"
      description="首页先回答三个问题：站点状态如何、哪里需要优先处理、接下来最常用的动作是什么。"
      variant="hero"
      size="lg"
    >
      <template #action>
        <div class="flex flex-wrap gap-3">
          <RouterLink to="/admin/posts/new" class="ui-btn ui-btn-primary text-sm">
            新建文章
          </RouterLink>
          <RouterLink to="/admin/comments" class="ui-btn ui-btn-secondary text-sm">
            去审核评论
          </RouterLink>
          <RouterLink to="/admin/settings" class="ui-btn ui-btn-secondary text-sm">
            站点设置
          </RouterLink>
        </div>
      </template>

      <div v-if="loading" class="rounded-[20px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-5 py-14 text-center text-sm text-[var(--text-3)]">
        正在加载仪表盘数据...
      </div>

      <div v-else-if="errorMessage" class="space-y-4">
        <p class="rounded-[18px] border border-[var(--line-danger-panel)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          {{ errorMessage }}
        </p>
        <button type="button" class="ui-btn ui-btn-primary text-sm" @click="loadDashboardOverview">
          重新加载
        </button>
      </div>

      <div v-else-if="overview" class="space-y-6">
        <div class="admin-card-grid cols-4">
          <article
            v-for="item in statCards"
            :key="item.label"
            :class="getStatCardClass(item.tone)"
          >
            <p class="text-sm text-[var(--text-3)]">{{ item.label }}</p>
            <p class="admin-overview-value">{{ item.value }}</p>
            <p class="mt-3 text-xs leading-6" :class="item.tone === 'warning' ? 'text-[var(--warning)]' : 'text-[var(--text-3)]'">
              {{ item.hint }}
            </p>
          </article>
        </div>

        <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <SectionCard title="最近文章" description="最近更新内容收成一个可快速浏览的工作列表。" variant="panel">
            <div v-if="recentPosts.length === 0" class="rounded-[20px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-5 py-12 text-center text-sm text-[var(--text-3)]">
              暂无最近文章数据。
            </div>
            <div v-else class="space-y-3">
              <article
                v-for="post in recentPosts"
                :key="post.id"
                class="admin-list-item"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="truncate text-base text-[var(--text-1)] font-semibold">{{ post.title }}</h3>
                      <span :class="getPostStatusClass(post.status)">
                        {{ getPostStatusLabel(post.status) }}
                      </span>
                    </div>
                    <p class="mt-3 text-xs text-[var(--text-3)] leading-6">
                      分类：{{ post.category?.name || '未分类' }} · 作者：{{ post.author.displayName }}
                    </p>
                  </div>
                  <div class="text-right text-xs text-[var(--text-4)]">
                    <p class="editor-mono">{{ formatDateTime(post.updatedAt) }}</p>
                    <p class="mt-2">评论数 {{ post.commentCount }}</p>
                  </div>
                </div>
                <div class="mt-4 flex flex-wrap gap-2">
                  <RouterLink :to="`/admin/posts/${post.id}/edit`" class="ui-btn ui-btn-primary min-h-[36px] px-4 text-xs">
                    编辑文章
                  </RouterLink>
                  <RouterLink :to="`/posts/${post.slug}`" target="_blank" class="ui-btn ui-btn-secondary min-h-[36px] px-4 text-xs">
                    前台预览
                  </RouterLink>
                </div>
              </article>
            </div>
          </SectionCard>

          <div class="admin-side-stack">
            <section class="admin-side-card border-[var(--line-accent-soft)] bg-[var(--bg-gradient-card-focus)]">
              <p class="editor-kicker">待处理事项</p>
              <h3 class="mt-3 text-[24px] text-[var(--text-1)] font-semibold leading-tight">
                {{ pendingCommentCount > 0 ? '评论审核需要优先处理' : '当前待处理事项较少' }}
              </h3>
              <p class="mt-4 text-sm text-[var(--text-3)] leading-7">
                {{ pendingCommentCount > 0
                  ? `目前有 ${pendingCommentCount} 条评论待审核，建议先完成审核，再处理内容更新。`
                  : '评论池暂时平稳，可以继续发布内容或检查设置项。' }}
              </p>
              <div class="mt-5 flex flex-wrap gap-3">
                <RouterLink to="/admin/comments" class="ui-btn ui-btn-ghost text-sm">
                  打开审核池
                </RouterLink>
                <RouterLink to="/admin/posts" class="ui-btn ui-btn-secondary text-sm">
                  打开文章管理
                </RouterLink>
              </div>
            </section>

            <SectionCard title="最近评论" description="把高频审核对象压缩到一个可快速扫描的列表中。" variant="panel">
              <div v-if="recentComments.length === 0" class="rounded-[20px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-5 py-12 text-center text-sm text-[var(--text-3)]">
                暂无最近评论数据。
              </div>
              <div v-else class="space-y-3">
                <article
                  v-for="comment in recentComments"
                  :key="comment.id"
                  class="admin-list-item"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <p class="text-sm text-[var(--text-1)] font-semibold">{{ comment.authorName }}</p>
                      <p class="mt-2 line-clamp-2 text-xs text-[var(--text-3)] leading-6">{{ comment.content }}</p>
                    </div>
                    <span :class="getCommentStatusClass(comment.status)">
                      {{ getCommentStatusLabel(comment.status) }}
                    </span>
                  </div>
                  <div class="mt-4 text-xs text-[var(--text-4)] leading-6">
                    <p>所属文章：{{ comment.post.title }}</p>
                    <p class="editor-mono">提交时间：{{ formatDateTime(comment.createdAt) }}</p>
                  </div>
                </article>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
