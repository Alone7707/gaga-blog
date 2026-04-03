<script setup lang="ts">
import { RouterLink } from 'vue-router'

interface HeroAction {
  label: string
  to: string
  variant?: 'primary' | 'secondary' | 'ghost'
}

defineProps<{
  kicker?: string
  title: string
  description?: string
  meta?: string[]
  actions?: HeroAction[]
  asideTitle?: string
  asideText?: string
  asideStats?: Array<{
    label: string
    value: string | number
  }>
}>()
</script>

<template>
  <section class="panel-surface overflow-hidden rounded-[34px] p-6 md:p-8 lg:p-9">
    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_360px] xl:items-start">
      <div>
        <p v-if="kicker" class="editor-kicker">{{ kicker }}</p>
        <h2 class="editor-title mt-4 max-w-4xl text-[34px] leading-[1.06] md:text-[46px] lg:text-[54px]">
          {{ title }}
        </h2>
        <p v-if="description" class="mt-5 max-w-3xl text-sm text-[var(--text-3)] leading-7 md:text-[16px]">
          {{ description }}
        </p>

        <div v-if="meta?.length" class="mt-6 flex flex-wrap gap-3 text-sm text-[var(--text-3)]">
          <span v-for="item in meta" :key="item" class="ui-badge bg-white">{{ item }}</span>
        </div>

        <div v-if="actions?.length" class="mt-7 flex flex-wrap gap-3">
          <RouterLink
            v-for="action in actions"
            :key="`${action.to}-${action.label}`"
            :to="action.to"
            class="ui-btn text-sm"
            :class="action.variant === 'secondary'
              ? 'ui-btn-secondary'
              : action.variant === 'ghost'
                ? 'ui-btn-ghost'
                : 'ui-btn-primary'"
          >
            {{ action.label }}
          </RouterLink>
        </div>
      </div>

      <div v-if="asideTitle || asideText || asideStats?.length" class="rounded-[26px] border border-[var(--line-soft)] bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-5 shadow-[var(--shadow-xs)]">
        <p class="editor-kicker">页面概览</p>
        <h3 v-if="asideTitle" class="mt-3 text-[20px] text-[var(--text-1)] font-semibold tracking-[-0.03em]">
          {{ asideTitle }}
        </h3>
        <p v-if="asideText" class="mt-3 text-sm text-[var(--text-3)] leading-7">
          {{ asideText }}
        </p>

        <div v-if="asideStats?.length" class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div
            v-for="item in asideStats"
            :key="item.label"
            class="rounded-[20px] border border-[var(--line-soft)] bg-white p-4"
          >
            <p class="text-xs text-[var(--text-3)]">{{ item.label }}</p>
            <p class="mt-2 text-[28px] font-semibold text-[var(--text-1)]">{{ item.value }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
