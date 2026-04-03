<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  variant?: 'default' | 'hero' | 'panel' | 'dashed'
  size?: 'md' | 'lg'
}>()
</script>

<template>
  <section
    class="overflow-hidden rounded-[24px] border shadow-[var(--shadow-panel)] backdrop-blur-xl"
    :class="[
      variant === 'hero'
        ? 'border-cyan-300/18 bg-[linear-gradient(180deg,rgba(14,27,42,0.96),rgba(8,17,30,0.92))]'
        : variant === 'panel'
          ? 'border-white/10 bg-[linear-gradient(180deg,rgba(16,28,43,0.96),rgba(11,21,35,0.92))]'
          : variant === 'dashed'
            ? 'border-dashed border-white/12 bg-[rgba(10,18,30,0.66)]'
            : 'border-white/10 bg-[linear-gradient(180deg,rgba(14,24,38,0.92),rgba(9,16,28,0.88))]',
      size === 'lg' ? 'p-7 md:p-8' : 'p-6',
    ]"
  >
    <header class="mb-5 flex flex-col gap-4 border-b border-white/8 pb-5 md:flex-row md:items-start md:justify-between">
      <div class="min-w-0">
        <p class="editor-kicker">
          {{ variant === 'hero' ? '重点模块' : '内容面板' }}
        </p>
        <h2 class="mt-3 text-[22px] text-[var(--text-1)] font-semibold leading-tight md:text-[26px]">
          {{ title }}
        </h2>
        <p v-if="description" class="mt-3 max-w-3xl text-sm text-[var(--text-3)] leading-7 md:text-[15px]">
          {{ description }}
        </p>
      </div>
      <div v-if="$slots.action" class="shrink-0">
        <slot name="action" />
      </div>
    </header>
    <div>
      <slot />
    </div>
  </section>
</template>
