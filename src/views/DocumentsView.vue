<script setup lang="ts">
import {
  CheckCircle2,
  Eye,
  File,
  FileText,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  UploadCloud,
} from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'

import BaseModal from '../components/BaseModal.vue'
import { deleteDocument, getDocumentDetail, listDocuments, uploadDocument } from '../services/rag'
import { useRagStore } from '../stores/rag'
import type { DocumentDetail, RagDocument } from '../types/api'
import { formatDateTime } from '../utils/datetime'

const store = useRagStore()
const documents = ref<RagDocument[]>([])
const query = ref('')
const loading = ref(false)
const uploadOpen = ref(false)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewOpen = ref(false)
const previewLoading = ref(false)
const previewDocument = ref<DocumentDetail | null>(null)
const previewMode = ref<'pages' | 'chunks'>('pages')
const uploadError = ref('')
const filtered = computed(() =>
  documents.value.filter((item) =>
    item.name.toLowerCase().includes(query.value.toLowerCase()),
  ),
)

async function load() {
  if (!store.selectedKnowledgeBaseId) return
  loading.value = true
  try {
    documents.value = await listDocuments(store.selectedKnowledgeBaseId)
  } finally {
    loading.value = false
  }
}

function chooseFile(event: Event) {
  selectedFile.value = (event.target as HTMLInputElement).files?.[0] ?? null
}

async function upload() {
  if (!selectedFile.value) return
  uploading.value = true
  uploadError.value = ''
  try {
    documents.value.unshift(
      await uploadDocument(store.selectedKnowledgeBaseId, selectedFile.value),
    )
    selectedFile.value = null
    uploadOpen.value = false
  } catch (error) {
    uploadError.value = error instanceof Error ? error.message : '上传失败，请稍后重试'
  } finally {
    uploading.value = false
  }
}

async function removeDocument(document: RagDocument) {
  await deleteDocument(store.selectedKnowledgeBaseId, document.id)
  documents.value = documents.value.filter((item) => item.id !== document.id)
}

async function preview(document: RagDocument) {
  previewOpen.value = true
  previewMode.value = 'pages'
  previewLoading.value = true
  previewDocument.value = null
  try { previewDocument.value = await getDocumentDetail(store.selectedKnowledgeBaseId, document.id) } finally { previewLoading.value = false }
}

onMounted(load)
watch(() => store.selectedKnowledgeBaseId, load)
</script>

<template>
  <main class="page-content">
    <section class="page-toolbar">
      <el-input v-model="query" class="toolbar-search" placeholder="搜索文档" :prefix-icon="Search" clearable />
      <el-button type="primary" :icon="Plus" @click="uploadOpen = true">上传文档</el-button>
    </section>

    <section class="table-panel">
      <header>
        <div>
          <h2>{{ store.selectedKnowledgeBase?.name }}</h2>
          <p>{{ documents.length }} 篇文档</p>
        </div>
        <span class="supported-formats">PDF · DOCX · MD · TXT</span>
      </header>
      <el-table v-loading="loading" :data="filtered" class="app-table document-table" empty-text="当前知识库暂无文档">
        <el-table-column label="文档" min-width="260">
          <template #default="{ row: document }"><span class="document-name"><span class="file-icon"><FileText :size="18" /></span><span><strong>{{ document.name }}</strong><small>{{ document.type }}</small></span></span></template>
        </el-table-column>
        <el-table-column prop="size" label="大小" width="100" />
        <el-table-column label="切片" width="90"><template #default="{ row: document }">{{ document.chunkCount || '—' }}</template></el-table-column>
        <el-table-column label="状态" width="118"><template #default="{ row: document }"><el-tag :type="document.status === 'ready' ? 'success' : 'warning'" effect="light" size="small"><CheckCircle2 v-if="document.status === 'ready'" :size="13" /><LoaderCircle v-else class="spinning" :size="13" />{{ document.status === 'ready' ? '已索引' : '解析中' }}</el-tag></template></el-table-column>
        <el-table-column label="上传时间" width="174"><template #default="{ row: document }">{{ formatDateTime(document.createdAt) }}</template></el-table-column>
        <el-table-column label="操作" width="112" align="right"><template #default="{ row: document }"><el-button text :icon="Eye" title="查看解析文本" @click="preview(document)" /><el-popconfirm title="确定删除该文档吗？" confirm-button-text="删除" cancel-button-text="取消" @confirm="removeDocument(document)"><template #reference><el-button text type="danger" :icon="Trash2" title="删除文档" /></template></el-popconfirm></template></el-table-column>
      </el-table>
    </section>

    <BaseModal :open="previewOpen" :title="previewDocument?.name ?? '解析文本'" @close="previewOpen = false">
      <div v-if="previewLoading" class="table-loading"><LoaderCircle class="spinning" :size="22" />正在读取解析结果</div>
      <div v-else-if="previewDocument" class="document-preview">
        <el-tabs v-model="previewMode" class="preview-tabs"><el-tab-pane label="页级文本" name="pages" /><el-tab-pane label="检索切片" name="chunks" /></el-tabs>
        <template v-if="previewMode === 'pages'">
          <div v-for="page in previewDocument.pages" :key="`${page.documentId}-${page.page}`" class="preview-page"><span>第 {{ page.page }} 页</span><pre>{{ page.text }}</pre></div>
        </template>
        <template v-else>
          <div v-for="(chunk, index) in previewDocument.chunks" :key="chunk.id" class="preview-page"><span>切片 {{ index + 1 }} · 第 {{ chunk.page }} 页 · 本地估算 {{ chunk.tokenCount }} Token</span><pre>{{ chunk.content }}</pre></div>
          <p v-if="!previewDocument.chunks.length" class="preview-empty">当前文档还没有生成切片。</p>
        </template>
      </div>
    </BaseModal>

    <BaseModal :open="uploadOpen" title="上传文档" @close="uploadOpen = false">
      <form class="modal-form" @submit.prevent="upload">
        <button class="upload-zone" type="button" @click="fileInput?.click()">
          <UploadCloud :size="28" /><strong>{{
            selectedFile?.name ?? '选择要上传的文档'
          }}</strong
          ><span>单个文件不超过 20 MB</span>
        </button>
        <input
          ref="fileInput"
          class="sr-only"
          type="file"
          accept=".pdf,.docx,.md,.txt"
          @change="chooseFile"
        />
        <div v-if="selectedFile" class="selected-file">
          <File :size="17" /><span>{{ selectedFile.name }}</span
          ><small
            >{{ Math.max(1, Math.round(selectedFile.size / 1024)) }} KB</small
          >
        </div>
        <p v-if="uploadError" class="form-error">{{ uploadError }}</p>
        <footer><el-button @click="uploadOpen = false">取消</el-button><el-button type="primary" native-type="submit" :disabled="!selectedFile" :loading="uploading">开始上传</el-button></footer>
      </form>
    </BaseModal>
  </main>
</template>
