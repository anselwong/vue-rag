<script setup lang="ts">
import { Bell, ChevronDown } from '@lucide/vue'
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
      <label class="knowledge-select">
        <span class="sr-only">当前知识库</span>
        <select v-model="store.selectedKnowledgeBaseId">
          <option v-for="item in store.knowledgeBases" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>
        <ChevronDown :size="15" />
      </label>
      <button class="icon-button quiet" type="button" title="通知"><Bell :size="18" /><span class="notification-dot" /></button>
      <span class="avatar">AW</span>
    </div>
  </header>
</template>

