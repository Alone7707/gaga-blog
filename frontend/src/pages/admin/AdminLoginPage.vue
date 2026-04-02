<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const formState = reactive({
  username: '',
  password: '',
})
const errorMessage = ref('')
const submitting = ref(false)

// 登录成功后优先回跳原访问页，避免用户丢失访问上下文。
const redirectPath = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/admin') ? redirect : '/admin'
})

// 提交登录表单时先做最小校验，再调用 store 内统一封装的登录动作。
async function handleLogin() {
  if (submitting.value) {
    return
  }

  if (!formState.username.trim() || !formState.password.trim()) {
    errorMessage.value = '请输入用户名和密码'
    return
  }

  errorMessage.value = ''
  submitting.value = true

  try {
    await authStore.login({
      username: formState.username.trim(),
      password: formState.password,
    })
    await router.replace(redirectPath.value)
  }
  catch (error) {
    errorMessage.value = resolveErrorMessage(error)
  }
  finally {
    submitting.value = false
  }
}

// 将接口错误收敛为可直接展示的中文提示，避免页面出现原始异常对象。
function resolveErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'message' in error) {
    const message = Reflect.get(error, 'message')

    if (typeof message === 'string' && message) {
      return message
    }
  }

  return '登录失败，请稍后重试'
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
        当前已接入后台鉴权接口。登录成功后会写入服务端 Cookie，并在刷新后通过当前用户接口恢复登录态。
      </p>

      <form class="mt-8 space-y-5" @submit.prevent="handleLogin">
        <label class="block">
          <span class="mb-2 block text-sm text-slate-300">用户名</span>
          <input
            v-model="formState.username"
            type="text"
            autocomplete="username"
            placeholder="请输入管理员用户名"
            class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70"
          >
        </label>

        <label class="block">
          <span class="mb-2 block text-sm text-slate-300">密码</span>
          <input
            v-model="formState.password"
            type="password"
            autocomplete="current-password"
            placeholder="请输入管理员密码"
            class="w-full rounded-4 border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70"
          >
        </label>

        <p
          v-if="errorMessage"
          class="rounded-4 border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
        >
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          class="w-full rounded-4 bg-cyan-400 px-4 py-3 text-sm text-slate-950 font-semibold transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-300/60"
          :disabled="submitting"
        >
          {{ submitting ? '登录中...' : '登录后台' }}
        </button>
      </form>
    </div>
  </div>
</template>
