<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 登录页先用本地占位动作模拟登录成功跳转，后续直接替换为真实接口。
const redirectPath = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/admin') ? redirect : '/admin'
})

function handleLogin() {
  authStore.login()
  router.push(redirectPath.value)
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#020617] px-6 py-12 text-slate-100">
    <div class="w-full max-w-md rounded-8 border border-white/10 bg-white/6 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.45)] backdrop-blur-md">
      <p class="text-xs uppercase tracking-[0.32em] text-cyan-300/80">
        Admin Login
      </p>
      <h1 class="mt-4 text-3xl font-semibold text-white">
        博客后台登录
      </h1>
      <p class="mt-4 text-sm text-slate-300 leading-7">
        当前为登录页占位实现，用于打通后台访问链路与路由守卫。后续接入真实鉴权接口后替换表单提交逻辑即可。
      </p>

      <div class="mt-8 space-y-5">
        <label class="block">
          <span class="mb-2 block text-sm text-slate-300">用户名</span>
          <input
            type="text"
            value="admin"
            readonly
            class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none"
          >
        </label>

        <label class="block">
          <span class="mb-2 block text-sm text-slate-300">密码</span>
          <input
            type="password"
            value="********"
            readonly
            class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none"
          >
        </label>

        <button
          type="button"
          class="w-full rounded-4 bg-cyan-400 px-4 py-3 text-sm text-slate-950 font-semibold transition hover:bg-cyan-300"
          @click="handleLogin"
        >
          进入后台占位页
        </button>
      </div>
    </div>
  </div>
</template>
