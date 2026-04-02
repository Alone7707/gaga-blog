<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import {
  createAdminTag,
  getAdminTags,
  updateAdminTag,
} from '../../api/taxonomy'
import SectionCard from '../../components/common/SectionCard.vue'
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
  void loadTags()
}

function handleResetSearch() {
  queryKeyword.value = ''
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
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
    <SectionCard title="标签管理" description="已接入后台标签列表、创建、更新接口。当前版本保持轻量，优先支撑文章编辑联调。">
      <div class="flex flex-col gap-4 rounded-6 border border-white/8 bg-slate-950/35 p-4 lg:flex-row lg:items-end lg:justify-between">
        <label class="block flex-1">
          <span class="mb-2 block text-sm text-slate-300">搜索标签</span>
          <input v-model="queryKeyword" type="text" placeholder="输入标签名称或 slug 关键词" class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70" @keyup.enter="handleSearch">
        </label>
        <div class="flex flex-wrap gap-3">
          <button type="button" class="rounded-full border border-white/12 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:text-white" @click="handleResetSearch">重置</button>
          <button type="button" class="rounded-full bg-cyan-400 px-4 py-2 text-sm text-slate-950 font-semibold transition hover:bg-cyan-300" @click="handleSearch">查询</button>
        </div>
      </div>

      <div class="mt-5 overflow-hidden rounded-6 border border-white/8 bg-slate-950/30">
        <div v-if="loading" class="px-5 py-14 text-center text-sm text-slate-300">正在加载标签列表...</div>
        <div v-else-if="errorMessage" class="px-5 py-10"><p class="rounded-4 border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{{ errorMessage }}</p></div>
        <div v-else-if="tags.length === 0" class="px-5 py-14 text-center text-sm text-slate-300">当前暂无标签，可先在右侧创建一个标签。</div>
        <table v-else class="min-w-full border-collapse text-sm">
          <thead class="bg-white/5 text-left text-slate-300">
            <tr>
              <th class="px-5 py-4 font-medium">标签名称</th>
              <th class="px-5 py-4 font-medium">Slug</th>
              <th class="px-5 py-4 font-medium">文章数</th>
              <th class="px-5 py-4 font-medium">更新时间</th>
              <th class="px-5 py-4 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tag in tags" :key="tag.id" class="border-t border-white/6 transition hover:bg-white/4">
              <td class="px-5 py-4 align-top text-white font-medium">{{ tag.name }}</td>
              <td class="px-5 py-4 align-top text-slate-300">{{ tag.slug }}</td>
              <td class="px-5 py-4 align-top text-slate-300">{{ tag.postCount }}</td>
              <td class="px-5 py-4 align-top text-slate-300">{{ new Date(tag.updatedAt).toLocaleString('zh-CN') }}</td>
              <td class="px-5 py-4 align-top text-right"><button type="button" class="rounded-full border border-white/12 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-300/40 hover:text-white" @click="handleEdit(tag)">编辑</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </SectionCard>

    <SectionCard :title="isEditMode ? '编辑标签' : '新建标签'" description="标签维护保持单页完成，便于与文章编辑页的标签选择联动。">
      <div class="space-y-4">
        <div v-if="successMessage" class="rounded-6 border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{{ successMessage }}</div>
        <label class="block">
          <span class="mb-2 block text-sm text-slate-300">标签名称</span>
          <input v-model="form.name" type="text" maxlength="50" placeholder="请输入标签名称" class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70">
        </label>
        <label class="block">
          <span class="mb-2 block text-sm text-slate-300">Slug</span>
          <input v-model="form.slug" type="text" maxlength="80" placeholder="可选，留空时由后端自动生成" class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70">
        </label>
        <div class="flex flex-wrap gap-3 pt-2">
          <button type="button" class="rounded-full border border-white/12 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:text-white" @click="handleResetForm">{{ isEditMode ? '取消编辑' : '清空表单' }}</button>
          <button type="button" class="rounded-full bg-cyan-400 px-4 py-2 text-sm text-slate-950 font-semibold transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60" :disabled="saving" @click="handleSubmit">{{ submitLabel }}</button>
        </div>
        <div class="rounded-6 border border-dashed border-cyan-300/20 bg-cyan-400/5 p-4 text-sm text-slate-300 leading-7">
          <p class="text-white font-medium">联调说明</p>
          <ul class="mt-3 space-y-2">
            <li>• 列表接口：GET /api/admin/tags</li>
            <li>• 创建接口：POST /api/admin/tags</li>
            <li>• 更新接口：PATCH /api/admin/tags/:id</li>
            <li>• 当前未接删除接口，页面保持最小可交付范围。</li>
          </ul>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
