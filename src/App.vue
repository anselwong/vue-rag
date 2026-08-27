<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { BookOpen, Database, FileText, RefreshCw, Server, Wifi, WifiOff } from '@lucide/vue'

import { fetchHealth } from './services/system'
import type { HealthResponse } from './types/api'

type ConnectionState = 'checking' | 'online' | 'offline'

const connectionState = ref<ConnectionState>('checking')
const health = ref<HealthResponse | null>(null)
const errorMessage = ref('')
let activeRequest: AbortController | null = null

const statusLabel = computed(() => {
  if (connectionState.value === 'online') return '服务正常'
  if (connectionState.value === 'offline') return '连接失败'
  return '检查中'
})

const checkedAt = computed(() => {
  if (!health.value) return '尚未连接'
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(health.value.timestamp))
})

async function checkConnection() {
  activeRequest?.abort()
  activeRequest = new AbortController()
  connectionState.value = 'checking'
  errorMessage.value = ''

  try {
    health.value = await fetchHealth(activeRequest.signal)
    connectionState.value = 'online'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    health.value = null
    connectionState.value = 'offline'
    errorMessage.value = error instanceof Error ? error.message : '发生未知错误'
  }
}

onMounted(checkConnection)
onBeforeUnmount(() => activeRequest?.abort())
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark"><BookOpen :size="21" /></span>
        <span>RAG 知识库</span>
      </div>

      <nav aria-label="主导航">
        <a class="nav-item active" href="#">
          <Database :size="18" />
          工作台
        </a>
        <span class="nav-item disabled">
          <FileText :size="18" />
          文档管理
        </span>
      </nav>

      <div class="sidebar-footer">Day 1 · 基础连接</div>
    </aside>

    <main>
      <header class="topbar">
        <div>
          <p class="eyebrow">工作台</p>
          <h1>系统概览</h1>
        </div>
        <span :class="['status-pill', connectionState]">
          <span class="status-dot" />
          {{ statusLabel }}
        </span>
      </header>

      <section class="content" aria-labelledby="connection-title">
        <div class="section-heading">
          <div>
            <h2 id="connection-title">服务连接</h2>
            <p>前端正在通过版本化 API 与 FastAPI 通信。</p>
          </div>
          <button
            class="icon-button"
            type="button"
            title="重新检查连接"
            :disabled="connectionState === 'checking'"
            @click="checkConnection"
          >
            <RefreshCw :class="{ spinning: connectionState === 'checking' }" :size="18" />
            <span class="sr-only">重新检查连接</span>
          </button>
        </div>

        <div :class="['connection-panel', connectionState]">
          <div class="connection-icon">
            <Wifi v-if="connectionState === 'online'" :size="26" />
            <WifiOff v-else-if="connectionState === 'offline'" :size="26" />
            <Server v-else :size="26" />
          </div>
          <div class="connection-summary">
            <span class="label">后端 API</span>
            <strong>{{ statusLabel }}</strong>
            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
            <p v-else>http://127.0.0.1:8000/api/v1</p>
          </div>
          <dl class="service-details">
            <div>
              <dt>服务</dt>
              <dd>{{ health?.service ?? '—' }}</dd>
            </div>
            <div>
              <dt>版本</dt>
              <dd>{{ health ? `v${health.version}` : '—' }}</dd>
            </div>
            <div>
              <dt>环境</dt>
              <dd>{{ health?.environment ?? '—' }}</dd>
            </div>
            <div>
              <dt>检查时间</dt>
              <dd>{{ checkedAt }}</dd>
            </div>
          </dl>
        </div>

        <div class="metrics-grid">
          <article>
            <span>知识库</span>
            <strong>0</strong>
            <small>Day 2 开始接入</small>
          </article>
          <article>
            <span>已上传文档</span>
            <strong>0</strong>
            <small>等待数据</small>
          </article>
          <article>
            <span>向量切片</span>
            <strong>0</strong>
            <small>等待建立索引</small>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>
