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
  void loadCategories()
}

function handleResetSearch() {
  queryKeyword.value = ''
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
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
    <SectionCard title="分类管理" description="已接入后台分类列表、创建、更新接口。当前版本优先保证管理员可快速维护分类信息。">
      <div class="flex flex-col gap-4 rounded-6 border border-white/8 bg-slate-950/35 p-4 lg:flex-row lg:items-end lg:justify-between">
        <label class="block flex-1">
          <span class="mb-2 block text-sm text-slate-300">搜索分类</span>
          <input
            v-model="queryKeyword"
            type="text"
            placeholder="输入分类名称、slug 或描述关键词"
            class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70"
            @keyup.enter="handleSearch"
          >
        </label>

        <div class="flex flex-wrap gap-3">
          <button type="button" class="rounded-full border border-white/12 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:text-white" @click="handleResetSearch">
            重置
          </button>
          <button type="button" class="rounded-full bg-cyan-400 px-4 py-2 text-sm text-slate-950 font-semibold transition hover:bg-cyan-300" @click="handleSearch">
            查询
          </button>
        </div>
      </div>

      <div class="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
        <span>{{ totalLabel }}</span>
        <span class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">按 sortOrder 升序展示</span>
      </div>

      <div class="mt-5 overflow-hidden rounded-6 border border-white/8 bg-slate-950/30">
        <div v-if="loading" class="px-5 py-14 text-center text-sm text-slate-300">正在加载分类列表...</div>
        <div v-else-if="errorMessage" class="px-5 py-10">
          <p class="rounded-4 border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{{ errorMessage }}</p>
        </div>
        <div v-else-if="categories.length === 0" class="px-5 py-14 text-center text-sm text-slate-300">当前暂无分类，可先在右侧创建一个分类。</div>
        <table v-else class="min-w-full border-collapse text-sm">
          <thead class="bg-white/5 text-left text-slate-300">
            <tr>
              <th class="px-5 py-4 font-medium">分类名称</th>
              <th class="px-5 py-4 font-medium">Slug</th>
              <th class="px-5 py-4 font-medium">排序</th>
              <th class="px-5 py-4 font-medium">文章数</th>
              <th class="px-5 py-4 font-medium">更新时间</th>
              <th class="px-5 py-4 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="category in categories" :key="category.id" class="border-t border-white/6 transition hover:bg-white/4">
              <td class="px-5 py-4 align-top">
                <div class="space-y-2">
                  <div class="text-sm text-white font-medium">{{ category.name }}</div>
                  <p class="text-xs text-slate-400 leading-6">{{ category.description || '暂无描述' }}</p>
                </div>
              </td>
              <td class="px-5 py-4 align-top text-slate-300">{{ category.slug }}</td>
              <td class="px-5 py-4 align-top text-slate-300">{{ category.sortOrder }}</td>
              <td class="px-5 py-4 align-top text-slate-300">{{ category.postCount }}</td>
              <td class="px-5 py-4 align-top text-slate-300">{{ new Date(category.updatedAt).toLocaleString('zh-CN') }}</td>
              <td class="px-5 py-4 align-top text-right">
                <button type="button" class="rounded-full border border-white/12 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-300/40 hover:text-white" @click="handleEdit(category)">编辑</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </SectionCard>

    <SectionCard :title="isEditMode ? '编辑分类' : '新建分类'" description="最小可交付版本先采用同页表单方式，减少跳转并方便联调。">
      <div class="space-y-4">
        <div v-if="successMessage" class="rounded-6 border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{{ successMessage }}</div>
        <label class="block">
          <span class="mb-2 block text-sm text-slate-300">分类名称</span>
          <input v-model="form.name" type="text" maxlength="50" placeholder="请输入分类名称" class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70">
        </label>
        <label class="block">
          <span class="mb-2 block text-sm text-slate-300">Slug</span>
          <input v-model="form.slug" type="text" maxlength="80" placeholder="可选，留空时由后端自动生成" class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70">
        </label>
        <label class="block">
          <span class="mb-2 block text-sm text-slate-300">分类描述</span>
          <textarea v-model="form.description" rows="5" maxlength="300" placeholder="请输入分类描述，便于后台和前台展示" class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70" />
        </label>
        <label class="block">
          <span class="mb-2 block text-sm text-slate-300">排序值</span>
          <input v-model.number="form.sortOrder" type="number" placeholder="数值越小越靠前" class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70">
        </label>
        <div class="flex flex-wrap gap-3 pt-2">
          <button type="button" class="rounded-full border border-white/12 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:text-white" @click="handleResetForm">{{ isEditMode ? '取消编辑' : '清空表单' }}</button>
          <button type="button" class="rounded-full bg-cyan-400 px-4 py-2 text-sm text-slate-950 font-semibold transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60" :disabled="saving" @click="handleSubmit">{{ submitLabel }}</button>
        </div>
        <div class="rounded-6 border border-dashed border-cyan-300/20 bg-cyan-400/5 p-4 text-sm text-slate-300 leading-7">
          <p class="text-white font-medium">联调说明</p>
          <ul class="mt-3 space-y-2">
            <li>• 列表接口：GET /api/admin/categories</li>
            <li>• 创建接口：POST /api/admin/categories</li>
            <li>• 更新接口：PATCH /api/admin/categories/:id</li>
            <li>• 当前未接删除接口，页面保持最小可交付范围。</li>
          </ul>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
