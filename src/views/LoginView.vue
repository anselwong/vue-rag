<script setup lang="ts">
import { LockKeyhole, LogIn, UserPlus } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { useAuthStore } from '../stores/auth'
import { useRagStore } from '../stores/rag'

const router = useRouter()
const auth = useAuthStore()
const rag = useRagStore()
const mode = ref<'login' | 'register'>('login')
const username = ref('admin')
const password = ref('admin')
const loading = ref(false)
const title = computed(() => mode.value === 'login' ? '登录知识库' : '创建账号')

async function submit() {
  loading.value = true
  try {
    if (mode.value === 'login') await auth.login(username.value.trim(), password.value)
    else await auth.register(username.value.trim(), password.value)
    // 登录页可在不同账号之间切换，先清空前一位用户遗留的 Pinia 数据。
    rag.reset()
    await router.replace('/')
  } catch (error: any) {
    ElMessage.error(error?.message ?? '操作失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-panel">
      <div class="auth-brand"><span class="auth-mark"><LockKeyhole :size="20" /></span><span>知识库工作台</span></div>
      <h1>{{ title }}</h1>
      <p class="auth-hint">{{ mode === 'login' ? '登录后访问你的私有知识库' : '注册后即可创建私有知识库' }}</p>
      <form @submit.prevent="submit">
        <label>用户名<input v-model="username" autocomplete="username" minlength="3" maxlength="40" required /></label>
        <label>密码<input v-model="password" type="password" autocomplete="current-password" minlength="6" maxlength="128" required /></label>
        <button class="auth-submit" type="submit" :disabled="loading"><LogIn v-if="mode === 'login'" :size="17" /><UserPlus v-else :size="17" />{{ loading ? '处理中...' : mode === 'login' ? '登录' : '注册并登录' }}</button>
      </form>
      <button class="auth-switch" type="button" @click="mode = mode === 'login' ? 'register' : 'login'">{{ mode === 'login' ? '没有账号？注册' : '已有账号？返回登录' }}</button>
    </section>
  </main>
</template>

<style scoped>
.auth-page { min-height: 100vh; display: grid; place-items: center; background: #f3f5f4; padding: 24px; }
.auth-panel { width: min(100%, 420px); padding: 36px; background: #fff; border: 1px solid #dde3e1; border-radius: 8px; box-shadow: 0 18px 50px rgba(24, 36, 34, .08); }
.auth-brand { display: flex; align-items: center; gap: 10px; color: #185b4c; font-weight: 700; }
.auth-mark { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 8px; background: #e5f3ee; }
h1 { margin: 34px 0 8px; font-size: 28px; }
.auth-hint { margin: 0 0 24px; color: #6e7a77; }
form { display: grid; gap: 16px; }
label { display: grid; gap: 7px; color: #465451; font-size: 14px; font-weight: 600; }
input { width: 100%; border: 1px solid #cfd9d5; border-radius: 6px; padding: 11px 12px; outline: none; }
input:focus { border-color: #247b66; box-shadow: 0 0 0 3px #e5f3ee; }
.auth-submit { display: inline-flex; justify-content: center; align-items: center; gap: 8px; border: 0; border-radius: 6px; padding: 12px; color: #fff; background: #247b66; cursor: pointer; font-weight: 700; }
.auth-submit:disabled { opacity: .6; cursor: wait; }
.auth-switch { width: 100%; margin-top: 18px; border: 0; background: transparent; color: #247b66; cursor: pointer; }
</style>
