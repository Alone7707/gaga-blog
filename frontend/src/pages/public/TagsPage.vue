<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { getPublicTags } from '../../api/public'
import SectionCard from '../../components/common/SectionCard.vue'
import PublicFeedbackState from '../../components/public/PublicFeedbackState.vue'
import PublicPageHero from '../../components/public/PublicPageHero.vue'
import type { PublicTagSummary } from '../../types/public'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const tags = ref<PublicTagSummary[]>([])

const activeSlug = computed(() => String(route.query.slug ?? ''))
const visibleTags = computed(() => tags.value.filter((item) => (item.postCount ?? 0) > 0))
const normalizedActiveSlug = computed(() => {
  if (!visibleTags.value.length) {
    return ''
  }

  const matched = visibleTags.value.find((item) => item.slug === activeSlug.value)
  return matched?.slug ?? visibleTags.value[0].slug
})

const activeTag = computed(() => visibleTags.value.find((item) => item.slug === normalizedActiveSlug.value) ?? null)
const topTags = computed(() => [...visibleTags.value].sort((left, right) => (right.postCount ?? 0) - (left.postCount ?? 0)).slice(0, 12))
const totalPosts = computed(() => visibleTags.value.reduce((sum, item) => sum + (item.postCount ?? 0), 0))

async function loadTags() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getPublicTags()
    tags.value = response.list

    if (visibleTags.value.length && normalizedActiveSlug.value !== activeSlug.value) {
      await router.replace({
        name: 'public-tags',
        query: {
          slug: normalizedActiveSlug.value,
        },
      })
    }
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '标签列表加载失败'
  }
  finally {
    loading.value = false
  }
}

function selectTag(slug: string) {
  void router.replace({
    name: 'public-tags',
    query: {
      slug,
    },
  })
}

onMounted(() => {
  void loadTags()
})

watch(
  () => route.query.slug,
  () => {
    if (visibleTags.value.length && normalizedActiveSlug.value !== activeSlug.value) {
      selectTag(normalizedActiveSlug.value)
    }
  },
)
</script>

<template>
  <div class="page-grid">
    <PublicPageHero
      kicker="Tags / Topic Network"
      title="标签网络"
      description="标签承担横向关联，不和分类抢角色。它更像主题网络的轻量跳板，让相近话题在更短路径上被看见。"
      :meta="[
        `${visibleTags.length} 个公开标签`,
        `${totalPosts} 次文章关联`,
      ]"
      :actions="[
        { label: '去搜索', to: '/search' },
        { label: '查看分类', to: '/categories', variant: 'secondary' },
      ]"
      aside-title="标签负责横向串联"
      aside-text="优先突出高频标签，并让当前选中标签始终有文章列表承接。"
      :aside-stats="[
        { label: '公开标签', value: visibleTags.length },
        { label: '高频标签', value: topTags.length },
      ]"
    />

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <SectionCard title="全部公开标签" description="用统一胶囊结构承接高密度主题入口，视觉更轻，浏览更快。" variant="panel" size="lg">
        <div v-if="loading">
          <PublicFeedbackState state="loading" message="正在加载公开标签列表..." />
        </div>

        <div v-else-if="errorMessage">
          <PublicFeedbackState state="error" :message="errorMessage" />
        </div>

        <div v-else-if="!visibleTags.length">
          <PublicFeedbackState state="empty" message="当前还没有可展示的公开标签。" />
        </div>

        <div v-else class="flex flex-wrap gap-3">
          <button
            v-for="tag in visibleTags"
            :key="tag.id"
            type="button"
            class="rounded-full border px-4 py-3 text-sm transition"
            :class="tag.slug === normalizedActiveSlug
              ? 'border-[rgba(76,139,245,0.22)] bg-[var(--accent-primary-soft)] text-[var(--accent-primary)] shadow-[var(--shadow-xs)]'
              : 'border-[var(--line-soft)] bg-white text-[var(--text-3)] hover:border-[rgba(76,139,245,0.22)] hover:text-[var(--text-1)]'"
            @click="selectTag(tag.slug)"
          >
            # {{ tag.name }} · {{ tag.postCount ?? 0 }}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="浏览建议" description="右侧只保留当前焦点和高频标签，横向跳转更直接。" variant="dashed">
        <div v-if="activeTag" class="rounded-[22px] border border-[var(--line-soft)] bg-white p-5">
          <p class="editor-kicker">当前焦点</p>
          <h3 class="mt-3 text-[22px] text-[var(--text-1)] font-semibold tracking-[-0.03em]">
            # {{ activeTag.name }}
          </h3>
          <p class="mt-3 text-sm text-[var(--text-3)] leading-7">
            当前标签共关联 {{ activeTag.postCount ?? 0 }} 篇公开文章，点击后进入对应的标签文章页。
          </p>
          <p class="mt-4 text-xs text-[var(--text-4)] editor-mono">
            slug / {{ activeTag.slug }}
          </p>
          <RouterLink :to="`/tags/${activeTag.slug}`" class="ui-btn ui-btn-primary mt-5 text-sm">
            查看标签文章
          </RouterLink>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <RouterLink
            v-for="tag in topTags"
            :key="tag.id"
            :to="`/tags/${tag.slug}`"
            class="ui-badge border border-[var(--line-soft)] bg-white text-[var(--text-3)] transition hover:border-[rgba(76,139,245,0.22)] hover:text-[var(--text-1)]"
          >
            # {{ tag.name }}
          </RouterLink>
        </div>
      </SectionCard>
    </div>
  </div>
</template>
