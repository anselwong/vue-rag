import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { get, post } from '../services/http'

const TOKEN_KEY = 'rag_access_token'
const USER_KEY = 'rag_user'

export interface AuthUser {
  id: string
  username: string
  role: string
  createdAt?: string
}

function mapUser(item: any): AuthUser {
  return { id: item.id, username: item.username, role: item.role, createdAt: item.createdAt ?? item.created_at }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) ?? '')
  const user = ref<AuthUser | null>(JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'))
  const initialized = ref(false)
  const isAuthenticated = computed(() => Boolean(token.value && user.value))

  function setSession(body: any) {
    token.value = body.access_token
    user.value = mapUser(body.user)
    localStorage.setItem(TOKEN_KEY, token.value)
    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  }

  async function initialize() {
    if (!token.value) {
      initialized.value = true
      return
    }
    try {
      user.value = mapUser(await get<any>('/auth/me'))
      localStorage.setItem(USER_KEY, JSON.stringify(user.value))
    } catch {
      logout()
    } finally {
      initialized.value = true
    }
  }

  async function login(username: string, password: string) { setSession(await post<any>('/auth/login', { username, password })) }
  async function register(username: string, password: string) { setSession(await post<any>('/auth/register', { username, password })) }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return { token, user, initialized, isAuthenticated, initialize, login, register, logout }
})
