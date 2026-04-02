<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="rounded-6 border border-white/10 bg-white/6 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-md">
    <header class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 class="text-lg text-white font-semibold">
          {{ title }}
        </h2>
        <p v-if="description" class="mt-2 text-sm text-slate-300 leading-6">
          {{ description }}
        </p>
      </div>
      <slot name="action" />
    </header>
    <div>
      <slot />
    </div>
  </section>
</template>
