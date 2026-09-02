<script setup lang="ts">
import { FileSearch, LoaderCircle, Search, SlidersHorizontal } from '@lucide/vue'
import { ref } from 'vue'

import { searchKnowledgeBase } from '../services/rag'
import { useRagStore } from '../stores/rag'
import type { RetrievalOptions, RetrievalResult } from '../types/api'

const store = useRagStore()
const query = ref('如何减少知识库回答中的幻觉？')
// 真实语义向量的余弦分数通常低于演示 mock；0.35 先保证有候选，再由用户收紧阈值。
const options = ref<RetrievalOptions>({ topK: 3, scoreThreshold: 0.35, mode: 'hybrid' })
const results = ref<RetrievalResult[]>([])
const searching = ref(false)
const elapsed = ref(0)

async function search() {
  if (!query.value.trim()) return
  searching.value = true
  const startedAt = performance.now()
  try { results.value = await searchKnowledgeBase(store.selectedKnowledgeBaseId, query.value.trim(), options.value) } finally {
    elapsed.value = Math.round(performance.now() - startedAt)
    searching.value = false
  }
}
</script>

<template>
  <main class="page-content retrieval-page">
    <section class="retrieval-query-panel">
      <div class="query-row"><label><Search :size="18" /><input v-model="query" placeholder="输入要检索的问题" @keydown.enter="search" /></label><button class="button primary" type="button" :disabled="searching" @click="search"><LoaderCircle v-if="searching" class="spinning" :size="17" /><FileSearch v-else :size="17" />检索</button></div>
      <div class="retrieval-controls">
        <label><span>检索模式</span><span class="segmented"><button :class="{ active: options.mode === 'vector' }" type="button" @click="options.mode = 'vector'">向量</button><button :class="{ active: options.mode === 'hybrid' }" type="button" @click="options.mode = 'hybrid'">混合</button></span></label>
        <label><span>Top K <strong>{{ options.topK }}</strong></span><input v-model.number="options.topK" type="range" min="1" max="5" /></label>
        <label><span>相似度阈值 <strong>{{ options.scoreThreshold.toFixed(2) }}</strong></span><input v-model.number="options.scoreThreshold" type="range" min="0" max="1" step="0.05" /></label>
      </div>
    </section>

    <section class="retrieval-results">
      <header><div><h2>召回片段</h2><p v-if="results.length">找到 {{ results.length }} 个结果 · 用时 {{ elapsed }} ms</p><p v-else>运行检索后在这里查看排序结果</p></div><SlidersHorizontal :size="18" /></header>
      <div v-if="!results.length" class="empty-state compact"><FileSearch :size="30" /><h2>等待检索</h2><p>调整参数并运行一次查询。</p></div>
      <article v-for="result in results" :key="result.id" class="retrieval-result">
        <span class="result-rank">{{ result.rank }}</span><div class="result-content"><header><strong>{{ result.documentName }}</strong><span>第 {{ result.page }} 页</span><span class="result-score">{{ Math.round(result.score * 100) }}%</span></header><p>{{ result.content }}</p><footer><span v-for="keyword in result.keywords" :key="keyword">{{ keyword }}</span></footer></div>
      </article>
    </section>
  </main>
</template>
