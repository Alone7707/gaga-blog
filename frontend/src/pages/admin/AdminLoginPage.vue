<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ThemeToggle from '../../components/common/ThemeToggle.vue'
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
  <div class="app-shell min-h-screen bg-[var(--bg-page)] px-4 py-6 text-[var(--text-2)] md:px-6 md:py-8">
    <div class="mx-auto mb-4 flex max-w-[1240px] justify-end">
      <ThemeToggle />
    </div>

    <div class="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1240px] gap-6 xl:grid-cols-[minmax(0,1.08fr)_440px]">
      <section class="panel-surface hidden rounded-[32px] p-8 xl:flex xl:flex-col xl:justify-between">
        <div>
          <p class="editor-kicker">Admin Login</p>
          <h1 class="editor-title mt-4 max-w-3xl text-[52px] leading-[1.04]">
            进入清爽版内容后台
          </h1>
          <p class="mt-5 max-w-2xl text-base text-[var(--text-3)] leading-8">
            后台首屏不再做厚重控制台，重点只保留登录、状态恢复和后续内容维护三件事。登录成功后会写入服务端 Cookie，并自动恢复当前登录态。
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <article class="rounded-[24px] border border-[var(--line-accent-soft)] bg-[var(--bg-gradient-card-info)] p-5">
            <p class="text-sm text-[var(--text-4)]">登录方式</p>
            <p class="mt-3 text-[28px] font-semibold text-[var(--text-1)]">账号密码</p>
            <p class="mt-3 text-sm text-[var(--text-3)] leading-7">沿用后台鉴权接口，优先保证登录闭环可用。</p>
          </article>
          <article class="rounded-[24px] border border-[var(--line-soft)] bg-[var(--bg-card)] p-5">
            <p class="text-sm text-[var(--text-4)]">状态恢复</p>
            <p class="mt-3 text-[28px] font-semibold text-[var(--text-1)]">自动恢复</p>
            <p class="mt-3 text-sm text-[var(--text-3)] leading-7">刷新页面后通过当前用户接口恢复登录状态。</p>
          </article>
          <article class="rounded-[24px] border border-[var(--line-success-panel)] bg-[var(--bg-gradient-card-success)] p-5">
            <p class="text-sm text-[var(--text-4)]">进入后</p>
            <p class="mt-3 text-[28px] font-semibold text-[var(--text-1)]">直达后台</p>
            <p class="mt-3 text-sm text-[var(--text-3)] leading-7">优先进入仪表盘，再处理文章、评论与设置。</p>
          </article>
        </div>
      </section>

      <section class="panel-surface flex rounded-[32px] p-6 md:p-8 xl:p-9">
        <div class="m-auto w-full max-w-[360px]">
          <div class="rounded-[24px] border border-[var(--line-soft)] bg-[var(--bg-gradient-card-hero)] p-5">
            <p class="editor-kicker">欢迎回来</p>
            <h2 class="mt-3 text-[30px] font-semibold text-[var(--text-1)] leading-tight">
              博客后台登录
            </h2>
            <p class="mt-3 text-sm text-[var(--text-3)] leading-7">
              用管理员账号登录，继续处理内容发布、评论审核和站点配置。
            </p>
          </div>

          <form class="mt-6 space-y-5" @submit.prevent="handleLogin">
            <label class="block">
              <span class="mb-2 block text-sm text-[var(--text-2)]">用户名</span>
              <input
                v-model="formState.username"
                type="text"
                autocomplete="username"
                placeholder="请输入管理员用户名"
                class="ui-input"
              >
            </label>

            <label class="block">
              <span class="mb-2 block text-sm text-[var(--text-2)]">密码</span>
              <input
                v-model="formState.password"
                type="password"
                autocomplete="current-password"
                placeholder="请输入管理员密码"
                class="ui-input"
              >
            </label>

            <p
              v-if="errorMessage"
              class="rounded-[18px] border border-[var(--line-danger-panel)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]"
            >
              {{ errorMessage }}
            </p>

            <button
              type="submit"
              class="ui-btn ui-btn-primary w-full text-sm"
              :disabled="submitting"
            >
              {{ submitting ? '登录中...' : '登录后台' }}
            </button>
          </form>

          <div class="mt-6 rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4 text-sm text-[var(--text-3)] leading-7">
            <p class="font-medium text-[var(--text-1)]">登录说明</p>
            <ul class="mt-3 space-y-2">
              <li>• 登录成功后会优先回跳到原本要访问的后台页面。</li>
              <li>• 当前页面不存储敏感凭据，只透传登录表单到鉴权接口。</li>
              <li>• 若登录失败，会直接展示接口返回的中文错误提示。</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
