<script setup lang="ts">
import { Bell } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useRagStore } from '../stores/rag'

const route = useRoute()
const store = useRagStore()
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
      <span class="avatar">AW</span>
    </div>
  </header>
</template>
