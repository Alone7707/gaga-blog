<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { getPublicArchives } from '../../api/public'
import SectionCard from '../../components/common/SectionCard.vue'
import type { PublicArchiveYearBucket } from '../../types/public'
import { formatPublicDate } from '../../utils/public-post'

const loading = ref(false)
const errorMessage = ref('')
const archives = ref<PublicArchiveYearBucket[]>([])
const totalPosts = ref(0)

// 归档页直接消费后端按年月聚合的数据，页面只负责最小展示与跳转。
const totalMonths = computed(() => archives.value.reduce((sum, year) => sum + year.months.length, 0))

async function loadArchives() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getPublicArchives()
    archives.value = response.list
    totalPosts.value = response.total
  }
  catch (error) {
    archives.value = []
    totalPosts.value = 0
    errorMessage.value = error instanceof Error ? error.message : '归档数据加载失败'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadArchives()
})
</script>

<template>
  <div class="space-y-6">
    <SectionCard title="公开归档" description="按年月回溯全部公开文章，满足最小可交付的归档浏览能力。">
      <div class="grid gap-4 md:grid-cols-3">
        <div class="rounded-6 border border-white/10 bg-slate-950/25 p-5">
          <p class="text-xs uppercase tracking-[0.22em] text-cyan-300/80">
            文章总量
          </p>
          <p class="mt-4 text-3xl text-white font-semibold">
            {{ totalPosts }}
          </p>
          <p class="mt-2 text-sm text-slate-300 leading-7">
            当前对外可见并已发布的文章数量。
          </p>
        </div>
        <div class="rounded-6 border border-white/10 bg-slate-950/25 p-5">
          <p class="text-xs uppercase tracking-[0.22em] text-cyan-300/80">
            年份分组
          </p>
          <p class="mt-4 text-3xl text-white font-semibold">
            {{ archives.length }}
          </p>
          <p class="mt-2 text-sm text-slate-300 leading-7">
            当前归档中包含的年份数量。
          </p>
        </div>
        <div class="rounded-6 border border-white/10 bg-slate-950/25 p-5">
          <p class="text-xs uppercase tracking-[0.22em] text-cyan-300/80">
            月份分组
          </p>
          <p class="mt-4 text-3xl text-white font-semibold">
            {{ totalMonths }}
          </p>
          <p class="mt-2 text-sm text-slate-300 leading-7">
            用于快速定位内容发布时间区间。
          </p>
        </div>
      </div>
    </SectionCard>

    <SectionCard title="归档列表" description="按照年份和月份分组展示文章标题、发布时间及分类入口。">
      <div v-if="loading" class="rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-300 leading-7">
        正在加载归档数据...
      </div>

      <div v-else-if="errorMessage" class="rounded-6 border border-rose-400/25 bg-rose-400/8 p-5 text-sm text-rose-100 leading-7">
        {{ errorMessage }}
      </div>

      <div v-else-if="!archives.length" class="rounded-6 border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-300 leading-7">
        当前还没有可展示的公开归档内容。
      </div>

      <div v-else class="space-y-8">
        <section
          v-for="year in archives"
          :key="year.year"
          class="rounded-6 border border-white/10 bg-slate-950/20 p-5"
        >
          <div class="flex flex-col gap-2 border-b border-white/8 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p class="text-xs uppercase tracking-[0.22em] text-cyan-300/80">
                年度归档
              </p>
              <h3 class="mt-3 text-2xl text-white font-semibold">
                {{ year.year }}
              </h3>
            </div>
            <p class="text-sm text-slate-300">
              共 {{ year.count }} 篇文章 / {{ year.months.length }} 个自然月
            </p>
          </div>

          <div class="mt-5 space-y-5">
            <section
              v-for="month in year.months"
              :key="month.month"
              class="rounded-5 border border-white/8 bg-slate-950/25 p-4"
            >
              <div class="mb-4 flex items-center justify-between gap-3">
                <h4 class="text-lg text-white font-semibold">
                  {{ month.monthLabel }}
                </h4>
                <span class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                  {{ month.count }} 篇
                </span>
              </div>

              <div class="space-y-3">
                <article
                  v-for="post in month.posts"
                  :key="post.id"
                  class="rounded-4 border border-white/8 bg-slate-950/30 p-4 transition hover:border-cyan-300/30"
                >
                  <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div class="min-w-0 flex-1">
                      <RouterLink
                        :to="`/posts/${post.slug}`"
                        class="text-lg text-white font-semibold leading-7 transition hover:text-cyan-100"
                      >
                        {{ post.title }}
                      </RouterLink>
                      <p class="mt-2 text-sm text-slate-300 leading-7">
                        {{ post.summary || '当前文章暂无摘要。' }}
                      </p>
                      <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>{{ formatPublicDate(post.publishedAt) }}</span>
                        <span class="text-white/20">•</span>
                        <RouterLink
                          v-if="post.category"
                          :to="`/categories/${post.category.slug}`"
                          class="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1 text-cyan-200 transition hover:border-cyan-200"
                        >
                          {{ post.category.name }}
                        </RouterLink>
                        <template v-if="post.tags.length">
                          <span class="text-white/20">•</span>
                          <div class="flex flex-wrap gap-2">
                            <RouterLink
                              v-for="tag in post.tags"
                              :key="tag.id"
                              :to="`/tags/${tag.slug}`"
                              class="rounded-full border border-white/10 px-3 py-1 text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-100"
                            >
                              # {{ tag.name }}
                            </RouterLink>
                          </div>
                        </template>
                      </div>
                    </div>

                    <RouterLink
                      :to="`/posts/${post.slug}`"
                      class="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 px-4 py-2 text-sm text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-300/10"
                    >
                      阅读文章
                      <span aria-hidden="true">→</span>
                    </RouterLink>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </section>
      </div>
    </SectionCard>
  </div>
</template>
