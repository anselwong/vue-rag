<script setup lang="ts">
import { CheckCircle2, ClipboardCheck, Clock3, LoaderCircle, Play, TriangleAlert } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'

import { listEvaluationCases, runEvaluation } from '../services/rag'
import { useRagStore } from '../stores/rag'
import type { EvaluationCase } from '../types/api'

const store = useRagStore()
const cases = ref<EvaluationCase[]>([])
const running = ref(false)
const passCount = computed(() => cases.value.filter((item) => item.status === 'passed').length)
const averageFaithfulness = computed(() => {
  const values = cases.value.flatMap((item) => item.faithfulness === null ? [] : [item.faithfulness])
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
})
const averageRetrieval = computed(() => {
  const values = cases.value.flatMap((item) => item.retrievalScore === null ? [] : [item.retrievalScore])
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
})

async function load() { if (store.selectedKnowledgeBaseId) cases.value = await listEvaluationCases(store.selectedKnowledgeBaseId) }
async function run() { running.value = true; try { cases.value = await runEvaluation(store.selectedKnowledgeBaseId) } finally { running.value = false } }
onMounted(load)
watch(() => store.selectedKnowledgeBaseId, load)
</script>

<template>
  <main class="page-content">
    <section class="page-toolbar evaluation-toolbar"><div><h2>基准测试集</h2><p>用固定问题持续衡量检索与回答质量。</p></div><button class="button primary" type="button" :disabled="running" @click="run"><LoaderCircle v-if="running" class="spinning" :size="17" /><Play v-else :size="16" />{{ running ? '评测中' : '运行评测' }}</button></section>
    <section class="evaluation-metrics">
      <article><span class="stat-icon green"><ClipboardCheck :size="19" /></span><div><small>通过率</small><strong>{{ cases.length ? Math.round(passCount / cases.length * 100) : 0 }}%</strong><p>{{ passCount }} / {{ cases.length }} 个问题</p></div></article>
      <article><span class="stat-icon blue"><CheckCircle2 :size="19" /></span><div><small>回答忠实度</small><strong>{{ Math.round(averageFaithfulness * 100) }}%</strong><p>答案受原文支持程度</p></div></article>
      <article><span class="stat-icon amber"><ClipboardCheck :size="19" /></span><div><small>检索命中</small><strong>{{ Math.round(averageRetrieval * 100) }}%</strong><p>正确来源召回表现</p></div></article>
    </section>
    <section class="table-panel evaluation-table-panel">
      <header><div><h2>评测明细</h2><p>当前知识库 · {{ store.selectedKnowledgeBase?.name }}</p></div></header>
      <div class="data-table evaluation-table">
        <div class="table-row table-head"><span>测试问题</span><span>预期来源</span><span>忠实度</span><span>检索得分</span><span>结果</span></div>
        <div v-for="item in cases" :key="item.id" class="table-row"><span><strong>{{ item.question }}</strong></span><span>{{ item.expectedSource }}</span><span>{{ item.faithfulness === null ? '—' : `${Math.round(item.faithfulness * 100)}%` }}</span><span>{{ item.retrievalScore === null ? '—' : item.retrievalScore.toFixed(2) }}</span><span><span :class="['evaluation-status', item.status]"><CheckCircle2 v-if="item.status === 'passed'" :size="13" /><TriangleAlert v-else-if="item.status === 'review'" :size="13" /><Clock3 v-else :size="13" />{{ item.status === 'passed' ? '通过' : item.status === 'review' ? '待复核' : '未运行' }}</span></span></div>
      </div>
    </section>
  </main>
</template>
