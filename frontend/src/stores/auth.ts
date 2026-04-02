import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

// 登录用户的最小展示信息。
interface AdminProfile {
  username: string
  displayName: string
  role: 'SUPER_ADMIN' | 'EDITOR'
}

// 认证状态仅做前端骨架演示，后续接入真实接口时替换 action 即可。
export const useAuthStore = defineStore('auth', () => {
  const profile = ref<AdminProfile | null>(null)

  const isAuthenticated = computed(() => Boolean(profile.value))

  function login() {
    profile.value = {
      username: 'admin',
      displayName: '站点管理员',
      role: 'SUPER_ADMIN',
    }
  }

  function logout() {
    profile.value = null
  }

  return {
    profile,
    isAuthenticated,
    login,
    logout,
  }
})
