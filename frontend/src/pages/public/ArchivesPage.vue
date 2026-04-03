<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { getPublicArchives } from '../../api/public'
import SectionCard from '../../components/common/SectionCard.vue'
import PublicFeedbackState from '../../components/public/PublicFeedbackState.vue'
import PublicPageHero from '../../components/public/PublicPageHero.vue'
import type { PublicArchiveYearBucket, PublicPagination } from '../../types/public'
import { formatPublicDate } from '../../utils/public-post'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const archives = ref<PublicArchiveYearBucket[]>([])
const totalPosts = ref(0)
const pagination = ref<PublicPagination>({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
})

const totalMonths = computed(() => archives.value.reduce((sum, year) => sum + year.months.length, 0))
const latestYear = computed(() => archives.value[0]?.year ?? '--')
const latestMonths = computed(() => archives.value[0]?.months.slice(0, 3) ?? [])
const currentPage = computed(() => {
  const page = Number(route.query.page ?? 1)
  return Number.isInteger(page) && page > 0 ? page : 1
})

async function loadArchives(page = currentPage.value) {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getPublicArchives({ page })
    archives.value = response.list
    totalPosts.value = response.total
    pagination.value = response.pagination ?? {
      page,
      pageSize: response.total || 10,
      total: response.total,
      totalPages: response.total > 0 ? 1 : 0,
    }
  }
  catch (error) {
    archives.value = []
    totalPosts.value = 0
    pagination.value = {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    }
    errorMessage.value = error instanceof Error ? error.message : '归档数据加载失败'
  }
  finally {
    loading.value = false
  }
}

function changePage(nextPage: number) {
  if (nextPage < 1 || nextPage > Math.max(pagination.value.totalPages, 1) || nextPage === pagination.value.page) {
    return
  }

  void router.replace({
    name: 'public-archives',
    query: nextPage > 1 ? { page: String(nextPage) } : {},
  })
}

onMounted(() => {
  void loadArchives()
})

watch(
  () => route.query.page,
  () => {
    void loadArchives(currentPage.value)
  },
)
</script>

<template>
  <div class="page-grid">
    <PublicPageHero
      kicker="Archives / Time Index"
      title="公开归档"
      description="归档页不再只是时间清单，而是内容时间轴。它负责给老内容一个清晰入口，也给站点沉淀感一个直接证明。"
      :meta="[
        `${totalPosts} 篇公开文章`,
        `${archives.length} 个年份分组`,
        `${totalMonths} 个自然月`,
        `当前第 ${pagination.page} / ${Math.max(pagination.totalPages, 1)} 页`,
      ]"
      :actions="[
        { label: '回到首页', to: '/', variant: 'secondary' },
        { label: '去搜索', to: '/search', variant: 'ghost' },
      ]"
      aside-title="时间是另一条内容导航"
      aside-text="当用户记得发布时间、不记得分类时，归档页比搜索和标签更高效。"
      :aside-stats="[
        { label: '最新年份', value: latestYear },
        { label: '月份分组', value: totalMonths },
        { label: '每页文章', value: pagination.pageSize },
      ]"
    />

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <SectionCard title="归档概览" description="时间索引、汇总数字与近期月份入口统一放在首屏。" variant="panel">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-[20px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5">
            <p class="editor-kicker">文章总量</p>
            <p class="mt-4 text-[34px] text-[var(--text-1)] font-semibold">
              {{ totalPosts }}
            </p>
            <p class="mt-2 text-sm text-[var(--text-3)] leading-7">
              当前对外可见并已发布的文章数量。
            </p>
          </div>
          <div class="rounded-[20px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5">
            <p class="editor-kicker">年份分组</p>
            <p class="mt-4 text-[34px] text-[var(--text-1)] font-semibold">
              {{ archives.length }}
            </p>
            <p class="mt-2 text-sm text-[var(--text-3)] leading-7">
              当前归档中包含的年份数量。
            </p>
          </div>
          <div class="rounded-[20px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-5">
            <p class="editor-kicker">月份分组</p>
            <p class="mt-4 text-[34px] text-[var(--text-1)] font-semibold">
              {{ totalMonths }}
            </p>
            <p class="mt-2 text-sm text-[var(--text-3)] leading-7">
              用于快速定位内容发布时间区间。
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="近期月份" description="右侧展示最新年份中的近期月份，作为快速跳转入口。" variant="dashed">
        <div class="space-y-3">
          <div
            v-for="month in latestMonths"
            :key="month.month"
            class="rounded-[18px] border border-[var(--line-soft)] bg-white px-4 py-4"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm font-medium text-[var(--text-1)]">{{ month.monthLabel }}</span>
              <span class="text-xs text-[var(--text-4)]">{{ month.count }} 篇</span>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>

    <SectionCard title="归档列表" description="按照年份和月份分组展示文章标题、发布时间及主题入口。" variant="hero" size="lg">
      <div v-if="loading">
        <PublicFeedbackState state="loading" message="正在加载归档数据..." />
      </div>

      <div v-else-if="errorMessage">
        <PublicFeedbackState state="error" :message="errorMessage" />
      </div>

      <div v-else-if="!archives.length">
        <PublicFeedbackState state="empty" message="当前还没有可展示的公开归档内容。" />
      </div>

      <div v-else class="space-y-8">
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-5 py-4 text-sm text-[var(--text-3)]">
          <p>
            共 {{ pagination.total }} 篇公开文章，当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页，单页 {{ pagination.pageSize }} 篇。
          </p>
          <p>
            本页实际展示 {{ archives.reduce((sum, year) => sum + year.count, 0) }} 篇。
          </p>
        </div>

        <section
          v-for="year in archives"
          :key="year.year"
          class="rounded-[24px] border border-[var(--line-soft)] bg-white p-5"
        >
          <div class="flex flex-col gap-2 border-b border-[var(--line-soft)] pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p class="editor-kicker">年度归档</p>
              <h3 class="mt-3 text-[28px] text-[var(--text-1)] font-semibold tracking-[-0.03em]">
                {{ year.year }}
              </h3>
            </div>
            <p class="text-sm text-[var(--text-3)]">
              共 {{ year.count }} 篇文章 / {{ year.months.length }} 个自然月
            </p>
          </div>

          <div class="mt-5 space-y-5">
            <section
              v-for="month in year.months"
              :key="month.month"
              class="rounded-[20px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4"
            >
              <div class="mb-4 flex items-center justify-between gap-3">
                <h4 class="text-[20px] text-[var(--text-1)] font-semibold">
                  {{ month.monthLabel }}
                </h4>
                <span class="ui-badge">{{ month.count }} 篇</span>
              </div>

              <div class="space-y-3">
                <article
                  v-for="post in month.posts"
                  :key="post.id"
                  class="rounded-[18px] border border-[var(--line-soft)] bg-white p-4 transition hover:border-[rgba(76,139,245,0.22)]"
                >
                  <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div class="min-w-0 flex-1">
                      <RouterLink
                        :to="`/posts/${post.slug}`"
                        class="text-lg text-[var(--text-1)] font-semibold leading-7 transition hover:text-[var(--accent-primary)]"
                      >
                        {{ post.title }}
                      </RouterLink>
                      <p class="mt-2 text-sm text-[var(--text-3)] leading-7">
                        {{ post.summary || '当前文章暂无摘要。' }}
                      </p>
                      <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-4)]">
                        <span>{{ formatPublicDate(post.publishedAt) }}</span>
                        <span>•</span>
                        <RouterLink
                          v-if="post.category"
                          :to="`/categories/${post.category.slug}`"
                          class="ui-badge"
                        >
                          {{ post.category.name }}
                        </RouterLink>
                        <template v-if="post.tags.length">
                          <span>•</span>
                          <div class="flex flex-wrap gap-2">
                            <RouterLink
                              v-for="tag in post.tags"
                              :key="tag.id"
                              :to="`/tags/${tag.slug}`"
                              class="rounded-full border border-[var(--line-soft)] px-3 py-1 text-[var(--text-3)] transition hover:border-[rgba(76,139,245,0.22)] hover:text-[var(--text-1)]"
                            >
                              # {{ tag.name }}
                            </RouterLink>
                          </div>
                        </template>
                      </div>
                    </div>

                    <RouterLink
                      :to="`/posts/${post.slug}`"
                      class="ui-btn ui-btn-ghost text-sm"
                    >
                      阅读文章
                    </RouterLink>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </section>

        <div v-if="pagination.totalPages > 1" class="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line-soft)] pt-2">
          <p class="text-sm text-[var(--text-3)]">
            共 {{ pagination.total }} 篇文章，当前第 {{ pagination.page }} / {{ pagination.totalPages }} 页
          </p>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="ui-btn ui-btn-secondary text-sm disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="pagination.page <= 1"
              @click="changePage(pagination.page - 1)"
            >
              上一页
            </button>
            <button
              type="button"
              class="ui-btn ui-btn-secondary text-sm disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="pagination.page >= pagination.totalPages"
              @click="changePage(pagination.page + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
