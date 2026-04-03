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

// 详情页统一从路由参数取 slug，便于后续继续补 SEO 或相关文章能力。
const slug = computed(() => String(route.params.slug ?? ''))

// 优先使用服务端返回 HTML，回退时再用 Markdown 渲染。
const renderedContent = computed(() => {
  if (!currentPost.value) {
    return ''
  }

  const contentHtml = typeof currentPost.value.contentHtml === 'string'
    ? currentPost.value.contentHtml.trim()
    : ''

  if (contentHtml) {
    return contentHtml
  }

  const contentMarkdown = typeof currentPost.value.contentMarkdown === 'string'
    ? currentPost.value.contentMarkdown
    : ''

  return markdown.render(contentMarkdown)
})

const safeTags = computed(() => Array.isArray(currentPost.value?.tags) ? currentPost.value.tags : [])
const totalReplies = computed(() => comments.value.reduce((sum, item) => sum + (Array.isArray(item.replies) ? item.replies.length : 0), 0))
const totalCommentCount = computed(() => comments.value.length + totalReplies.value)
const authorDisplayName = computed(() => currentPost.value?.author?.displayName || '匿名作者')
const readingMinutes = computed(() => {
  const plainText = renderedContent.value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const wordCount = plainText.length
  return Math.max(3, Math.ceil(wordCount / 320))
})

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
  <div class="page-grid">
    <section v-if="loading" class="panel-surface rounded-[28px] p-8">
      <p class="text-sm text-slate-300 leading-7">
        正在加载文章详情...
      </p>
    </section>

    <section v-else-if="errorMessage" class="panel-surface rounded-[28px] border-rose-400/25 bg-[linear-gradient(180deg,rgba(80,20,30,0.34),rgba(11,21,35,0.92))] p-8">
      <p class="editor-kicker text-rose-200/80">
        文章不存在
      </p>
      <h2 class="mt-4 text-[34px] font-semibold text-white">
        未找到对应文章
      </h2>
      <p class="mt-4 max-w-2xl text-sm leading-7 text-rose-50/90">
        {{ errorMessage }}
      </p>
      <RouterLink to="/" class="ui-btn ui-btn-ghost mt-6 text-sm">
        回到首页
        <span aria-hidden="true">→</span>
      </RouterLink>
    </section>

    <template v-else-if="currentPost">
      <section class="panel-surface overflow-hidden rounded-[28px]">
        <div class="border-b border-white/8 bg-[linear-gradient(135deg,rgba(103,232,249,0.12),rgba(139,156,255,0.08),rgba(11,21,35,0.08))] px-6 py-8 md:px-8 md:py-10">
          <div class="max-w-5xl">
            <p class="editor-kicker">Article / Technical Longform</p>
            <h2 class="editor-title mt-4 text-[34px] leading-[1.12] md:text-[46px] lg:text-[54px]">
              {{ currentPost.title }}
            </h2>
            <p class="mt-5 max-w-3xl text-sm text-[var(--text-2)] leading-8 md:text-[17px]">
              {{ currentPost.summary || '当前文章暂无摘要。' }}
            </p>

            <div class="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <RouterLink
                v-if="currentPost.category"
                :to="`/categories/${currentPost.category.slug}`"
                class="ui-badge bg-cyan-300/10 text-cyan-100 border-cyan-300/22"
              >
                {{ currentPost.category.name }}
              </RouterLink>
              <span class="editor-mono">{{ formatPublicDate(currentPost.publishedAt ?? currentPost.createdAt) }}</span>
              <span class="text-white/20">•</span>
              <span>作者：{{ authorDisplayName }}</span>
              <span class="text-white/20">•</span>
              <span>{{ readingMinutes }} 分钟阅读</span>
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
              <RouterLink
                v-for="tag in safeTags"
                :key="tag.id"
                :to="`/tags/${tag.slug}`"
                class="ui-badge"
              >
                # {{ tag.name }}
              </RouterLink>
            </div>
          </div>
        </div>

        <div class="grid gap-6 px-6 py-6 md:px-8 lg:grid-cols-[minmax(0,780px)_minmax(260px,1fr)] lg:items-start lg:justify-between">
          <article class="article-prose rounded-[24px] border border-white/8 bg-[rgba(3,10,18,0.44)] p-6 md:p-8">
            <div v-html="renderedContent" />
          </article>

          <aside class="space-y-4 lg:sticky lg:top-6">
            <section class="rounded-[22px] border border-white/8 bg-black/18 p-5">
              <p class="editor-kicker">阅读信息</p>
              <h3 class="mt-3 text-[20px] text-white font-semibold">
                当前文章档案
              </h3>
              <ul class="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                <li>发布时间：{{ formatPublicDate(currentPost.publishedAt ?? currentPost.createdAt) }}</li>
                <li>作者：{{ authorDisplayName }}</li>
                <li>分类：{{ currentPost.category?.name || '未分类' }}</li>
                <li>标签数：{{ safeTags.length }}</li>
                <li>评论数：{{ totalCommentCount }}</li>
              </ul>
            </section>

            <section class="rounded-[22px] border border-white/8 bg-black/18 p-5">
              <p class="editor-kicker">继续浏览</p>
              <h3 class="mt-3 text-[20px] text-white font-semibold">
                站内延展路径
              </h3>
              <div class="mt-4 flex flex-wrap gap-2">
                <RouterLink to="/" class="ui-btn ui-btn-secondary min-h-[38px] px-4 text-sm">
                  返回首页
                </RouterLink>
                <RouterLink to="/search" class="ui-btn ui-btn-secondary min-h-[38px] px-4 text-sm">
                  继续搜索
                </RouterLink>
                <RouterLink
                  v-if="currentPost.category"
                  :to="`/categories/${currentPost.category.slug}`"
                  class="ui-btn ui-btn-secondary min-h-[38px] px-4 text-sm"
                >
                  同分类更多文章
                </RouterLink>
              </div>
            </section>

            <section class="rounded-[22px] border border-dashed border-white/10 bg-black/16 p-5">
              <p class="editor-kicker">讨论状态</p>
              <p class="mt-3 text-sm leading-7 text-slate-300">
                评论区已改成讨论模块，当前展示 {{ comments.length }} 条顶层评论和 {{ totalReplies }} 条回复。提交后默认进入审核流程。
              </p>
            </section>
          </aside>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <section class="panel-surface rounded-[28px] p-6 md:p-7">
          <div class="flex flex-col gap-2 border-b border-white/8 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p class="editor-kicker">Discussion</p>
              <h3 class="mt-3 text-[28px] text-white font-semibold">
                公开讨论区
              </h3>
            </div>
            <p class="text-sm text-slate-300">
              当前展示 {{ totalCommentCount }} 条已审核评论与回复
            </p>
          </div>

          <div v-if="commentsLoading" class="mt-5 rounded-[20px] border border-dashed border-white/10 bg-black/16 p-5 text-sm text-slate-300 leading-7">
            正在加载评论列表...
          </div>

          <div v-else-if="commentsErrorMessage" class="mt-5 rounded-[20px] border border-rose-400/25 bg-rose-400/8 p-5 text-sm text-rose-100 leading-7">
            {{ commentsErrorMessage }}
          </div>

          <div v-else-if="!comments.length" class="mt-5 rounded-[20px] border border-dashed border-white/10 bg-black/16 p-5 text-sm text-slate-300 leading-7">
            当前文章还没有公开展示的评论，欢迎成为第一个留言的人。
          </div>

          <div v-else class="mt-5 space-y-4">
            <article
              v-for="comment in comments"
              :key="comment.id"
              class="rounded-[22px] border border-white/8 bg-black/16 p-5"
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
                    <span class="ui-badge editor-mono">
                      {{ formatPublicDate(comment.createdAt) }}
                    </span>
                  </div>
                  <p class="mt-3 text-sm text-slate-200 leading-7 whitespace-pre-wrap">
                    {{ comment.content }}
                  </p>
                </div>

                <button type="button" class="ui-btn ui-btn-secondary min-h-[38px] px-4 text-sm" @click="startReply(comment)">
                  回复评论
                </button>
              </div>

              <div v-if="Array.isArray(comment.replies) && comment.replies.length" class="mt-4 space-y-3 border-t border-white/8 pt-4">
                <article
                  v-for="reply in comment.replies"
                  :key="reply.id"
                  class="rounded-[18px] border border-white/8 bg-white/4 p-4"
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
                    <span class="ui-badge editor-mono">
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

        <section class="panel-surface rounded-[28px] p-6 md:p-7 xl:sticky xl:top-6">
          <p class="editor-kicker">Comment Form</p>
          <h3 class="mt-3 text-[28px] text-white font-semibold">
            发表留言
          </h3>
          <p class="mt-3 text-sm text-slate-300 leading-7">
            提交后评论默认进入审核状态；昵称和内容为必填项，邮箱与个人网站可选。
          </p>

          <div v-if="replyingTo" class="mt-5 rounded-[20px] border border-cyan-300/25 bg-cyan-300/8 p-4 text-sm text-cyan-100 leading-7">
            <p>
              正在回复：<span class="font-semibold">{{ replyingTo.authorName }}</span>
            </p>
            <p class="mt-2 text-cyan-50/90 line-clamp-3">
              {{ replyingTo.content }}
            </p>
            <button type="button" class="ui-btn ui-btn-secondary mt-3 min-h-[36px] px-4 text-xs" @click="cancelReply">
              取消回复
            </button>
          </div>

          <div v-if="commentSuccessMessage" class="mt-5 rounded-[20px] border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100 leading-7">
            {{ commentSuccessMessage }}
          </div>

          <div v-if="commentErrorMessage" class="mt-5 rounded-[20px] border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100 leading-7">
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
                class="ui-input"
              >
            </div>

            <div>
              <label class="mb-2 block text-sm text-slate-200" for="comment-author-email">邮箱</label>
              <input
                id="comment-author-email"
                v-model="commentForm.authorEmail"
                type="email"
                placeholder="name@example.com"
                class="ui-input"
              >
            </div>

            <div>
              <label class="mb-2 block text-sm text-slate-200" for="comment-author-website">个人网站</label>
              <input
                id="comment-author-website"
                v-model="commentForm.authorWebsite"
                type="url"
                placeholder="https://example.com"
                class="ui-input"
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
                class="ui-textarea"
              />
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <button type="submit" class="ui-btn ui-btn-primary text-sm" :disabled="submittingComment">
                {{ submittingComment ? '提交中...' : '提交评论' }}
              </button>
              <button type="button" class="ui-btn ui-btn-secondary text-sm" :disabled="submittingComment" @click="resetCommentForm">
                重置表单
              </button>
            </div>
          </form>
        </section>
      </section>
    </template>
  </div>
</template>
