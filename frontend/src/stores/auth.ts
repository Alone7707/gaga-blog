import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { getAdminProfile, loginAdmin, logoutAdmin } from '../api/auth'
import type { AdminLoginPayload, AdminProfile } from '../types/auth'

const AUTH_STORAGE_KEY = 'blog_admin_profile'

// 管理端登录态统一在该 store 中维护，避免页面直接拼接鉴权逻辑。
export const useAuthStore = defineStore('auth', () => {
  const profile = ref<AdminProfile | null>(readCachedProfile())
  const sessionChecked = ref(false)

  const isAuthenticated = computed(() => Boolean(profile.value))

  // 登录动作负责调用接口并同步本地缓存，供路由守卫与布局复用。
  async function login(payload: AdminLoginPayload) {
    const response = await loginAdmin(payload)

    profile.value = response.user
    persistProfile(response.user)
    sessionChecked.value = true

    return response.user
  }

  // 启动阶段或路由切换前主动校验一次服务端登录态，避免刷新后状态丢失。
  async function ensureSessionChecked() {
    if (sessionChecked.value) {
      return
    }

    try {
      const response = await getAdminProfile()
      profile.value = response.user
      persistProfile(response.user)
    }
    catch {
      resetProfile()
    }
    finally {
      sessionChecked.value = true
    }
  }

  // 登出时无论接口是否成功，都应清理本地登录态，保证前端状态收敛。
  async function logout() {
    try {
      await logoutAdmin()
    }
    finally {
      resetProfile()
      sessionChecked.value = true
    }
  }

  // 当接口返回未登录或鉴权失效时，统一调用该方法重置本地状态。
  function markUnauthenticated() {
    resetProfile()
    sessionChecked.value = true
  }

  // 将状态置空动作收敛在 store 内部，避免外部工具函数误用闭包变量。
  function resetProfile() {
    profile.value = null
    clearProfileCache()
  }

  return {
    profile,
    sessionChecked,
    isAuthenticated,
    login,
    logout,
    ensureSessionChecked,
    markUnauthenticated,
  }
})

// 从本地缓存恢复最小用户信息，减少页面刷新后的闪烁感。
function readCachedProfile(): AdminProfile | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as AdminProfile
  }
  catch {
    clearProfileCache()
    return null
  }
}

// 成功登录后将用户信息写入缓存，便于刷新后做最小状态恢复。
function persistProfile(nextProfile: AdminProfile) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextProfile))
}

// 登录失效或主动退出时，统一清理本地缓存中的用户资料。
function clearProfileCache() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}
