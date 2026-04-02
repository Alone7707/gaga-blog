<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { createAdminPost, getAdminPostDetail, updateAdminPost } from '../../api/posts'
import SectionCard from '../../components/common/SectionCard.vue'
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
}

const route = useRoute()
const router = useRouter()

const statusOptions: StatusOption[] = [
  { label: '草稿', value: 'DRAFT', hint: '适合未完成内容，默认不会对外展示。' },
  { label: '已发布', value: 'PUBLISHED', hint: '保存时按已发布状态提交，便于直接联调线上展示链路。' },
  { label: '已归档', value: 'ARCHIVED', hint: '保留内容但不作为正常发布内容使用。' },
]

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const postDetail = ref<AdminPostDetail | null>(null)
const lastSavedAt = ref<string | null>(null)

const form = reactive<EditorFormState>({
  title: '',
  slug: '',
  summary: '',
  contentMarkdown: '',
  status: 'DRAFT',
})

const isEditMode = computed(() => typeof route.params.id === 'string' && route.params.id.length > 0)
const pageTitle = computed(() => (isEditMode.value ? '编辑文章' : '新建文章'))
const pageDescription = computed(() => (
  isEditMode.value
    ? '已接入管理员文章详情与更新接口，可直接回填并保存基础内容。'
    : '已接入管理员文章创建接口，可直接完成最小可用发文链路。'
))
const currentStatusMeta = computed(() => statusOptions.find((item) => item.value === form.status) ?? statusOptions[0])
const previewSummary = computed(() => form.summary.trim() || '未填写摘要时，这里展示默认提示，避免右侧信息卡为空。')
const previewSlug = computed(() => form.slug.trim() || '未填写时由后端基于标题生成 slug')
const wordCount = computed(() => form.contentMarkdown.trim().length)

onMounted(() => {
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

// 将接口返回值回填到表单，保证编辑模式可以直接修改再保存。
function patchForm(post: AdminPostDetail) {
  form.title = post.title
  form.slug = post.slug
  form.summary = post.summary ?? ''
  form.contentMarkdown = post.contentMarkdown
  form.status = post.status
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

// 将表单状态整理为后端文章 DTO，只提交当前模块真正需要的字段。
function buildPayload(): AdminPostEditorPayload {
  return {
    title: form.title,
    slug: form.slug,
    summary: form.summary,
    contentMarkdown: form.contentMarkdown,
    status: form.status,
    visibility: 'PUBLIC',
    categoryId: undefined,
    tagIds: [],
  }
}

// 保存逻辑同时覆盖新建与编辑场景，成功后统一跳回文章管理页。
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
    lastSavedAt.value = response.post.updatedAt
    successMessage.value = isEditMode.value ? '文章保存成功，正在返回文章管理页...' : '文章创建成功，正在返回文章管理页...'

    window.setTimeout(() => {
      void router.push('/admin/posts')
    }, 600)
  }
  catch (error) {
    errorMessage.value = resolveErrorMessage(error, '文章保存失败，请稍后重试')
  }
  finally {
    saving.value = false
  }
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
  <div class="space-y-6">
    <SectionCard :title="pageTitle" :description="pageDescription">
      <template #action>
        <div class="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            class="rounded-full border border-white/12 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:text-white"
            @click="handleBack"
          >
            返回列表
          </button>
          <button
            type="button"
            class="rounded-full bg-cyan-400 px-4 py-2 text-sm text-slate-950 font-semibold transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="saving || loading"
            @click="handleSubmit"
          >
            {{ saving ? '正在保存...' : (isEditMode ? '保存修改' : '创建文章') }}
          </button>
        </div>
      </template>

      <div v-if="loading" class="rounded-6 border border-white/8 bg-slate-950/35 px-5 py-14 text-center text-sm text-slate-300">
        正在加载文章详情...
      </div>

      <div v-else class="space-y-5">
        <div v-if="errorMessage" class="rounded-6 border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="rounded-6 border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {{ successMessage }}
        </div>

        <div class="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_340px]">
          <div class="space-y-6">
            <section class="rounded-6 border border-white/8 bg-slate-950/35 p-5">
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-lg text-white font-semibold">基础信息</h3>
                <span class="rounded-full border border-cyan-300/20 px-3 py-1 text-xs text-cyan-200">
                  最小可用正式版
                </span>
              </div>

              <div class="mt-5 grid gap-4 md:grid-cols-2">
                <label class="block md:col-span-2">
                  <span class="mb-2 block text-sm text-slate-300">标题</span>
                  <input
                    v-model="form.title"
                    type="text"
                    maxlength="150"
                    placeholder="请输入文章标题"
                    class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70"
                  >
                </label>

                <label class="block md:col-span-2">
                  <span class="mb-2 block text-sm text-slate-300">Slug</span>
                  <input
                    v-model="form.slug"
                    type="text"
                    maxlength="150"
                    placeholder="可选，留空时由后端自动生成"
                    class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70"
                  >
                </label>

                <label class="block md:col-span-2">
                  <span class="mb-2 block text-sm text-slate-300">摘要</span>
                  <textarea
                    v-model="form.summary"
                    rows="4"
                    maxlength="500"
                    placeholder="请输入文章摘要，用于列表和详情摘要展示"
                    class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70"
                  />
                </label>

                <label class="block md:col-span-2">
                  <span class="mb-2 block text-sm text-slate-300">正文（Markdown）</span>
                  <textarea
                    v-model="form.contentMarkdown"
                    rows="18"
                    placeholder="请输入 Markdown 正文内容"
                    class="min-h-90 w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 font-mono text-sm text-slate-100 outline-none transition focus:border-cyan-300/70 leading-7"
                  />
                </label>
              </div>
            </section>

            <section class="rounded-6 border border-white/8 bg-slate-950/35 p-5">
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-lg text-white font-semibold">后续扩展位</h3>
                <span class="text-xs text-slate-400">当前先保留联调接口位置，不阻塞发文链路</span>
              </div>

              <div class="mt-5 grid gap-4 md:grid-cols-2">
                <div class="rounded-5 border border-dashed border-white/12 bg-white/3 p-4">
                  <p class="text-sm text-white font-medium">分类</p>
                  <p class="mt-3 text-sm text-slate-400 leading-6">
                    当前已保留 categoryId 提交位，等分类模块完成后替换为真实下拉选择。
                  </p>
                </div>
                <div class="rounded-5 border border-dashed border-white/12 bg-white/3 p-4">
                  <p class="text-sm text-white font-medium">标签</p>
                  <p class="mt-3 text-sm text-slate-400 leading-6">
                    当前已保留 tagIds 提交位，等标签模块完成后替换为真实多选组件。
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div class="space-y-6">
            <section class="rounded-6 border border-white/8 bg-slate-950/35 p-5">
              <h3 class="text-lg text-white font-semibold">发布信息</h3>
              <div class="mt-5 space-y-4 text-sm text-slate-300">
                <label class="block">
                  <span class="mb-2 block text-sm text-slate-300">状态</span>
                  <select
                    v-model="form.status"
                    class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70"
                  >
                    <option
                      v-for="option in statusOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </label>

                <div class="rounded-5 border border-cyan-300/15 bg-cyan-400/6 p-4">
                  <p class="text-xs text-cyan-200">当前状态说明</p>
                  <p class="mt-3 text-sm text-slate-100 leading-6">{{ currentStatusMeta.hint }}</p>
                </div>

                <div class="rounded-5 border border-white/8 bg-white/4 p-4">
                  <p class="text-xs text-slate-400">文章路径</p>
                  <p class="mt-3 break-all text-sm text-white leading-6">/{{ previewSlug }}</p>
                </div>

                <div class="rounded-5 border border-white/8 bg-white/4 p-4">
                  <p class="text-xs text-slate-400">摘要预览</p>
                  <p class="mt-3 text-sm text-slate-300 leading-7">{{ previewSummary }}</p>
                </div>

                <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                  <div class="rounded-5 border border-white/8 bg-white/4 p-4">
                    <p class="text-xs text-slate-400">正文长度</p>
                    <p class="mt-3 text-sm text-white">{{ wordCount }} 字符</p>
                  </div>
                  <div class="rounded-5 border border-white/8 bg-white/4 p-4">
                    <p class="text-xs text-slate-400">最近保存</p>
                    <p class="mt-3 text-sm text-white">{{ formatDateTime(lastSavedAt || postDetail?.updatedAt || null) }}</p>
                  </div>
                </div>
              </div>
            </section>

            <section class="rounded-6 border border-dashed border-cyan-300/20 bg-cyan-400/5 p-5 text-sm text-slate-300 leading-7">
              <h3 class="text-base text-white font-semibold">联调说明</h3>
              <ul class="mt-4 space-y-2">
                <li>• 新建走 POST /api/admin/posts，编辑走 PATCH /api/admin/posts/:id。</li>
                <li>• 当前默认以 PUBLIC 可见性提交，后续可在此处扩展可见性与发布时间配置。</li>
                <li>• 若后端返回字段校验错误，页面会直接展示接口 message，便于快速定位联调问题。</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
