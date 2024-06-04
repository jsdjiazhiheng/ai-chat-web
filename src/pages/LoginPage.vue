<script setup lang="ts">
import { login } from '@/api/login'
import type { LoginData, LoginResult } from '@/api/types'
import type { AxiosResponse } from 'axios'
import { setToken } from '@/utils/auth'

const router = useRouter()

const loginForm = ref<LoginData>({
  tenantId: '000000',
  username: 'admin',
  password: 'admin123',
  rememberMe: false,
  code: '',
  uuid: ''
} as LoginData);

const handleSubmit = async () => {
  const res: AxiosResponse<LoginResult> = await login(loginForm.value)
  console.log(res)
  setToken(res.data.access_token)
  router.push('/')
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8 bg-white p-1.5">
      <div class="m-12">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">登录</h2>
        </div>
        <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
          <input type="hidden" name="remember" value="true">
          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                v-model="loginForm.username"
                name="username"
                type="text"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-b-md"
                placeholder="用户名"
              />
            </div>
            <div>
              <input
                v-model="loginForm.password"
                name="password"
                type="password"
                required
                class="mt-3.5 appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="密码"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              登录
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>