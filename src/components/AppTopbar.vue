<script setup lang="ts">
import { Bell } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useRagStore } from '../stores/rag'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const store = useRagStore()
const auth = useAuthStore()
const emit = defineEmits<{ logout: [] }>()
function handleCommand(command: string) { if (command === 'logout') emit('logout') }
const title = computed(() => route.meta.title as string)
const eyebrow = computed(() => route.meta.eyebrow as string)
</script>

<template>
  <header class="topbar">
    <div class="page-title"><p>{{ eyebrow }}</p><h1>{{ title }}</h1></div>
    <div class="topbar-actions">
      <el-select v-model="store.selectedKnowledgeBaseId" class="knowledge-select" aria-label="当前知识库">
        <el-option v-for="item in store.knowledgeBases" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-button class="topbar-icon-button" text circle title="通知"><Bell :size="18" /><span class="notification-dot" /></el-button>
      <el-dropdown @command="handleCommand">
        <span class="avatar">{{ auth.user?.username?.slice(0, 2).toUpperCase() }}</span>
        <template #dropdown><el-dropdown-menu><el-dropdown-item command="logout">退出登录</el-dropdown-item></el-dropdown-menu></template>
      </el-dropdown>
    </div>
  </header>
</template>
