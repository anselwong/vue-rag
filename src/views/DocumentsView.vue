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
      <label class="search-box"
        ><Search :size="17" /><input v-model="query" placeholder="搜索文档"
      /></label>
      <button class="button primary" type="button" @click="uploadOpen = true">
        <Plus :size="17" />上传文档
      </button>
    </section>

    <section class="table-panel">
      <header>
        <div>
          <h2>{{ store.selectedKnowledgeBase?.name }}</h2>
          <p>{{ documents.length }} 篇文档</p>
        </div>
        <span class="supported-formats">PDF · DOCX · MD · TXT</span>
      </header>
      <div class="data-table document-table">
        <div class="table-row table-head">
          <span>文档</span><span>大小</span><span>切片</span><span>状态</span
          ><span>上传时间</span><span></span>
        </div>
        <div v-if="loading" class="table-loading">
          <LoaderCircle class="spinning" :size="22" />正在加载
        </div>
        <div v-for="document in filtered" :key="document.id" class="table-row">
          <span class="document-name"
            ><span class="file-icon"><FileText :size="18" /></span
            ><span
              ><strong>{{ document.name }}</strong
              ><small>{{ document.type }}</small></span
            ></span
          >
          <span>{{ document.size }}</span
          ><span>{{ document.chunkCount || '—' }}</span>
          <span
            ><span :class="['document-status', document.status]"
              ><CheckCircle2
                v-if="document.status === 'ready'"
                :size="13"
              /><LoaderCircle v-else class="spinning" :size="13" />{{
                document.status === 'ready' ? '已索引' : '解析中'
              }}</span
            ></span
          >
          <span>{{ document.createdAt }}</span>
          <span class="document-actions"
            ><button
              class="icon-button quiet"
              type="button"
              title="查看解析文本"
              @click="preview(document)"
            ><Eye :size="16" /></button><button
              class="icon-button quiet danger"
              type="button"
              title="删除文档"
              @click="removeDocument(document)"
            >
              <Trash2 :size="16" /></button
          ></span>
        </div>
      </div>
    </section>

    <BaseModal :open="previewOpen" :title="previewDocument?.name ?? '解析文本'" @close="previewOpen = false">
      <div v-if="previewLoading" class="table-loading"><LoaderCircle class="spinning" :size="22" />正在读取解析结果</div>
      <div v-else-if="previewDocument" class="document-preview">
        <div class="preview-tabs" role="tablist" aria-label="解析结果类型">
          <button :class="{ active: previewMode === 'pages' }" type="button" @click="previewMode = 'pages'">页级文本（{{ previewDocument.pages.length }}）</button>
          <button :class="{ active: previewMode === 'chunks' }" type="button" @click="previewMode = 'chunks'">检索切片（{{ previewDocument.chunks.length }}）</button>
        </div>
        <template v-if="previewMode === 'pages'">
          <div v-for="page in previewDocument.pages" :key="`${page.documentId}-${page.page}`" class="preview-page"><span>第 {{ page.page }} 页</span><pre>{{ page.text }}</pre></div>
        </template>
        <template v-else>
          <div v-for="(chunk, index) in previewDocument.chunks" :key="chunk.id" class="preview-page"><span>切片 {{ index + 1 }} · 第 {{ chunk.page }} 页 · {{ chunk.tokenCount }} tokens</span><pre>{{ chunk.content }}</pre></div>
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
        <footer>
          <button
            class="button secondary"
            type="button"
            @click="uploadOpen = false"
          >
            取消</button
          ><button
            class="button primary"
            type="submit"
            :disabled="!selectedFile || uploading"
          >
            {{ uploading ? '上传中' : '开始上传' }}
          </button>
        </footer>
      </form>
    </BaseModal>
  </main>
</template>
