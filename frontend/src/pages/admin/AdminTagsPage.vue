<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import {
  createAdminTag,
  getAdminTags,
  updateAdminTag,
} from '../../api/taxonomy'
import SectionCard from '../../components/common/SectionCard.vue'
import PublicPageHero from '../../components/public/PublicPageHero.vue'
import type { AdminTagItem, AdminTagMutationPayload } from '../../types/taxonomy'

interface TagFormState {
  name: string
  slug: string
}

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const tags = ref<AdminTagItem[]>([])
const editingTagId = ref('')
const queryKeyword = ref('')

const form = reactive<TagFormState>({
  name: '',
  slug: '',
})

const isEditMode = computed(() => Boolean(editingTagId.value))
const submitLabel = computed(() => (saving.value ? '正在保存...' : (isEditMode.value ? '保存标签' : '创建标签')))
const totalLabel = computed(() => `共 ${tags.value.length} 个标签`)
const usedCount = computed(() => tags.value.filter(item => item.postCount > 0).length)
const emptyCount = computed(() => tags.value.filter(item => item.postCount === 0).length)
const topTag = computed(() => {
  if (tags.value.length === 0) {
    return null
  }

  return [...tags.value].sort((left, right) => right.postCount - left.postCount)[0]
})

onMounted(() => {
  void loadTags()
})

// 标签页聚焦后台高频录入与修正场景，先保证可查、可建、可改。
async function loadTags() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getAdminTags({
      page: 1,
      pageSize: 100,
      keyword: queryKeyword.value,
    })

    tags.value = response.list
  }
  catch (error) {
    tags.value = []
    errorMessage.value = resolveErrorMessage(error, '标签列表加载失败，请稍后重试')
  }
  finally {
    loading.value = false
  }
}

function handleSearch() {
  successMessage.value = ''
  void loadTags()
}

function handleResetSearch() {
  queryKeyword.value = ''
  successMessage.value = ''
  void loadTags()
}

function handleEdit(tag: AdminTagItem) {
  editingTagId.value = tag.id
  form.name = tag.name
  form.slug = tag.slug
  errorMessage.value = ''
  successMessage.value = ''
}

function handleResetForm() {
  editingTagId.value = ''
  form.name = ''
  form.slug = ''
  errorMessage.value = ''
  successMessage.value = ''
}

function validateForm() {
  if (!form.name.trim()) {
    return '请输入标签名称'
  }

  if (form.name.trim().length > 50) {
    return '标签名称不能超过 50 个字符'
  }

  if (form.slug.trim().length > 80) {
    return '标签 slug 不能超过 80 个字符'
  }

  return ''
}

function buildPayload(): AdminTagMutationPayload {
  return {
    name: form.name,
    slug: form.slug,
  }
}

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
  const isUpdating = Boolean(editingTagId.value)

  try {
    const payload = buildPayload()

    if (editingTagId.value) {
      await updateAdminTag(editingTagId.value, payload)
    }
    else {
      await createAdminTag(payload)
    }

    handleResetForm()
    successMessage.value = isUpdating ? '标签更新成功' : '标签创建成功'
    await loadTags()
  }
  catch (error) {
    errorMessage.value = resolveErrorMessage(error, '标签保存失败，请稍后重试')
  }
  finally {
    saving.value = false
  }
}

function formatDateTime(value: string) {
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
    <PublicPageHero
      kicker="Admin / Tags"
      title="标签管理"
      description="标签页延续后台清爽版工作流：先筛选话题词，再就地修正与补录，保证文章编辑页的标签选择始终可用。"
      :meta="[
        totalLabel,
        '保持轻量录入体验',
        topTag ? `最高频标签：${topTag.name}` : '等待首个标签',
      ]"
      aside-title="当前概览"
      :aside-text="topTag ? `${topTag.name} 当前关联 ${topTag.postCount} 篇文章，可优先维护为热门话题标签。` : '当前还没有标签数据，可以先从右侧表单创建常用标签。'"
      :aside-stats="[
        { label: '已使用标签', value: usedCount },
        { label: '空标签', value: emptyCount },
      ]"
    />

    <SectionCard title="标签工作区" description="左侧集中处理查询和列表，右侧表单保持常驻，方便边看边改。" variant="hero" size="lg">
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <div class="space-y-5">
          <div class="rounded-[24px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4 md:p-5">
            <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <label class="block">
                <span class="mb-2 block text-sm text-[var(--text-2)]">搜索标签</span>
                <input
                  v-model="queryKeyword"
                  type="text"
                  placeholder="输入标签名称或 slug 关键词"
                  class="ui-input"
                  @keyup.enter="handleSearch"
                >
              </label>

              <div class="flex flex-wrap gap-3 lg:justify-end">
                <button type="button" class="ui-btn ui-btn-secondary text-sm" @click="handleResetSearch">
                  重置
                </button>
                <button type="button" class="ui-btn ui-btn-primary text-sm" @click="handleSearch">
                  查询
                </button>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-4)]">
              <span>{{ totalLabel }}</span>
              <span class="ui-badge">用于文章编辑页标签联动</span>
            </div>
          </div>

          <div v-if="successMessage" class="rounded-[18px] border border-[rgba(18,183,106,0.16)] bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)]">
            {{ successMessage }}
          </div>
          <div v-if="errorMessage" class="rounded-[18px] border border-[rgba(240,68,56,0.14)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            {{ errorMessage }}
          </div>

          <div v-if="loading" class="rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-5 py-14 text-center text-sm text-[var(--text-3)]">
            正在加载标签列表...
          </div>
          <div v-else-if="tags.length === 0" class="rounded-[22px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-5 py-14 text-center text-sm text-[var(--text-3)]">
            当前暂无标签，可先在右侧创建一个标签。
          </div>
          <div v-else class="space-y-4">
            <article
              v-for="tag in tags"
              :key="tag.id"
              class="rounded-[22px] border border-[var(--line-soft)] bg-white p-5 transition hover:border-[rgba(76,139,245,0.18)] hover:shadow-[var(--shadow-xs)]"
            >
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="truncate text-[18px] text-[var(--text-1)] font-semibold leading-7">{{ tag.name }}</h3>
                    <span class="ui-badge">/{{ tag.slug }}</span>
                  </div>
                  <p class="mt-3 text-sm text-[var(--text-3)] leading-7">
                    当前标签已关联 {{ tag.postCount }} 篇文章，适合作为内容横向串联入口。
                  </p>
                </div>
                <button type="button" class="ui-btn ui-btn-secondary min-h-[38px] px-4 text-sm" @click="handleEdit(tag)">
                  编辑
                </button>
              </div>

              <div class="mt-4 grid gap-3 text-sm text-[var(--text-3)] md:grid-cols-2">
                <div class="rounded-[18px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-4 py-3">
                  <p class="text-xs text-[var(--text-4)]">关联文章</p>
                  <p class="mt-2 text-[var(--text-1)] font-medium">{{ tag.postCount }} 篇</p>
                </div>
                <div class="rounded-[18px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-4 py-3">
                  <p class="text-xs text-[var(--text-4)]">更新时间</p>
                  <p class="mt-2 text-[var(--text-1)] font-medium editor-mono">{{ formatDateTime(tag.updatedAt) }}</p>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div class="space-y-5">
          <section class="rounded-[24px] border border-[var(--line-soft)] bg-white p-5">
            <div class="border-b border-[var(--line-soft)] pb-4">
              <p class="editor-kicker">Tag Form</p>
              <h3 class="mt-3 text-[22px] font-semibold text-[var(--text-1)]">
                {{ isEditMode ? '编辑标签' : '新建标签' }}
              </h3>
              <p class="mt-3 text-sm text-[var(--text-3)] leading-7">
                标签维护保持单页完成，便于与文章编辑页的标签选择联动。
              </p>
            </div>

            <div class="mt-5 space-y-4">
              <label class="block">
                <span class="mb-2 block text-sm text-[var(--text-2)]">标签名称</span>
                <input v-model="form.name" type="text" maxlength="50" placeholder="请输入标签名称" class="ui-input">
              </label>
              <label class="block">
                <span class="mb-2 block text-sm text-[var(--text-2)]">Slug</span>
                <input v-model="form.slug" type="text" maxlength="80" placeholder="可选，留空时由后端自动生成" class="ui-input">
              </label>
            </div>

            <div class="mt-5 flex flex-wrap gap-3">
              <button type="button" class="ui-btn ui-btn-secondary text-sm" @click="handleResetForm">
                {{ isEditMode ? '取消编辑' : '清空表单' }}
              </button>
              <button type="button" class="ui-btn ui-btn-primary text-sm" :disabled="saving" @click="handleSubmit">
                {{ submitLabel }}
              </button>
            </div>
          </section>

          <section class="rounded-[24px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5 text-sm text-[var(--text-3)] leading-7">
            <p class="font-medium text-[var(--text-1)]">联调说明</p>
            <ul class="mt-3 space-y-2">
              <li>• 列表接口：GET /api/admin/tags</li>
              <li>• 创建接口：POST /api/admin/tags</li>
              <li>• 更新接口：PATCH /api/admin/tags/:id</li>
              <li>• 当前未接删除接口，页面保持最小可交付范围。</li>
            </ul>
          </section>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
