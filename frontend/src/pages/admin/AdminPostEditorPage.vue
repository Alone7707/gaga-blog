<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { getAdminPostDetail } from '../../api/posts'
import SectionCard from '../../components/common/SectionCard.vue'
import type { AdminPostDetail } from '../../types/post'

const route = useRoute()
const loading = ref(false)
const errorMessage = ref('')
const postDetail = ref<AdminPostDetail | null>(null)

const isEditMode = computed(() => typeof route.params.id === 'string' && route.params.id.length > 0)

onMounted(() => {
  if (isEditMode.value) {
    void loadPostDetail(route.params.id as string)
  }
})

// 编辑模式优先回填真实文章详情；新建模式先提供清晰表单结构占位。
async function loadPostDetail(id: string) {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getAdminPostDetail(id)
    postDetail.value = response.post
  }
  catch (error) {
    errorMessage.value = resolveErrorMessage(error)
  }
  finally {
    loading.value = false
  }
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

function resolveErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'message' in error) {
    const message = Reflect.get(error, 'message')

    if (typeof message === 'string' && message) {
      return message
    }
  }

  return '文章详情加载失败，请稍后重试'
}
</script>

<template>
  <div class="space-y-6">
    <SectionCard
      :title="isEditMode ? '编辑文章入口' : '新建文章入口'"
      :description="isEditMode
        ? '当前已打通后台文章详情接口，支持回填基础信息，供下一个模块继续接入完整编辑表单。'
        : '当前先提供文章新建入口和页面结构占位，确保后台内容链路连续。'"
    >
      <div v-if="loading" class="rounded-6 border border-white/8 bg-slate-950/35 px-5 py-14 text-center text-sm text-slate-300">
        正在加载文章详情...
      </div>

      <div v-else-if="errorMessage" class="rounded-6 border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
        {{ errorMessage }}
      </div>

      <div v-else class="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_320px]">
        <div class="space-y-6">
          <section class="rounded-6 border border-white/8 bg-slate-950/35 p-5">
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-lg text-white font-semibold">基础信息</h3>
              <span class="rounded-full border border-cyan-300/20 px-3 py-1 text-xs text-cyan-200">
                {{ isEditMode ? '详情回填已接通' : '表单待下模块实现' }}
              </span>
            </div>

            <div class="mt-5 grid gap-4 md:grid-cols-2">
              <div class="rounded-5 border border-white/8 bg-white/4 p-4">
                <p class="text-xs text-slate-400">标题</p>
                <p class="mt-3 text-sm text-white leading-6">
                  {{ postDetail?.title || '新建模式下暂未填写标题' }}
                </p>
              </div>
              <div class="rounded-5 border border-white/8 bg-white/4 p-4">
                <p class="text-xs text-slate-400">Slug</p>
                <p class="mt-3 text-sm text-white leading-6">
                  {{ postDetail?.slug || '提交创建后自动生成或由表单输入' }}
                </p>
              </div>
              <div class="rounded-5 border border-white/8 bg-white/4 p-4 md:col-span-2">
                <p class="text-xs text-slate-400">摘要</p>
                <p class="mt-3 text-sm text-slate-300 leading-7">
                  {{ postDetail?.summary || '当前先展示编辑入口说明，下一模块补完整表单与保存能力。' }}
                </p>
              </div>
              <div class="rounded-5 border border-white/8 bg-white/4 p-4 md:col-span-2">
                <p class="text-xs text-slate-400">Markdown 内容预览占位</p>
                <pre class="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-sm text-slate-300 leading-7">{{ postDetail?.contentMarkdown || '此处预留文章编辑器区域，后续模块接入 Markdown 编辑与发布能力。' }}</pre>
              </div>
            </div>
          </section>
        </div>

        <div class="space-y-6">
          <section class="rounded-6 border border-white/8 bg-slate-950/35 p-5">
            <h3 class="text-lg text-white font-semibold">发布信息</h3>
            <div class="mt-5 space-y-4 text-sm text-slate-300">
              <div class="rounded-5 border border-white/8 bg-white/4 p-4">
                <p class="text-xs text-slate-400">状态</p>
                <p class="mt-3">{{ postDetail?.status || 'DRAFT' }}</p>
              </div>
              <div class="rounded-5 border border-white/8 bg-white/4 p-4">
                <p class="text-xs text-slate-400">分类</p>
                <p class="mt-3">{{ postDetail?.category?.name || '待选择分类' }}</p>
              </div>
              <div class="rounded-5 border border-white/8 bg-white/4 p-4">
                <p class="text-xs text-slate-400">标签</p>
                <p class="mt-3 leading-6">{{ postDetail?.tags.map((item) => item.name).join(' / ') || '待接标签选择能力' }}</p>
              </div>
              <div class="rounded-5 border border-white/8 bg-white/4 p-4">
                <p class="text-xs text-slate-400">更新时间</p>
                <p class="mt-3">{{ formatDateTime(postDetail?.updatedAt || null) }}</p>
              </div>
            </div>
          </section>

          <section class="rounded-6 border border-dashed border-cyan-300/20 bg-cyan-400/5 p-5 text-sm text-slate-300 leading-7">
            <h3 class="text-base text-white font-semibold">下一步接法</h3>
            <ul class="mt-4 space-y-2">
              <li>• 新建模式接 POST /api/admin/posts，提交标题、摘要、正文、分类、标签与状态。</li>
              <li>• 编辑模式接 PATCH /api/admin/posts/:id，保存后回跳文章管理列表。</li>
              <li>• 分类与标签模块落地后，把当前占位区域替换为真实下拉与多选组件。</li>
            </ul>
          </section>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
