<script setup lang="ts">
import { CheckCircle2, ClipboardCheck, Clock3, LoaderCircle, Play, TriangleAlert } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'

import { generateEvaluationCases, listEvaluationCases, runEvaluation, runEvaluationSweep } from '../services/rag'
import { useRagStore } from '../stores/rag'
import type { EvaluationCase, SweepResponse } from '../types/api'

const store = useRagStore()
const cases = ref<EvaluationCase[]>([])
const running = ref(false)
const generating = ref(false)
const sweeping = ref(false)
const sweep = ref<SweepResponse | null>(null)
// 阈值安全提示：默认阈值高于 safe_upper_bound 时开始丢正确结果，需要标红提醒。
const thresholdUnsafe = computed(() => {
  const advice = sweep.value?.thresholdAdvice
  return Boolean(advice && advice.safeUpperBound !== null && advice.currentDefault > advice.safeUpperBound)
})

async function load() { if (store.selectedKnowledgeBaseId) cases.value = await listEvaluationCases(store.selectedKnowledgeBaseId) }
async function run() { running.value = true; try { cases.value = await runEvaluation(store.selectedKnowledgeBaseId) } finally { running.value = false } }
async function generate() { generating.value = true; try { cases.value = await generateEvaluationCases(store.selectedKnowledgeBaseId) } finally { generating.value = false } }
async function runSweep() {
  sweeping.value = true
  try { sweep.value = await runEvaluationSweep(store.selectedKnowledgeBaseId) } finally { sweeping.value = false }
}
onMounted(load)
watch(() => store.selectedKnowledgeBaseId, () => { sweep.value = null; load() })
const passCount = computed(() => cases.value.filter((item) => item.status === 'passed').length)
const averageFaithfulness = computed(() => {
  const values = cases.value.flatMap((item) => item.faithfulness === null ? [] : [item.faithfulness])
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
})
const averageRetrieval = computed(() => {
  const values = cases.value.flatMap((item) => item.retrievalScore === null ? [] : [item.retrievalScore])
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
})
const averageRecall = computed(() => cases.value.length ? cases.value.reduce((sum, item) => sum + (item.recallAtK ?? 0), 0) / cases.value.length : 0)
const averageMrr = computed(() => cases.value.length ? cases.value.reduce((sum, item) => sum + (item.mrr ?? 0), 0) / cases.value.length : 0)
const averageLatency = computed(() => {
  const values = cases.value.flatMap((item) => item.latencyMs === undefined ? [] : [item.latencyMs])
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
})
</script>

<template>
  <main class="page-content">
    <section class="page-toolbar evaluation-toolbar"><div><h2>基准测试集</h2><p>用固定问题持续衡量检索与回答质量。</p></div><div class="evaluation-actions"><el-button :icon="ClipboardCheck" :loading="generating" :disabled="running" @click="generate">根据文档生成题集</el-button><el-button type="primary" :icon="Play" :loading="running" :disabled="generating" @click="run">运行评测</el-button><el-button :icon="Play" :loading="sweeping" :disabled="running || generating" @click="runSweep">参数扫描</el-button></div></section>
    <section class="evaluation-metrics">
      <article><span class="stat-icon green"><ClipboardCheck :size="19" /></span><div><small>通过率</small><strong>{{ cases.length ? Math.round(passCount / cases.length * 100) : 0 }}%</strong><p>{{ passCount }} / {{ cases.length }} 个问题</p></div></article>
      <article><span class="stat-icon blue"><CheckCircle2 :size="19" /></span><div><small>回答忠实度</small><strong>{{ Math.round(averageFaithfulness * 100) }}%</strong><p>答案受原文支持程度</p></div></article>
      <article><span class="stat-icon amber"><ClipboardCheck :size="19" /></span><div><small>检索命中</small><strong>{{ Math.round(averageRetrieval * 100) }}%</strong><p>正确来源召回表现</p></div></article>
      <article><span class="stat-icon green"><ClipboardCheck :size="19" /></span><div><small>Recall@K</small><strong>{{ Math.round(averageRecall * 100) }}%</strong><p>前 K 条包含正确来源</p></div></article>
      <article><span class="stat-icon blue"><CheckCircle2 :size="19" /></span><div><small>MRR</small><strong>{{ Math.round(averageMrr * 100) }}%</strong><p>正确结果平均排名</p></div></article>
      <article><span class="stat-icon amber"><Clock3 :size="19" /></span><div><small>平均延迟</small><strong>{{ Math.round(averageLatency) }}ms</strong><p>单题检索耗时</p></div></article>
    </section>
    <section v-if="sweep || sweeping" class="table-panel sweep-panel">
      <header><div><h2>参数扫描对比</h2><p>{{ sweep ? `${sweep.caseCount} 道评测题 × ${sweep.results.length} 组配置，按 Recall@K 降序` : '正在运行多组检索配置…' }}</p></div></header>
      <el-alert v-if="sweep" :title="`阈值校准：默认 ${sweep.thresholdAdvice.currentDefault}${sweep.thresholdAdvice.safeUpperBound !== null ? `，安全上限 ${sweep.thresholdAdvice.safeUpperBound.toFixed(3)}${thresholdUnsafe ? '；默认阈值偏高，建议下调' : '；默认阈值安全'}` : '；暂无命中分数，无法给出阈值建议。'}`" :type="thresholdUnsafe ? 'warning' : 'success'" :closable="false" show-icon class="sweep-alert" />
      <el-table :data="sweep?.results ?? []" class="app-table sweep-table" empty-text="暂无扫描结果">
        <el-table-column label="检索配置" min-width="300"><template #default="{ row, $index }"><strong>{{ row.mode === 'hybrid' ? `hybrid（向量 ${row.vectorWeight} / 关键词 ${row.keywordWeight}）` : 'vector' }}</strong><small class="sweep-meta">阈值 {{ row.threshold }} · TopK {{ row.topK }}<el-tag v-if="$index === 0" size="small" type="primary" effect="light">最优</el-tag></small></template></el-table-column>
        <el-table-column label="Recall@K" width="130"><template #default="{ row }">{{ Math.round(row.recallAtK * 100) }}%</template></el-table-column>
        <el-table-column label="MRR" width="110"><template #default="{ row }">{{ row.mrr.toFixed(2) }}</template></el-table-column>
        <el-table-column label="平均延迟" width="130"><template #default="{ row }">{{ Math.round(row.avgLatencyMs) }}ms</template></el-table-column>
        <el-table-column label="命中分数 均值/最小" width="190"><template #default="{ row }">{{ row.avgScore === null ? '—' : `${row.avgScore.toFixed(3)} / ${(row.minScore ?? 0).toFixed(3)}` }}</template></el-table-column>
      </el-table>
    </section>
    <section class="table-panel evaluation-table-panel">
      <header><div><h2>评测明细</h2><p>当前知识库 · {{ store.selectedKnowledgeBase?.name }}</p></div></header>
      <el-table :data="cases" class="app-table evaluation-table" empty-text="暂无评测题">
        <el-table-column prop="question" label="测试问题" min-width="280" /><el-table-column prop="expectedSource" label="预期来源" min-width="220" /><el-table-column label="忠实度" width="120"><template #default="{ row: item }">{{ item.faithfulness === null ? '—' : `${Math.round(item.faithfulness * 100)}%` }}</template></el-table-column><el-table-column label="检索得分" width="120"><template #default="{ row: item }">{{ item.retrievalScore === null ? '—' : item.retrievalScore.toFixed(2) }}</template></el-table-column><el-table-column label="结果" width="120"><template #default="{ row: item }"><el-tag :type="item.status === 'passed' ? 'success' : item.status === 'review' ? 'warning' : 'info'" effect="light">{{ item.status === 'passed' ? '通过' : item.status === 'review' ? '待复核' : '未运行' }}</el-tag></template></el-table-column>
      </el-table>
    </section>
  </main>
</template>
