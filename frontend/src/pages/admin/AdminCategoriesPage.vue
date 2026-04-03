<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import {
  createAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from '../../api/taxonomy'
import SectionCard from '../../components/common/SectionCard.vue'
import type { AdminCategoryItem, AdminCategoryMutationPayload } from '../../types/taxonomy'

interface CategoryFormState {
  name: string
  slug: string
  description: string
  sortOrder: number
}

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const categories = ref<AdminCategoryItem[]>([])
const editingCategoryId = ref('')
const queryKeyword = ref('')

const form = reactive<CategoryFormState>({
  name: '',
  slug: '',
  description: '',
  sortOrder: 0,
})

const isEditMode = computed(() => Boolean(editingCategoryId.value))
const submitLabel = computed(() => (saving.value ? '正在保存...' : (isEditMode.value ? '保存分类' : '创建分类')))
const totalLabel = computed(() => `共 ${categories.value.length} 个分类`)
const usedCount = computed(() => categories.value.filter(item => item.postCount > 0).length)
const emptyCount = computed(() => categories.value.filter(item => item.postCount === 0).length)
const topCategory = computed(() => {
  if (categories.value.length === 0) {
    return null
  }

  return [...categories.value].sort((left, right) => right.postCount - left.postCount)[0]
})

onMounted(() => {
  void loadCategories()
})

// 分类页当前聚焦最小可交付能力：列表、搜索、创建、编辑。
async function loadCategories() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getAdminCategories({
      page: 1,
      pageSize: 100,
      keyword: queryKeyword.value,
      sortBy: 'sortOrder',
      sortOrder: 'asc',
    })

    categories.value = response.list
  }
  catch (error) {
    categories.value = []
    errorMessage.value = resolveErrorMessage(error, '分类列表加载失败，请稍后重试')
  }
  finally {
    loading.value = false
  }
}

function handleSearch() {
  successMessage.value = ''
  void loadCategories()
}

function handleResetSearch() {
  queryKeyword.value = ''
  successMessage.value = ''
  void loadCategories()
}

// 编辑态直接回填表单，减少切页成本，符合后台高频维护场景。
function handleEdit(category: AdminCategoryItem) {
  editingCategoryId.value = category.id
  form.name = category.name
  form.slug = category.slug
  form.description = category.description ?? ''
  form.sortOrder = category.sortOrder
  errorMessage.value = ''
  successMessage.value = ''
}

function handleResetForm() {
  editingCategoryId.value = ''
  form.name = ''
  form.slug = ''
  form.description = ''
  form.sortOrder = 0
  errorMessage.value = ''
  successMessage.value = ''
}

function validateForm() {
  if (!form.name.trim()) {
    return '请输入分类名称'
  }

  if (form.name.trim().length > 50) {
    return '分类名称不能超过 50 个字符'
  }

  if (form.slug.trim().length > 80) {
    return '分类 slug 不能超过 80 个字符'
  }

  if (form.description.trim().length > 300) {
    return '分类描述不能超过 300 个字符'
  }

  if (!Number.isInteger(form.sortOrder)) {
    return '分类排序必须为整数'
  }

  return ''
}

function buildPayload(): AdminCategoryMutationPayload {
  return {
    name: form.name,
    slug: form.slug,
    description: form.description,
    sortOrder: form.sortOrder,
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
  const isUpdating = Boolean(editingCategoryId.value)

  try {
    const payload = buildPayload()

    if (editingCategoryId.value) {
      await updateAdminCategory(editingCategoryId.value, payload)
    }
    else {
      await createAdminCategory(payload)
    }

    handleResetForm()
    successMessage.value = isUpdating ? '分类更新成功' : '分类创建成功'
    await loadCategories()
  }
  catch (error) {
    errorMessage.value = resolveErrorMessage(error, '分类保存失败，请稍后重试')
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
    <SectionCard title="分类管理" description="左侧负责搜索和列表，右侧固定承接创建与编辑，形成更标准的中后台双栏工作流。" variant="hero" size="lg">
      <div class="admin-card-grid cols-3">
        <article class="admin-overview-card admin-overview-card-primary">
          <p class="editor-kicker">分类总量</p>
          <p class="admin-overview-value">{{ categories.length }}</p>
          <p class="mt-3 text-xs text-[var(--text-3)]">{{ totalLabel }}</p>
        </article>
        <article class="admin-overview-card admin-overview-card-success">
          <p class="editor-kicker">已使用分类</p>
          <p class="admin-overview-value">{{ usedCount }}</p>
          <p class="mt-3 text-xs text-[var(--success)]">已关联文章的分类</p>
        </article>
        <article class="admin-overview-card">
          <p class="editor-kicker">高频分类</p>
          <p class="mt-4 text-lg text-[var(--text-1)] font-semibold leading-7">{{ topCategory?.name || '等待首个分类' }}</p>
          <p class="mt-3 text-xs text-[var(--text-3)]">空分类 {{ emptyCount }} 个</p>
        </article>
      </div>

      <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.28fr)_380px]">
        <div class="space-y-5">
          <div class="admin-toolbar">
            <div class="admin-toolbar-main grid gap-4 lg:grid-cols-[minmax(0,1fr)]">
              <label class="block">
                <span class="mb-2 block text-sm text-[var(--text-2)]">搜索分类</span>
                <input
                  v-model="queryKeyword"
                  type="text"
                  placeholder="输入分类名称、slug 或描述关键词"
                  class="ui-input"
                  @keyup.enter="handleSearch"
                >
              </label>
            </div>

            <div class="admin-toolbar-actions">
              <button type="button" class="ui-btn ui-btn-secondary text-sm" @click="handleResetSearch">
                重置
              </button>
              <button type="button" class="ui-btn ui-btn-primary text-sm" @click="handleSearch">
                查询
              </button>
            </div>

            <div class="admin-toolbar-meta">
              <span>{{ totalLabel }}</span>
              <span class="ui-badge">按排序值从小到大展示</span>
            </div>
          </div>

          <div v-if="successMessage" class="rounded-[18px] border border-[rgba(18,183,106,0.16)] bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)]">
            {{ successMessage }}
          </div>
          <div v-if="errorMessage" class="rounded-[18px] border border-[rgba(240,68,56,0.14)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            {{ errorMessage }}
          </div>

          <div v-if="loading" class="rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-5 py-14 text-center text-sm text-[var(--text-3)]">
            正在加载分类列表...
          </div>
          <div v-else-if="categories.length === 0" class="rounded-[22px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-5 py-14 text-center text-sm text-[var(--text-3)]">
            当前暂无分类，可先在右侧创建一个分类。
          </div>
          <div v-else class="space-y-4">
            <div class="admin-table-wrap">
              <table class="admin-data-table min-w-[860px]">
                <thead>
                  <tr>
                    <th>分类信息</th>
                    <th>排序值</th>
                    <th>关联文章</th>
                    <th>更新时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="category in categories" :key="category.id">
                    <td class="min-w-[320px]">
                      <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                          <h3 class="truncate text-[16px] text-[var(--text-1)] font-semibold leading-7">{{ category.name }}</h3>
                          <span class="ui-badge">/{{ category.slug }}</span>
                        </div>
                        <p class="mt-3 text-sm text-[var(--text-3)] leading-7">
                          {{ category.description || '暂无描述，建议补一段简短说明，方便后台和前台统一展示。' }}
                        </p>
                      </div>
                    </td>
                    <td>{{ category.sortOrder }}</td>
                    <td>{{ category.postCount }} 篇</td>
                    <td><span class="editor-mono text-sm text-[var(--text-3)]">{{ formatDateTime(category.updatedAt) }}</span></td>
                    <td>
                      <button type="button" class="ui-btn ui-btn-secondary min-h-[36px] px-4 text-xs" @click="handleEdit(category)">
                        编辑
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="admin-side-stack">
          <section class="admin-form-section">
            <div class="admin-form-section-header">
              <div>
                <p class="editor-kicker">Category Form</p>
                <h3 class="mt-3 text-[22px] font-semibold text-[var(--text-1)]">
                  {{ isEditMode ? '编辑分类' : '新建分类' }}
                </h3>
                <p class="mt-3 text-sm text-[var(--text-3)] leading-7">
                  当前保持单页表单，便于边看列表边修正分类信息。
                </p>
              </div>
              <span class="ui-badge">{{ isEditMode ? '编辑模式' : '创建模式' }}</span>
            </div>

            <div class="admin-form-section-body space-y-4">
              <label class="block">
                <span class="mb-2 block text-sm text-[var(--text-2)]">分类名称</span>
                <input v-model="form.name" type="text" maxlength="50" placeholder="请输入分类名称" class="ui-input">
              </label>
              <label class="block">
                <span class="mb-2 block text-sm text-[var(--text-2)]">Slug</span>
                <input v-model="form.slug" type="text" maxlength="80" placeholder="可选，留空时由后端自动生成" class="ui-input">
              </label>
              <label class="block">
                <span class="mb-2 block text-sm text-[var(--text-2)]">分类描述</span>
                <textarea v-model="form.description" rows="5" maxlength="300" placeholder="请输入分类描述，便于后台和前台展示" class="ui-textarea" />
              </label>
              <label class="block">
                <span class="mb-2 block text-sm text-[var(--text-2)]">排序值</span>
                <input v-model.number="form.sortOrder" type="number" placeholder="数值越小越靠前" class="ui-input">
              </label>

              <div class="flex flex-wrap gap-3">
                <button type="button" class="ui-btn ui-btn-secondary text-sm" @click="handleResetForm">
                  {{ isEditMode ? '取消编辑' : '清空表单' }}
                </button>
                <button type="button" class="ui-btn ui-btn-primary text-sm" :disabled="saving" @click="handleSubmit">
                  {{ submitLabel }}
                </button>
              </div>
            </div>
          </section>

          <section class="admin-side-card border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] text-sm text-[var(--text-3)] leading-7">
            <p class="font-medium text-[var(--text-1)]">联调说明</p>
            <ul class="mt-3 space-y-2">
              <li>• 列表接口：GET /api/admin/categories</li>
              <li>• 创建接口：POST /api/admin/categories</li>
              <li>• 更新接口：PATCH /api/admin/categories/:id</li>
              <li>• 当前未接删除接口，页面保持最小可交付范围。</li>
            </ul>
          </section>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
