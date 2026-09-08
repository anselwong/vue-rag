<script setup lang="ts">
import { ArrowRight, Database, FileText, MoreHorizontal, Plus, Search } from '@lucide/vue'
import { computed, ref } from 'vue'

import BaseModal from '../components/BaseModal.vue'
import { useRagStore } from '../stores/rag'
import { formatDateTime } from '../utils/datetime'

const store = useRagStore()
const query = ref('')
const modalOpen = ref(false)
const saving = ref(false)
const form = ref({ name: '', description: '' })
const filtered = computed(() => store.knowledgeBases.filter((item) => `${item.name}${item.description}`.includes(query.value)))

async function save() {
  if (!form.value.name.trim()) return
  saving.value = true
  try {
    await store.addKnowledgeBase(form.value.name.trim(), form.value.description.trim())
    form.value = { name: '', description: '' }
    modalOpen.value = false
  } finally { saving.value = false }
}
</script>

<template>
  <main class="page-content">
    <section class="page-toolbar">
      <el-input v-model="query" class="toolbar-search" placeholder="搜索知识库" :prefix-icon="Search" clearable />
      <el-button type="primary" :icon="Plus" @click="modalOpen = true">新建知识库</el-button>
    </section>

    <section class="knowledge-grid">
      <article v-for="item in filtered" :key="item.id" class="knowledge-card" @click="store.selectedKnowledgeBaseId = item.id">
        <header><span class="large-kb-avatar" :style="{ background: item.color }"><Database :size="21" /></span><el-button text circle :icon="MoreHorizontal" title="更多操作" @click.stop /></header>
        <h2>{{ item.name }}</h2><p>{{ item.description }}</p>
        <dl><div><dt>文档</dt><dd>{{ item.documentCount }}</dd></div><div><dt>切片</dt><dd>{{ item.chunkCount }}</dd></div><div><dt>更新</dt><dd>{{ formatDateTime(item.updatedAt) }}</dd></div></dl>
        <RouterLink class="card-action" to="/documents"><FileText :size="16" />管理文档 <ArrowRight :size="15" /></RouterLink>
      </article>
    </section>

    <div v-if="!filtered.length" class="empty-state"><Database :size="30" /><h2>没有匹配的知识库</h2><p>换一个关键词，或创建新的知识库。</p></div>

    <BaseModal :open="modalOpen" title="新建知识库" @close="modalOpen = false">
      <form class="modal-form" @submit.prevent="save">
        <el-form label-position="top"><el-form-item label="名称"><el-input v-model="form.name" required maxlength="30" placeholder="例如：产品文档库" /></el-form-item><el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" maxlength="120" placeholder="简要说明知识库的内容范围" /></el-form-item></el-form>
        <footer><el-button @click="modalOpen = false">取消</el-button><el-button type="primary" native-type="submit" :loading="saving">创建</el-button></footer>
      </form>
    </BaseModal>
  </main>
</template>
