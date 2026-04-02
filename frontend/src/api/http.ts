import axios, { AxiosError } from 'axios'

import { useAuthStore } from '../stores/auth'

interface ApiSuccessResponse<T> {
  code: 'OK'
  message: 'success'
  data: T
  requestId: string
}

interface ApiErrorPayload {
  code?: string
  message?: string
}

// 统一创建管理端请求实例，后续后台接口可直接复用 withCredentials 与错误处理。
const http = axios.create({
  baseURL: '/',
  timeout: 10000,
  withCredentials: true,
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.markUnauthenticated()
    }

    const message =
      error.response?.data?.message
      || error.message
      || '请求失败，请稍后重试'

    return Promise.reject(new Error(message))
  },
)

// 统一解析后端成功响应包裹，只向业务层暴露真正的数据主体。
export async function request<T>(config: Parameters<typeof http.request<ApiSuccessResponse<T>>>[0]) {
  const response = await http.request<ApiSuccessResponse<T>>(config)
  return response.data.data
}

export { http }
