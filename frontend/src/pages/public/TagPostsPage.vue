<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { getPublicTagPosts, getPublicTags } from '../../api/public'
import SectionCard from '../../components/common/SectionCard.vue'
import PostCard from '../../components/public/PostCard.vue'
import type { PublicPostListItem, PublicTagSummary } from '../../types/public'
import { toPostCardItem } from '../../utils/public-post'

const route = useRoute()

const loading = ref(false)
const sidebarLoading = ref(false)
const sidebarErrorMessage = ref('')
const errorMessage = ref('')
const posts = ref<PublicPostListItem[]>([])
const tags = ref<PublicTagSummary[]>([])
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
})
const currentTag = ref<PublicTagSummary | null>(null)

const currentSlug = computed(() => String(route.params.slug ?? ''))
const postCards = computed(() => posts.value.map((item) => toPostCardItem(item)))
const siblingTags = computed(() => tags.value.filter((item) => (item.postCount ?? 0) > 0))

async function loadTags() {
  sidebarLoading.value = true
  sidebarErrorMessage.value = ''

  try {
    const response = await getPublicTags()
    tags.value = response.list
  }
  catch (error) {
    tags.value = []
    sidebarErrorMessage.value = error instanceof Error ? error.message : '标签入口加载失败'
  }
  finally {
    sidebarLoading.value = false
  }
}

async function loadTagPosts(page = 1) {
  if (!currentSlug.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getPublicTagPosts(currentSlug.value, {
      page,
      pageSize: 10,
    })

    currentTag.value = response.tag
    posts.value = response.list
    pagination.value = response.pagination
  }
  catch (error) {
    currentTag.value = null
    posts.value = []
    pagination.value = {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    }
    errorMessage.value = error instanceof Error ? error.message : '标签文章加载失败'
  }
  finally {
    loading.value = false
  }
}

function changePage(nextPage: number) {
  if (nextPage < 1 || nextPage > pagination.value.totalPages || nextPage === pagination.value.page) {
    return
  }

  loadTagPosts(nextPage)
}

onMounted(() => {
  loadTags()
  loadTagPosts()
})

watch(
  () => route.params.slug,
  () => {
    loadTagPosts(1)
  },
)
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
    <SectionCard title="全部标签" description="左侧保留标签入口，支持围绕相同主题快速切换文章集合。">
      <div v-if="sidebarLoading" class="text-sm text-slate-300 leading-7">
        标签入口加载中...
      </div>

      <div v-else-if="sidebarErrorMessage" class="rounded-6 border border-rose-400/25 bg-rose-400/8 p-4 text-sm text-rose-100 leading-7">
        {{ sidebarErrorMessage }}
      </div>

      <div v-else class="flex flex-wrap gap-3 lg:flex-col">
        <RouterLink
          v-for="tag in siblingTags"
          :key="tag.id"
          :to="`/tags/${tag.slug}`"
          class="rounded-full border px-4 py-2 text-sm transition"
          :class="tag.slug === currentSlug ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-slate-950/25 text-slate-300 hover:border-cyan-300/30'"
        >
          # {{ tag.name }} · {{ tag.postCount ?? 0 }}
        </RouterLink>
      </div>
    </SectionCard>

    <div class="space-y-6">
      <SectionCard
        :title="currentTag ? `# ${currentTag.name} · 标签文章` : '标签文章列表'"
        description="展示当前标签下所有公开可见文章。"
      >
        <div v-if="loading" class="rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-300 leading-7">
          正在加载标签文章...
        </div>

        <div v-else-if="errorMessage" class="rounded-6 border border-rose-400/25 bg-rose-400/8 p-5 text-sm text-rose-100 leading-7">
          {{ errorMessage }}
        </div>

        <div v-else-if="!postCards.length" class="rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-300 leading-7">
          当前标签下还没有公开文章。
        </div>

        <div v-else class="space-y-4">
          <PostCard
            v-for="post in postCards"
            :key="post.slug"
            :post="post"
          />
        </div>

        <div v-if="pagination.totalPages > 1" class="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            class="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="pagination.page <= 1"
            @click="changePage(pagination.page - 1)"
          >
            上一页
          </button>
          <span class="text-sm text-slate-300">{{ pagination.page }} / {{ pagination.totalPages }}</span>
          <button
            type="button"
            class="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="pagination.page >= pagination.totalPages"
            @click="changePage(pagination.page + 1)"
          >
            下一页
          </button>
        </div>
      </SectionCard>
    </div>
  </div>
</template>
