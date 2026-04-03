<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  archiveAdminPost,
  createAdminPost,
  getAdminPostDetail,
  publishAdminPost,
  unpublishAdminPost,
  updateAdminPost,
} from '../../api/posts'
import { getAdminCategories, getAdminTags } from '../../api/taxonomy'
import SectionCard from '../../components/common/SectionCard.vue'
import type { AdminCategoryItem, AdminTagItem } from '../../types/taxonomy'
import type { AdminPostDetail, AdminPostEditorPayload, PostStatus } from '../../types/post'

interface StatusOption {
  label: string
  value: PostStatus
  hint: string
}

interface EditorFormState {
  title: string
  slug: string
  summary: string
  contentMarkdown: string
  status: PostStatus
  categoryId: string
  tagIds: string[]
}

type PostActionType = 'publish' | 'unpublish' | 'archive'

const route = useRoute()
const router = useRouter()

const statusOptions: StatusOption[] = [
  { label: '草稿', value: 'DRAFT', hint: '适合未完成内容，默认不会对外展示。' },
  { label: '已发布', value: 'PUBLISHED', hint: '发布后会进入公开站点可见链路。' },
  { label: '已归档', value: 'ARCHIVED', hint: '归档后保留内容，但不再作为正常发布内容。' },
]

const loading = ref(false)
const saving = ref(false)
const actionLoading = ref<PostActionType | ''>('')
const taxonomyLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const taxonomyMessage = ref('')
const postDetail = ref<AdminPostDetail | null>(null)
const lastSavedAt = ref<string | null>(null)
const categories = ref<AdminCategoryItem[]>([])
const tags = ref<AdminTagItem[]>([])

const form = reactive<EditorFormState>({
  title: '',
  slug: '',
  summary: '',
  contentMarkdown: '',
  status: 'DRAFT',
  categoryId: '',
  tagIds: [],
})

const isEditMode = computed(() => typeof route.params.id === 'string' && route.params.id.length > 0)
const pageTitle = computed(() => (isEditMode.value ? '编辑文章' : '新建文章'))
const pageDescription = computed(() => (
  isEditMode.value
    ? '已接入管理员文章详情、更新与独立发布动作接口，并补齐真实分类、标签选择。'
    : '已接入管理员文章创建接口，可直接完成最小可用发文链路。'
))
const currentStatusMeta = computed(() => statusOptions.find((item) => item.value === form.status) ?? statusOptions[0])
const previewSummary = computed(() => form.summary.trim() || '未填写摘要时，这里展示默认提示，避免右侧信息卡为空。')
const previewSlug = computed(() => form.slug.trim() || '未填写时由后端基于标题生成 slug')
const wordCount = computed(() => form.contentMarkdown.trim().length)
const selectedCategory = computed(() => categories.value.find((item) => item.id === form.categoryId) ?? null)
const selectedTags = computed(() => tags.value.filter((item) => form.tagIds.includes(item.id)))
const hasTaxonomyData = computed(() => categories.value.length > 0 || tags.value.length > 0)
const canRunPostActions = computed(() => isEditMode.value && !!postDetail.value?.id)
const canPublish = computed(() => canRunPostActions.value && form.status !== 'PUBLISHED')
const canUnpublish = computed(() => canRunPostActions.value && form.status === 'PUBLISHED')
const canArchive = computed(() => canRunPostActions.value && form.status !== 'ARCHIVED')
const actionHint = computed(() => {
  if (!isEditMode.value) {
    return '请先创建文章，保存成功后才能使用发布、下线、归档动作。'
  }

  if (!postDetail.value?.id) {
    return '文章详情加载完成后可执行发布动作。'
  }

  return '状态切换已改为独立动作接口，避免保存表单时混入发布语义。'
})

onMounted(() => {
  void loadTaxonomyOptions()

  if (isEditMode.value) {
    void loadPostDetail(route.params.id as string)
  }
})

// 编辑模式优先回填真实文章详情；新建模式直接展示可编辑表单。
async function loadPostDetail(id: string) {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await getAdminPostDetail(id)
    postDetail.value = response.post
    patchForm(response.post)
  }
  catch (error) {
    errorMessage.value = resolveErrorMessage(error, '文章详情加载失败，请稍后重试')
  }
  finally {
    loading.value = false
  }
}

// 分类和标签统一预加载，保证编辑页选择项与后台管理页使用同一批数据。
async function loadTaxonomyOptions() {
  taxonomyLoading.value = true
  taxonomyMessage.value = ''

  try {
    const [categoryResponse, tagResponse] = await Promise.all([
      getAdminCategories({ page: 1, pageSize: 100, sortBy: 'sortOrder', sortOrder: 'asc' }),
      getAdminTags({ page: 1, pageSize: 100 }),
    ])

    categories.value = Array.isArray(categoryResponse.list) ? categoryResponse.list : []
    tags.value = Array.isArray(tagResponse.list) ? tagResponse.list : []
  }
  catch (error) {
    categories.value = []
    tags.value = []
    taxonomyMessage.value = resolveErrorMessage(error, '分类与标签加载失败，请先检查后台接口联调状态')
  }
  finally {
    taxonomyLoading.value = false
  }
}

// 将接口返回值回填到表单，保证编辑模式可以直接修改再保存。
function patchForm(post: AdminPostDetail) {
  form.title = post.title ?? ''
  form.slug = post.slug ?? ''
  form.summary = post.summary ?? ''
  form.contentMarkdown = post.contentMarkdown ?? ''
  form.status = post.status ?? 'DRAFT'
  form.categoryId = post.category?.id ?? ''
  form.tagIds = Array.isArray(post.tags) ? post.tags.map((item) => item.id) : []
}

// 保存前先做最小表单校验，避免明显无效请求打到后端。
function validateForm() {
  if (!form.title.trim()) {
    return '请输入文章标题'
  }

  if (form.title.trim().length > 150) {
    return '标题长度不能超过 150 个字符'
  }

  if (form.slug.trim().length > 150) {
    return 'slug 长度不能超过 150 个字符'
  }

  if (form.summary.trim().length > 500) {
    return '摘要长度不能超过 500 个字符'
  }

  if (!form.contentMarkdown.trim()) {
    return '请输入正文内容'
  }

  return ''
}

// 将表单状态整理为后端文章 DTO，并真实带上分类与标签选择结果。
function buildPayload(): AdminPostEditorPayload {
  return {
    title: form.title,
    slug: form.slug,
    summary: form.summary,
    contentMarkdown: form.contentMarkdown,
    visibility: 'PUBLIC',
    categoryId: form.categoryId || undefined,
    tagIds: form.tagIds,
  }
}

function handleTagToggle(tagId: string) {
  if (form.tagIds.includes(tagId)) {
    form.tagIds = form.tagIds.filter((item) => item !== tagId)
    return
  }

  form.tagIds = [...form.tagIds, tagId]
}

// 保存逻辑同时覆盖新建与编辑场景，编辑时只保存内容，不再顺手切状态。
async function handleSubmit() {
  const validationMessage = validateForm()

  if (validationMessage) {
    errorMessage.value = validationMessage
    successMessage.value = ''
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const payload = buildPayload()
    const response = isEditMode.value
      ? await updateAdminPost(route.params.id as string, payload)
      : await createAdminPost(payload)

    postDetail.value = response.post
    patchForm(response.post)
    lastSavedAt.value = response.post.updatedAt ?? null

    if (isEditMode.value) {
      successMessage.value = '文章内容保存成功'
      return
    }

    successMessage.value = '文章创建成功，正在跳转到编辑页...'
    window.setTimeout(() => {
      void router.push(`/admin/posts/${response.post.id}/edit`)
    }, 600)
  }
  catch (error) {
    errorMessage.value = resolveErrorMessage(error, '文章保存失败，请稍后重试')
  }
  finally {
    saving.value = false
  }
}

async function handlePostAction(action: PostActionType) {
  if (!postDetail.value?.id || !isEditMode.value) {
    errorMessage.value = '请先创建并加载文章详情后再执行状态动作'
    successMessage.value = ''
    return
  }

  if (action === 'publish') {
    const validationMessage = validateForm()

    if (validationMessage) {
      errorMessage.value = `发布前请先修正内容：${validationMessage}`
      successMessage.value = ''
      return
    }
  }

  actionLoading.value = action
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (action === 'publish') {
      await updateAdminPost(postDetail.value.id, buildPayload())
    }

    const response = action === 'publish'
      ? await publishAdminPost(postDetail.value.id)
      : action === 'unpublish'
        ? await unpublishAdminPost(postDetail.value.id)
        : await archiveAdminPost(postDetail.value.id)

    postDetail.value = response.post
    patchForm(response.post)
    lastSavedAt.value = response.post.updatedAt ?? null
    successMessage.value = getActionSuccessMessage(action, response.post.status)
  }
  catch (error) {
    errorMessage.value = resolveErrorMessage(error, getActionFallbackMessage(action))
  }
  finally {
    actionLoading.value = ''
  }
}

function getActionSuccessMessage(action: PostActionType, status: PostStatus) {
  if (action === 'publish') {
    return status === 'PUBLISHED' ? '文章已发布' : '发布动作已完成'
  }

  if (action === 'unpublish') {
    return status === 'DRAFT' ? '文章已下线并恢复为草稿' : '下线动作已完成'
  }

  return status === 'ARCHIVED' ? '文章已归档' : '归档动作已完成'
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

// 返回列表时不做销毁操作，保持当前页面逻辑简单可控。
async function handleBack() {
  await router.push('/admin/posts')
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
    <SectionCard :title="pageTitle" :description="pageDescription" variant="hero" size="lg">
      <template #action>
        <div class="flex flex-wrap items-center justify-end gap-3">
          <button type="button" class="ui-btn ui-btn-secondary min-h-[40px] px-4 text-sm" @click="handleBack">返回列表</button>
          <button type="button" class="ui-btn ui-btn-primary min-h-[40px] px-4 text-sm" :disabled="saving || loading || actionLoading !== ''" @click="handleSubmit">{{ saving ? '正在保存...' : (isEditMode ? '保存内容' : '创建文章') }}</button>
        </div>
      </template>

      <div v-if="loading" class="rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-5 py-14 text-center text-sm text-[var(--text-3)]">正在加载文章详情...</div>

      <div v-else class="space-y-5">
        <div v-if="errorMessage" class="rounded-[18px] border border-[rgba(240,68,56,0.18)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">{{ errorMessage }}</div>
        <div v-if="successMessage" class="rounded-[18px] border border-[rgba(18,183,106,0.18)] bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)]">{{ successMessage }}</div>

        <div class="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
          <div class="admin-form-grid">
            <section class="admin-form-section">
              <div class="admin-form-section-header">
                <div>
                  <p class="editor-kicker">Content Form</p>
                  <h3 class="mt-3 text-lg text-[var(--text-1)] font-semibold">基础信息</h3>
                </div>
                <span class="ui-badge ui-badge-status-success">工作区主表单</span>
              </div>
              <div class="admin-form-section-body grid gap-4 md:grid-cols-2">
                <label class="block md:col-span-2">
                  <span class="mb-2 block text-sm text-[var(--text-2)]">标题</span>
                  <input v-model="form.title" type="text" maxlength="150" placeholder="请输入文章标题" class="ui-input">
                </label>
                <label class="block md:col-span-2">
                  <span class="mb-2 block text-sm text-[var(--text-2)]">Slug</span>
                  <input v-model="form.slug" type="text" maxlength="150" placeholder="可选，留空时由后端自动生成" class="ui-input">
                </label>
                <label class="block md:col-span-2">
                  <span class="mb-2 block text-sm text-[var(--text-2)]">摘要</span>
                  <textarea v-model="form.summary" rows="4" maxlength="500" placeholder="请输入文章摘要，用于列表和详情摘要展示" class="ui-textarea" />
                </label>
                <label class="block md:col-span-2">
                  <span class="mb-2 block text-sm text-[var(--text-2)]">正文（Markdown）</span>
                  <textarea v-model="form.contentMarkdown" rows="18" placeholder="请输入 Markdown 正文内容" class="ui-textarea min-h-[460px] font-mono text-sm leading-7" />
                </label>
              </div>
            </section>

            <section class="admin-form-section">
              <div class="admin-form-section-header">
                <div>
                  <p class="editor-kicker">Taxonomy</p>
                  <h3 class="mt-3 text-lg text-[var(--text-1)] font-semibold">分类与标签</h3>
                  <p class="mt-2 text-sm text-[var(--text-3)]">已从真实接口加载分类与标签数据，直接写入 categoryId 与 tagIds。</p>
                </div>
                <button type="button" class="ui-btn ui-btn-secondary min-h-[36px] px-3 text-xs" :disabled="taxonomyLoading" @click="loadTaxonomyOptions">{{ taxonomyLoading ? '刷新中...' : '刷新选项' }}</button>
              </div>

              <div class="admin-form-section-body">
                <div v-if="taxonomyMessage" class="mb-4 rounded-[18px] border border-[rgba(247,144,9,0.2)] bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--warning)]">{{ taxonomyMessage }}</div>

                <div class="grid gap-4 md:grid-cols-2">
                  <label class="block">
                    <span class="mb-2 block text-sm text-[var(--text-2)]">分类</span>
                    <select v-model="form.categoryId" class="ui-select">
                      <option value="">暂不设置分类</option>
                      <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}（{{ category.postCount }}）</option>
                    </select>
                  </label>
                  <div class="rounded-[18px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4 text-sm text-[var(--text-3)] leading-7">
                    <p class="text-xs text-[var(--text-4)]">当前分类</p>
                    <p class="mt-3 text-[var(--text-1)] font-medium">{{ selectedCategory?.name || '未设置分类' }}</p>
                    <p class="mt-2 text-xs text-[var(--text-3)]">{{ selectedCategory?.description || '分类说明会在这里展示，便于编辑时快速确认。' }}</p>
                  </div>
                  <div class="md:col-span-2">
                    <div class="mb-2 flex items-center justify-between gap-3">
                      <span class="block text-sm text-[var(--text-2)]">标签</span>
                      <span class="text-xs text-[var(--text-4)]">已选 {{ form.tagIds.length }} 个</span>
                    </div>
                    <div v-if="!hasTaxonomyData && !taxonomyLoading" class="rounded-[18px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-4 py-5 text-sm text-[var(--text-3)]">暂无可选分类和标签，请先前往后台分类/标签管理页创建数据。</div>
                    <div v-else class="flex flex-wrap gap-3 rounded-[18px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4">
                      <button v-for="tag in tags" :key="tag.id" type="button" class="rounded-full border px-3 py-2 text-xs font-medium transition" :class="form.tagIds.includes(tag.id) ? 'border-[rgba(76,139,245,0.24)] bg-[#e8f1ff] text-[#235fc4]' : 'border-[var(--line-soft)] bg-white text-[var(--text-3)] hover:border-[rgba(76,139,245,0.26)] hover:text-[var(--text-1)]'" @click="handleTagToggle(tag.id)">{{ tag.name }}</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div class="admin-side-stack">
            <section class="admin-side-card border-[rgba(76,139,245,0.18)] bg-[#eef4ff]">
              <p class="text-xs text-[#235fc4]">当前状态</p>
              <p class="mt-3 text-base text-[var(--text-1)] font-semibold">{{ currentStatusMeta.label }}</p>
              <p class="mt-2 text-sm text-[var(--text-2)] leading-6">{{ currentStatusMeta.hint }}</p>
            </section>

            <section class="admin-side-card">
              <p class="text-sm font-medium text-[var(--text-1)]">状态动作</p>
              <p class="mt-2 text-sm text-[var(--text-3)] leading-7">{{ actionHint }}</p>
              <div class="mt-4 grid gap-3">
                <button type="button" class="ui-btn min-h-[42px] w-full bg-[#17b26a] px-4 text-sm text-white font-semibold transition hover:bg-[#109d5d] disabled:cursor-not-allowed disabled:opacity-60" :disabled="!canPublish || saving || loading || actionLoading !== ''" @click="handlePostAction('publish')">
                  {{ actionLoading === 'publish' ? '正在发布...' : '发布文章' }}
                </button>
                <button type="button" class="ui-btn ui-btn-secondary min-h-[42px] w-full px-4 text-sm" :disabled="!canUnpublish || saving || loading || actionLoading !== ''" @click="handlePostAction('unpublish')">
                  {{ actionLoading === 'unpublish' ? '正在下线...' : '下线为草稿' }}
                </button>
                <button type="button" class="ui-btn min-h-[42px] w-full border border-[rgba(247,144,9,0.26)] bg-[#fff3e4] px-4 text-sm text-[#b26700] font-semibold transition hover:bg-[#ffe9ce] disabled:cursor-not-allowed disabled:opacity-60" :disabled="!canArchive || saving || loading || actionLoading !== ''" @click="handlePostAction('archive')">
                  {{ actionLoading === 'archive' ? '正在归档...' : '归档文章' }}
                </button>
              </div>
            </section>

            <section class="admin-side-card">
              <p class="text-sm font-medium text-[var(--text-1)]">发布信息</p>
              <div class="mt-4 grid gap-3 text-sm text-[var(--text-3)]">
                <div class="rounded-[18px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4">
                  <p class="text-xs text-[var(--text-4)]">文章路径</p>
                  <p class="mt-3 break-all text-sm text-[var(--text-1)] leading-6">/{{ previewSlug }}</p>
                </div>
                <div class="rounded-[18px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4">
                  <p class="text-xs text-[var(--text-4)]">摘要预览</p>
                  <p class="mt-3 text-sm text-[var(--text-2)] leading-7">{{ previewSummary }}</p>
                </div>
                <div class="rounded-[18px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4">
                  <p class="text-xs text-[var(--text-4)]">选中标签</p>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <span v-if="selectedTags.length === 0" class="text-sm text-[var(--text-4)]">未设置标签</span>
                    <span v-for="tag in selectedTags" :key="tag.id" class="rounded-full border border-[rgba(76,139,245,0.2)] bg-[#eef4ff] px-3 py-1 text-xs font-medium text-[#235fc4]">{{ tag.name }}</span>
                  </div>
                </div>
                <div class="grid gap-3">
                  <div class="rounded-[18px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4">
                    <p class="text-xs text-[var(--text-4)]">正文长度</p>
                    <p class="mt-3 text-sm text-[var(--text-1)]">{{ wordCount }} 字符</p>
                  </div>
                  <div class="rounded-[18px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4">
                    <p class="text-xs text-[var(--text-4)]">最近保存</p>
                    <p class="mt-3 text-sm text-[var(--text-1)]">{{ formatDateTime(lastSavedAt || postDetail?.updatedAt || null) }}</p>
                  </div>
                  <div class="rounded-[18px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4">
                    <p class="text-xs text-[var(--text-4)]">发布时间</p>
                    <p class="mt-3 text-sm text-[var(--text-1)]">{{ formatDateTime(postDetail?.publishedAt || null) }}</p>
                  </div>
                </div>
              </div>
            </section>

            <section class="admin-side-card border-dashed border-[rgba(76,139,245,0.22)] bg-[#f5f9ff] text-sm text-[var(--text-2)] leading-7">
              <h3 class="text-base text-[var(--text-1)] font-semibold">联调说明</h3>
              <ul class="mt-4 space-y-2">
                <li>• 新建走 POST /api/admin/posts，编辑走 PATCH /api/admin/posts/:id。</li>
                <li>• 发布 / 下线 / 归档已切到 PATCH /api/admin/posts/:id/publish|unpublish|archive。</li>
                <li>• 发布前会先保存当前表单内容，再进入后端发布校验与发布时间处理链路。</li>
                <li>• 分类选项来自 GET /api/admin/categories，标签选项来自 GET /api/admin/tags。</li>
                <li>• 若后端返回字段校验错误，页面会直接展示接口 message，便于快速定位联调问题。</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
