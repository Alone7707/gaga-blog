<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { createPublicComment, getPublicComments, getPublicPostDetail } from '../../api/public'
import type {
  PublicCommentItem,
  PublicCreateCommentPayload,
  PublicPostDetailResponse,
} from '../../types/public'
import { formatPublicDate } from '../../utils/public-post'

const route = useRoute()
const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

const loading = ref(false)
const errorMessage = ref('')
const currentPost = ref<PublicPostDetailResponse | null>(null)
const commentsLoading = ref(false)
const commentsErrorMessage = ref('')
const comments = ref<PublicCommentItem[]>([])
const submittingComment = ref(false)
const commentSuccessMessage = ref('')
const commentErrorMessage = ref('')
const replyingTo = ref<PublicCommentItem | null>(null)
const commentForm = reactive<Required<PublicCreateCommentPayload>>({
  authorName: '',
  authorEmail: '',
  authorWebsite: '',
  content: '',
  parentId: '',
})

// 详情页统一从路由参数取 slug，后续继续扩展 SEO 或相关文章时可直接复用。
const slug = computed(() => String(route.params.slug ?? ''))

// 优先使用服务端已生成的 HTML；若为空，则回退 Markdown 渲染结果。
const renderedContent = computed(() => {
  if (!currentPost.value) {
    return ''
  }

  if (currentPost.value.contentHtml?.trim()) {
    return currentPost.value.contentHtml
  }

  return markdown.render(currentPost.value.contentMarkdown)
})

const totalReplies = computed(() => comments.value.reduce((sum, item) => sum + item.replies.length, 0))
const totalCommentCount = computed(() => comments.value.length + totalReplies.value)
const authorDisplayName = computed(() => currentPost.value?.author?.displayName || '匿名作者')

async function loadPostDetail() {
  if (!slug.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    currentPost.value = await getPublicPostDetail(slug.value)
  }
  catch (error) {
    currentPost.value = null
    errorMessage.value = error instanceof Error ? error.message : '文章详情加载失败'
  }
  finally {
    loading.value = false
  }
}

async function loadComments() {
  if (!slug.value) {
    return
  }

  commentsLoading.value = true
  commentsErrorMessage.value = ''

  try {
    const response = await getPublicComments(slug.value)
    comments.value = response.list
  }
  catch (error) {
    comments.value = []
    commentsErrorMessage.value = error instanceof Error ? error.message : '评论列表加载失败'
  }
  finally {
    commentsLoading.value = false
  }
}

function resetCommentForm() {
  commentForm.authorName = ''
  commentForm.authorEmail = ''
  commentForm.authorWebsite = ''
  commentForm.content = ''
  commentForm.parentId = ''
  replyingTo.value = null
}

function startReply(comment: PublicCommentItem) {
  replyingTo.value = comment
  commentForm.parentId = comment.id
  commentSuccessMessage.value = ''
  commentErrorMessage.value = ''
}

function cancelReply() {
  commentForm.parentId = ''
  replyingTo.value = null
}

async function submitComment() {
  if (!slug.value) {
    return
  }

  submittingComment.value = true
  commentSuccessMessage.value = ''
  commentErrorMessage.value = ''

  try {
    const response = await createPublicComment(slug.value, {
      authorName: commentForm.authorName,
      authorEmail: commentForm.authorEmail,
      authorWebsite: commentForm.authorWebsite,
      content: commentForm.content,
      parentId: commentForm.parentId,
    })

    commentSuccessMessage.value = response.reviewMessage || '评论提交成功，等待管理员审核。'
    resetCommentForm()
    await loadComments()
  }
  catch (error) {
    commentErrorMessage.value = error instanceof Error ? error.message : '评论提交失败，请稍后重试'
  }
  finally {
    submittingComment.value = false
  }
}

async function loadPageData() {
  await Promise.all([
    loadPostDetail(),
    loadComments(),
  ])
}

onMounted(() => {
  loadPageData()
})

watch(
  () => route.params.slug,
  () => {
    resetCommentForm()
    commentSuccessMessage.value = ''
    commentErrorMessage.value = ''
    loadPageData()
  },
)
</script>

<template>
  <div class="space-y-6">
    <section v-if="loading" class="rounded-8 border border-white/10 bg-white/6 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-md">
      <p class="text-sm text-slate-300 leading-7">
        正在加载文章详情...
      </p>
    </section>

    <section v-else-if="errorMessage" class="rounded-8 border border-rose-400/25 bg-rose-400/8 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-md">
      <p class="text-xs uppercase tracking-[0.28em] text-rose-100/80">
        文章不存在
      </p>
      <h2 class="mt-4 text-3xl font-semibold text-white">
        未找到对应文章
      </h2>
      <p class="mt-4 max-w-2xl text-sm leading-7 text-rose-50/90">
        {{ errorMessage }}
      </p>
      <RouterLink
        to="/"
        class="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 px-4 py-2 text-sm text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-300/10"
      >
        回到首页
        <span aria-hidden="true">→</span>
      </RouterLink>
    </section>

    <template v-else-if="currentPost">
      <section
        class="overflow-hidden rounded-8 border border-white/10 bg-white/6 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-md"
      >
        <div class="border-b border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(15,23,42,0.2))] px-6 py-8 md:px-8 md:py-10">
          <p class="text-xs uppercase tracking-[0.28em] text-cyan-300/80">
            公开文章详情
          </p>
          <h2 class="mt-4 max-w-4xl text-3xl font-semibold leading-tight text-white md:text-4xl">
            {{ currentPost.title }}
          </h2>
          <p class="mt-4 max-w-3xl text-sm leading-7 text-slate-200 md:text-base">
            {{ currentPost.summary || '当前文章暂无摘要。' }}
          </p>

          <div class="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <RouterLink
              v-if="currentPost.category"
              :to="`/categories/${currentPost.category.slug}`"
              class="rounded-full border border-cyan-300/25 bg-cyan-300/8 px-3 py-1 text-cyan-200 transition hover:border-cyan-200"
            >
              {{ currentPost.category.name }}
            </RouterLink>
            <span>{{ formatPublicDate(currentPost.publishedAt ?? currentPost.createdAt) }}</span>
            <span class="text-white/20">•</span>
            <span>作者：{{ authorDisplayName }}</span>
          </div>

          <div class="mt-5 flex flex-wrap gap-2">
            <RouterLink
              v-for="tag in currentPost.tags"
              :key="tag.id"
              :to="`/tags/${tag.slug}`"
              class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-100"
            >
              # {{ tag.name }}
            </RouterLink>
          </div>
        </div>

        <div class="grid gap-6 px-6 py-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <article class="prose prose-invert max-w-none rounded-6 border border-white/8 bg-slate-950/35 p-6">
            <div v-html="renderedContent" />
          </article>

          <aside class="space-y-4">
            <section class="rounded-6 border border-white/8 bg-slate-950/35 p-5">
              <p class="text-xs uppercase tracking-[0.24em] text-cyan-300/80">
                阅读辅助
              </p>
              <h3 class="mt-3 text-lg font-semibold text-white">
                当前文章信息
              </h3>
              <ul class="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                <li>发布时间：{{ formatPublicDate(currentPost.publishedAt ?? currentPost.createdAt) }}</li>
                <li>作者：{{ authorDisplayName }}</li>
                <li>分类：{{ currentPost.category?.name || '未分类' }}</li>
                <li>标签数：{{ currentPost.tags.length }}</li>
              </ul>
            </section>

            <section class="rounded-6 border border-white/8 bg-slate-950/35 p-5">
              <p class="text-xs uppercase tracking-[0.24em] text-cyan-300/80">
                评论概览
              </p>
              <h3 class="mt-3 text-lg font-semibold text-white">
                前台评论区
              </h3>
              <ul class="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                <li>已展示评论：{{ totalCommentCount }}</li>
                <li>顶层评论：{{ comments.length }}</li>
                <li>回复数量：{{ totalReplies }}</li>
              </ul>
            </section>

            <section class="rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5">
              <p class="text-xs uppercase tracking-[0.24em] text-cyan-300/80">
                浏览扩展
              </p>
              <p class="mt-3 text-sm leading-7 text-slate-300">
                当前可继续从分类、标签、搜索与归档页扩展浏览路径，满足公开前台最小阅读闭环。
              </p>
            </section>

            <RouterLink
              to="/"
              class="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 px-4 py-2 text-sm text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-300/10"
            >
              返回文章列表
              <span aria-hidden="true">←</span>
            </RouterLink>
          </aside>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section class="rounded-8 border border-white/10 bg-white/6 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-md">
          <div class="flex flex-col gap-2 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p class="text-xs uppercase tracking-[0.24em] text-cyan-300/80">
                评论列表
              </p>
              <h3 class="mt-3 text-2xl text-white font-semibold">
                公开评论
              </h3>
            </div>
            <p class="text-sm text-slate-300">
              当前展示 {{ totalCommentCount }} 条已审核评论与回复
            </p>
          </div>

          <div v-if="commentsLoading" class="mt-5 rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-300 leading-7">
            正在加载评论列表...
          </div>

          <div v-else-if="commentsErrorMessage" class="mt-5 rounded-6 border border-rose-400/25 bg-rose-400/8 p-5 text-sm text-rose-100 leading-7">
            {{ commentsErrorMessage }}
          </div>

          <div v-else-if="!comments.length" class="mt-5 rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-300 leading-7">
            当前文章还没有公开展示的评论，欢迎成为第一个留言的人。
          </div>

          <div v-else class="mt-5 space-y-4">
            <article
              v-for="comment in comments"
              :key="comment.id"
              class="rounded-6 border border-white/8 bg-slate-950/25 p-5"
            >
              <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <a
                      v-if="comment.authorWebsite"
                      :href="comment.authorWebsite"
                      target="_blank"
                      rel="noreferrer"
                      class="text-base text-cyan-200 font-semibold transition hover:text-cyan-100"
                    >
                      {{ comment.authorName }}
                    </a>
                    <span v-else class="text-base text-white font-semibold">
                      {{ comment.authorName }}
                    </span>
                    <span class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                      {{ formatPublicDate(comment.createdAt) }}
                    </span>
                  </div>
                  <p class="mt-3 text-sm text-slate-200 leading-7 whitespace-pre-wrap">
                    {{ comment.content }}
                  </p>
                </div>

                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 px-4 py-2 text-sm text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-300/10"
                  @click="startReply(comment)"
                >
                  回复评论
                </button>
              </div>

              <div v-if="comment.replies.length" class="mt-4 space-y-3 border-t border-white/8 pt-4">
                <article
                  v-for="reply in comment.replies"
                  :key="reply.id"
                  class="rounded-5 border border-white/8 bg-slate-950/30 p-4"
                >
                  <div class="flex flex-wrap items-center gap-2">
                    <a
                      v-if="reply.authorWebsite"
                      :href="reply.authorWebsite"
                      target="_blank"
                      rel="noreferrer"
                      class="text-sm text-cyan-200 font-semibold transition hover:text-cyan-100"
                    >
                      {{ reply.authorName }}
                    </a>
                    <span v-else class="text-sm text-white font-semibold">
                      {{ reply.authorName }}
                    </span>
                    <span class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                      {{ formatPublicDate(reply.createdAt) }}
                    </span>
                  </div>
                  <p class="mt-3 text-sm text-slate-200 leading-7 whitespace-pre-wrap">
                    {{ reply.content }}
                  </p>
                </article>
              </div>
            </article>
          </div>
        </section>

        <section class="rounded-8 border border-white/10 bg-white/6 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-md">
          <p class="text-xs uppercase tracking-[0.24em] text-cyan-300/80">
            评论提交
          </p>
          <h3 class="mt-3 text-2xl text-white font-semibold">
            发表留言
          </h3>
          <p class="mt-3 text-sm text-slate-300 leading-7">
            提交后评论默认进入审核状态；昵称和内容为必填项，邮箱与个人网站可选。
          </p>

          <div v-if="replyingTo" class="mt-5 rounded-6 border border-cyan-300/25 bg-cyan-300/8 p-4 text-sm text-cyan-100 leading-7">
            <p>
              正在回复：<span class="font-semibold">{{ replyingTo.authorName }}</span>
            </p>
            <p class="mt-2 text-cyan-50/90 line-clamp-3">
              {{ replyingTo.content }}
            </p>
            <button
              type="button"
              class="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-200/40 px-4 py-2 text-xs transition hover:bg-cyan-300/10"
              @click="cancelReply"
            >
              取消回复
            </button>
          </div>

          <div v-if="commentSuccessMessage" class="mt-5 rounded-6 border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100 leading-7">
            {{ commentSuccessMessage }}
          </div>

          <div v-if="commentErrorMessage" class="mt-5 rounded-6 border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100 leading-7">
            {{ commentErrorMessage }}
          </div>

          <form class="mt-5 space-y-4" @submit.prevent="submitComment">
            <div>
              <label class="mb-2 block text-sm text-slate-200" for="comment-author-name">昵称 *</label>
              <input
                id="comment-author-name"
                v-model="commentForm.authorName"
                type="text"
                maxlength="50"
                required
                placeholder="请输入你的昵称"
                class="h-11 w-full rounded-4 border border-white/10 bg-slate-950/35 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              >
            </div>

            <div>
              <label class="mb-2 block text-sm text-slate-200" for="comment-author-email">邮箱</label>
              <input
                id="comment-author-email"
                v-model="commentForm.authorEmail"
                type="email"
                placeholder="name@example.com"
                class="h-11 w-full rounded-4 border border-white/10 bg-slate-950/35 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              >
            </div>

            <div>
              <label class="mb-2 block text-sm text-slate-200" for="comment-author-website">个人网站</label>
              <input
                id="comment-author-website"
                v-model="commentForm.authorWebsite"
                type="url"
                placeholder="https://example.com"
                class="h-11 w-full rounded-4 border border-white/10 bg-slate-950/35 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              >
            </div>

            <div>
              <label class="mb-2 block text-sm text-slate-200" for="comment-content">评论内容 *</label>
              <textarea
                id="comment-content"
                v-model="commentForm.content"
                required
                minlength="2"
                maxlength="1000"
                rows="6"
                placeholder="请输入评论内容，支持最小留言与回复场景。"
                class="w-full rounded-4 border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white leading-7 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                class="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-2.5 text-sm text-slate-950 font-semibold transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="submittingComment"
              >
                {{ submittingComment ? '提交中...' : '提交评论' }}
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="submittingComment"
                @click="resetCommentForm"
              >
                重置表单
              </button>
            </div>
          </form>
        </section>
      </section>
    </template>
  </div>
</template>
