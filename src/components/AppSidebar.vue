<script setup lang="ts">
import { BarChart3, BookOpen, Database, FileSearch, Files, MessageSquareText } from '@lucide/vue'
import { useMockApi } from '../services/rag'

const navigation = [
  { to: '/', label: '工作台', icon: BarChart3 },
  { to: '/knowledge-bases', label: '知识库', icon: Database },
  { to: '/documents', label: '文档管理', icon: Files },
  { to: '/chat', label: '知识问答', icon: MessageSquareText },
  { to: '/retrieval', label: '检索调试', icon: FileSearch },
  { to: '/evaluation', label: '效果评测', icon: BookOpen },
]
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-mark"><BookOpen :size="20" /></span>
      <span class="brand-copy"><strong>知屿 RAG</strong><small>Knowledge Studio</small></span>
    </div>
    <nav class="main-nav" aria-label="主导航">
      <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" class="nav-item">
        <component :is="item.icon" :size="18" /><span>{{ item.label }}</span>
      </RouterLink>
    </nav>
    <div class="sidebar-footer">
      <span class="mock-indicator" />
      <span><strong>{{ useMockApi ? '演示模式' : 'API 已连接' }}</strong><small>{{ useMockApi ? 'Mock API 已启用' : 'FastAPI 内容服务' }}</small></span>
    </div>
  </aside>
</template>
