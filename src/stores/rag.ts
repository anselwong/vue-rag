import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { createKnowledgeBase, listKnowledgeBases } from '../services/rag'
import type { KnowledgeBase } from '../types/api'

export const useRagStore = defineStore('rag', () => {
  const knowledgeBases = ref<KnowledgeBase[]>([])
  const selectedKnowledgeBaseId = ref('')
  const loading = ref(false)

  const selectedKnowledgeBase = computed(() =>
    knowledgeBases.value.find((item) => item.id === selectedKnowledgeBaseId.value) ?? null,
  )
  const totals = computed(() => ({
    knowledgeBases: knowledgeBases.value.length,
    documents: knowledgeBases.value.reduce((sum, item) => sum + item.documentCount, 0),
    chunks: knowledgeBases.value.reduce((sum, item) => sum + item.chunkCount, 0),
  }))

  async function initialize(force = false) {
    // Pinia 在路由切换后仍保留内存。账号切换必须重新拉取，不能复用上一个
    // 用户的知识库列表，否则即使后端已隔离，界面也会短暂展示旧数据。
    if (!force && knowledgeBases.value.length) return
    loading.value = true
    try {
      knowledgeBases.value = await listKnowledgeBases()
      selectedKnowledgeBaseId.value = knowledgeBases.value[0]?.id ?? ''
    } finally {
      loading.value = false
    }
  }

  async function addKnowledgeBase(name: string, description: string) {
    const created = await createKnowledgeBase({ name, description })
    knowledgeBases.value.unshift(created)
    selectedKnowledgeBaseId.value = created.id
  }

  function reset() {
    knowledgeBases.value = []
    selectedKnowledgeBaseId.value = ''
    loading.value = false
  }

  return { knowledgeBases, selectedKnowledgeBaseId, selectedKnowledgeBase, loading, totals, initialize, addKnowledgeBase, reset }
})
