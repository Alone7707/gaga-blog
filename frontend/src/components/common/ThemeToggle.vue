<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useThemeStore } from '../../stores/theme'

const themeStore = useThemeStore()
const { isDark, nextModeLabel } = storeToRefs(themeStore)

// 统一主题切换按钮，前后台只关心放置位置，不再重复实现状态逻辑。
function handleToggleTheme() {
  themeStore.toggleMode()
}
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="`切换到${nextModeLabel}`"
    :title="`切换到${nextModeLabel}`"
    @click="handleToggleTheme"
  >
    <span class="theme-toggle__icon" aria-hidden="true">
      {{ isDark ? '☀' : '☾' }}
    </span>
    <span class="theme-toggle__text">{{ nextModeLabel }}</span>
  </button>
</template>
