<script setup lang="ts">
import { ArrowRight, CheckCircle2, CircleEllipsis, Clock3, FileText, Layers3, MessageSquareText } from '@lucide/vue'
import { useRagStore } from '../stores/rag'
import { formatDateTime } from '../utils/datetime'

const store = useRagStore()
</script>

<template>
  <main class="page-content dashboard-page">
    <section class="welcome-band">
      <div><p>2026 年 8 月 27 日 · 星期四</p><h2>知识库运行概况</h2><span>当前内容已完成索引，可以开始检索与问答。</span></div>
      <RouterLink class="button primary" to="/chat"><MessageSquareText :size="17" />开始提问</RouterLink>
    </section>

    <section class="stats-grid" aria-label="数据概览">
      <article><span class="stat-icon green"><Layers3 :size="19" /></span><div><small>知识库</small><strong>{{ store.totals.knowledgeBases }}</strong><p>全部运行正常</p></div></article>
      <article><span class="stat-icon blue"><FileText :size="19" /></span><div><small>文档总数</small><strong>{{ store.totals.documents }}</strong><p>本周新增 3 篇</p></div></article>
      <article><span class="stat-icon amber"><CircleEllipsis :size="19" /></span><div><small>向量切片</small><strong>{{ store.totals.chunks }}</strong><p>pgvector 索引就绪</p></div></article>
      <article><span class="stat-icon gray"><MessageSquareText :size="19" /></span><div><small>本周问答</small><strong>47</strong><p>引用命中率 91%</p></div></article>
    </section>

    <div class="dashboard-columns">
      <section class="panel">
        <header class="panel-header"><div><h2>知识库状态</h2><p>最近更新与索引规模</p></div><RouterLink class="text-link" to="/knowledge-bases">查看全部 <ArrowRight :size="15" /></RouterLink></header>
        <div class="kb-status-list">
          <button v-for="item in store.knowledgeBases" :key="item.id" type="button" @click="store.selectedKnowledgeBaseId = item.id">
            <span class="kb-avatar" :style="{ background: item.color }">{{ item.name.slice(0, 1) }}</span>
            <span class="kb-summary"><strong>{{ item.name }}</strong><small>{{ item.documentCount }} 篇文档 · {{ item.chunkCount }} 个切片</small></span>
            <span class="index-ready"><CheckCircle2 :size="14" />已索引</span>
            <time>{{ formatDateTime(item.updatedAt) }}</time>
          </button>
        </div>
      </section>

      <section class="panel activity-panel">
        <header class="panel-header"><div><h2>处理动态</h2><p>文档任务与系统事件</p></div></header>
        <ol class="activity-list">
          <li><span class="activity-icon success"><CheckCircle2 :size="15" /></span><div><strong>文档解析完成</strong><p>智能知识库产品需求文档.pdf</p><time>12 分钟前</time></div></li>
          <li><span class="activity-icon"><Layers3 :size="15" /></span><div><strong>向量索引已更新</strong><p>产品文档库新增 68 个切片</p><time>14 分钟前</time></div></li>
          <li><span class="activity-icon"><Clock3 :size="15" /></span><div><strong>评测任务完成</strong><p>4 个测试问题，3 个通过</p><time>昨天 18:42</time></div></li>
        </ol>
      </section>
    </div>
  </main>
</template>
