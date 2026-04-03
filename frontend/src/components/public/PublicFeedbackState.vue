<script setup lang="ts">
withDefaults(
defineProps<{
  state: 'loading' | 'error' | 'empty'
  title?: string
  message: string
  inset?: boolean
}>(),
  {
    title: '',
    inset: false,
  },
)

// 统一前台的加载、错误和空态视觉，避免各页面重复堆不同样式。
const stateToneMap = {
  loading: {
    kicker: '加载中',
    cardClass: 'border-dashed border-[var(--line-soft)] bg-[var(--bg-gradient-card-soft)] text-[var(--text-3)]',
    dotClass: 'bg-[var(--info)]',
  },
  error: {
    kicker: '发生错误',
    cardClass: 'border-[var(--line-danger-panel)] bg-[var(--danger-soft)] text-[var(--danger)]',
    dotClass: 'bg-[var(--danger)]',
  },
  empty: {
    kicker: '暂无内容',
    cardClass: 'border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] text-[var(--text-3)]',
    dotClass: 'bg-[var(--accent-primary)]',
  },
} as const
</script>

<template>
  <div
    class="rounded-[22px] border p-5"
    :class="[
      stateToneMap[state].cardClass,
      inset ? 'shadow-none' : 'shadow-[var(--shadow-xs)]',
    ]"
  >
    <div class="flex items-start gap-3">
      <span class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" :class="stateToneMap[state].dotClass" />
      <div>
        <p class="editor-kicker" :class="state === 'error' ? 'text-[var(--danger)]' : ''">
          {{ title || stateToneMap[state].kicker }}
        </p>
        <p class="mt-3 text-sm leading-7">
          {{ message }}
        </p>
      </div>
    </div>
  </div>
</template>
