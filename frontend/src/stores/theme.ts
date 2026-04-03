import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'blog_theme_mode'
const THEME_ATTRIBUTE = 'data-theme'

// 兜底主题值，确保首屏和异常场景都能落回明亮主题。
const fallbackTheme: ThemeMode = 'light'

// 应用启动前读取缓存与系统偏好，尽量避免首屏闪烁。
export function initializeTheme() {
  const initialTheme = resolveInitialTheme()
  applyThemeToDocument(initialTheme)
}

// 主题状态统一在 store 中维护，供前台、后台和登录页共用。
export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(resolveInitialTheme())

  const isDark = computed(() => mode.value === 'dark')
  const nextModeLabel = computed(() => (isDark.value ? '浅色模式' : '深色模式'))

  // 切换主题时同步文档属性与本地缓存，保证刷新后状态可恢复。
  function setMode(nextMode: ThemeMode) {
    mode.value = nextMode
  }

  // 提供统一切换入口，避免布局层重复判断逻辑。
  function toggleMode() {
    mode.value = isDark.value ? 'light' : 'dark'
  }

  watch(
    mode,
    (nextMode) => {
      applyThemeToDocument(nextMode)
      persistTheme(nextMode)
    },
    {
      immediate: true,
    },
  )

  return {
    mode,
    isDark,
    nextModeLabel,
    setMode,
    toggleMode,
  }
})

function resolveInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return fallbackTheme
  }

  const cachedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

  if (cachedTheme === 'light' || cachedTheme === 'dark') {
    return cachedTheme
  }

  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return fallbackTheme
}

function applyThemeToDocument(mode: ThemeMode) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.setAttribute(THEME_ATTRIBUTE, mode)
  document.documentElement.style.colorScheme = mode
}

function persistTheme(mode: ThemeMode) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, mode)
}
