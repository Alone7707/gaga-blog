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
    },
    {
      label: '分类数量',
      value: String(overview.value.stats.categories.total),
      hint: '用于前台内容归档与导航结构',
    },
    {
      label: '标签数量',
      value: String(overview.value.stats.tags.total),
      hint: '支撑文章标签检索与聚合页',
    },
    {
      label: '待审核评论',
      value: String(overview.value.stats.comments.pending ?? 0),
      hint: `评论总数 ${overview.value.stats.comments.total} / 已通过 ${overview.value.stats.comments.approved ?? 0}`,
    },
  ]
})

const recentPosts = computed(() => overview.value?.recentPosts ?? [])
const recentComments = computed(() => overview.value?.recentComments ?? [])

onMounted(() => {
  void loadDashboardOverview()
})

// 拉取后台仪表盘概览数据，优先走真实接口，不做本地伪造。
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
    return 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
  }

  if (status === 'ARCHIVED') {
    return 'border-amber-400/25 bg-amber-500/10 text-amber-200'
  }

  return 'border-slate-400/20 bg-slate-500/10 text-slate-200'
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
  <div class="space-y-6">
    <SectionCard title="后台仪表盘" description="当前接入后端基础统计接口，先满足后台首页概览、最近文章与最近评论的最小可交付能力。">
      <template #action>
        <div class="flex flex-wrap gap-3">
          <RouterLink
            to="/admin/posts/new"
            class="inline-flex items-center rounded-full bg-cyan-400 px-4 py-2 text-sm text-slate-950 font-semibold transition hover:bg-cyan-300"
          >
            新建文章
          </RouterLink>
          <RouterLink
            to="/admin/settings"
            class="inline-flex items-center rounded-full border border-white/12 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-300/30 hover:text-white"
          >
            站点设置
          </RouterLink>
        </div>
      </template>

      <div v-if="loading" class="rounded-6 border border-white/8 bg-slate-950/35 px-5 py-14 text-center text-sm text-slate-300">
        正在加载仪表盘数据...
      </div>

      <div v-else-if="errorMessage" class="space-y-4">
        <p class="rounded-4 border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {{ errorMessage }}
        </p>
        <button
          type="button"
          class="rounded-full bg-cyan-400 px-4 py-2 text-sm text-slate-950 font-semibold transition hover:bg-cyan-300"
          @click="loadDashboardOverview"
        >
          重新加载
        </button>
      </div>

      <div v-else-if="overview" class="space-y-6">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="item in statCards"
            :key="item.label"
            class="rounded-6 border border-white/10 bg-slate-950/35 p-5"
          >
            <p class="text-sm text-slate-400">{{ item.label }}</p>
            <p class="mt-4 text-4xl font-semibold text-white">{{ item.value }}</p>
            <p class="mt-3 text-xs text-cyan-200/80">{{ item.hint }}</p>
          </div>
        </div>

        <div class="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <SectionCard title="最近文章" description="用于管理员快速确认近期内容状态与编辑入口。">
            <div v-if="recentPosts.length === 0" class="rounded-6 border border-white/8 bg-slate-950/30 px-5 py-12 text-center text-sm text-slate-300">
              暂无最近文章数据。
            </div>
            <div v-else class="space-y-3">
              <article
                v-for="post in recentPosts"
                :key="post.id"
                class="rounded-6 border border-white/8 bg-slate-950/30 p-4"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <h3 class="truncate text-base text-white font-medium">{{ post.title }}</h3>
                    <p class="mt-2 text-xs text-slate-400">
                      分类：{{ post.category?.name || '未分类' }} · 作者：{{ post.author.displayName }}
                    </p>
                  </div>
                  <span class="inline-flex rounded-full border px-3 py-1 text-xs" :class="getPostStatusClass(post.status)">
                    {{ getPostStatusLabel(post.status) }}
                  </span>
                </div>
                <div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <span>更新时间：{{ formatDateTime(post.updatedAt) }}</span>
                  <span>评论数：{{ post.commentCount }}</span>
                </div>
                <div class="mt-4 flex flex-wrap gap-2">
                  <RouterLink
                    :to="`/admin/posts/${post.id}/edit`"
                    class="rounded-full border border-white/12 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-300/40 hover:text-white"
                  >
                    编辑文章
                  </RouterLink>
                  <RouterLink
                    :to="`/posts/${post.slug}`"
                    target="_blank"
                    class="rounded-full border border-white/12 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-300/40 hover:text-white"
                  >
                    前台预览
                  </RouterLink>
                </div>
              </article>
            </div>
          </SectionCard>

          <SectionCard title="最近评论" description="帮助管理员确认待审核评论与最近互动情况。">
            <div v-if="recentComments.length === 0" class="rounded-6 border border-white/8 bg-slate-950/30 px-5 py-12 text-center text-sm text-slate-300">
              暂无最近评论数据。
            </div>
            <div v-else class="space-y-3">
              <article
                v-for="comment in recentComments"
                :key="comment.id"
                class="rounded-6 border border-white/8 bg-slate-950/30 p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <p class="text-sm text-white font-medium">{{ comment.authorName }}</p>
                    <p class="mt-2 line-clamp-2 text-xs text-slate-400 leading-6">{{ comment.content }}</p>
                  </div>
                  <span class="inline-flex rounded-full border px-3 py-1 text-xs" :class="getCommentStatusClass(comment.status)">
                    {{ getCommentStatusLabel(comment.status) }}
                  </span>
                </div>
                <div class="mt-4 text-xs text-slate-400 leading-6">
                  <p>所属文章：{{ comment.post.title }}</p>
                  <p>提交时间：{{ formatDateTime(comment.createdAt) }}</p>
                </div>
              </article>
            </div>
          </SectionCard>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
