import { mockDelay, mockDocuments, mockEvaluationCases, mockKnowledgeBases, mockRetrievalResults, mockSessions } from '../mock/data'
import type { ChatMessage, ChatSession, DocumentDetail, EvaluationCase, KnowledgeBase, RagDocument, RetrievalOptions, RetrievalResult } from '../types/api'
import { get, post, remove } from './http'

// 默认使用真实后端；只有显式设置 VITE_USE_MOCK=true 时才走本地演示数据。
export const useMockApi = (import.meta.env.VITE_USE_MOCK ?? 'false') === 'true'
// Day 4 只接通内容管理 API；AI 问答、检索和评测会在后续阶段接入后端。
const useMockAiApi = true

function mapKnowledgeBase(item: any): KnowledgeBase {
  return { ...item, documentCount: item.documentCount ?? item.document_count, chunkCount: item.chunkCount ?? item.chunk_count, updatedAt: item.updatedAt ?? item.updated_at }
}

function mapDocument(item: any): RagDocument {
  return { ...item, knowledgeBaseId: item.knowledgeBaseId ?? item.knowledge_base_id, chunkCount: item.chunkCount ?? item.chunk_count, createdAt: item.createdAt ?? item.created_at }
}

function mapDocumentDetail(item: any): DocumentDetail {
  return {
    ...mapDocument(item),
    pages: (item.pages ?? []).map((page: any) => ({ documentId: page.documentId ?? page.document_id, page: page.page, text: page.text })),
    chunks: (item.chunks ?? []).map((chunk: any) => ({ id: chunk.id, documentId: chunk.documentId ?? chunk.document_id, page: chunk.page, content: chunk.content, tokenCount: chunk.tokenCount ?? chunk.token_count })),
  }
}

export async function listKnowledgeBases(): Promise<KnowledgeBase[]> {
  return useMockApi ? mockDelay(structuredClone(mockKnowledgeBases)) : get<any[]>('/knowledge-bases').then((items) => items.map(mapKnowledgeBase))
}

export async function createKnowledgeBase(input: Pick<KnowledgeBase, 'name' | 'description'>): Promise<KnowledgeBase> {
  if (!useMockApi) return post<any>('/knowledge-bases', input).then(mapKnowledgeBase)
  return mockDelay({ id: `kb-${Date.now()}`, ...input, documentCount: 0, chunkCount: 0, updatedAt: '刚刚', color: '#6b7280' })
}

export async function listDocuments(knowledgeBaseId: string): Promise<RagDocument[]> {
  return useMockApi
    ? mockDelay(structuredClone(mockDocuments.filter((document) => document.knowledgeBaseId === knowledgeBaseId)))
    : get<any[]>(`/knowledge-bases/${knowledgeBaseId}/documents`).then((items) => items.map(mapDocument))
}

export async function uploadDocument(knowledgeBaseId: string, file: File): Promise<RagDocument> {
  if (!useMockApi) {
    const form = new FormData()
    form.append('file', file)
    return post<any>(`/knowledge-bases/${knowledgeBaseId}/documents`, form).then(mapDocument)
  }
  const extension = file.name.split('.').pop()?.toUpperCase()
  const type = ['PDF', 'DOCX', 'MD', 'TXT'].includes(extension ?? '') ? extension as RagDocument['type'] : 'TXT'
  return mockDelay({ id: `doc-${Date.now()}`, knowledgeBaseId, name: file.name, type, size: `${Math.max(1, Math.round(file.size / 1024))} KB`, chunkCount: 0, status: 'processing', createdAt: '刚刚' }, 650)
}

export async function getDocumentDetail(knowledgeBaseId: string, documentId: string): Promise<DocumentDetail> {
  if (!useMockApi) return get<any>(`/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`).then(mapDocumentDetail)
  const document = mockDocuments.find((item) => item.id === documentId)
  return mockDelay({ ...(document ?? { id: documentId, knowledgeBaseId, name: '演示文档.txt', type: 'TXT', size: '1 KB', chunkCount: 1, status: 'ready', createdAt: '刚刚' }), pages: [{ documentId, page: 1, text: '这是文档解析预览。接入 FastAPI 后，这里会展示真实的 PDF、DOCX、Markdown 或 TXT 文本，并保留页码元数据。' }], chunks: [{ id: `${documentId}-0`, documentId, page: 1, content: '这是文档解析预览。', tokenCount: 10 }] })
}

export async function deleteDocument(knowledgeBaseId: string, documentId: string): Promise<void> {
  if (useMockApi) return mockDelay(undefined, 260)
  return remove(`/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`)
}

export async function listChatSessions(knowledgeBaseId: string): Promise<ChatSession[]> {
  return useMockAiApi ? mockDelay(structuredClone(mockSessions), 240) : get(`/knowledge-bases/${knowledgeBaseId}/chat-sessions`)
}

export async function sendChatMessage(knowledgeBaseId: string, message: string): Promise<ChatMessage> {
  if (!useMockAiApi) return post(`/knowledge-bases/${knowledgeBaseId}/chat`, { message })
  return mockDelay({
    id: `message-${Date.now()}`,
    role: 'assistant',
    createdAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    content: '基于当前知识库，降低幻觉的关键是保证检索证据质量，并约束模型只依据检索上下文回答。建议同时设置相似度阈值、保留可追溯引用，并在证据不足时明确拒答。',
    citations: structuredClone(mockRetrievalResults.slice(0, 2)),
  }, 900)
}

export async function searchKnowledgeBase(knowledgeBaseId: string, query: string, options: RetrievalOptions): Promise<RetrievalResult[]> {
  if (!useMockAiApi) return post(`/knowledge-bases/${knowledgeBaseId}/retrieval/search`, { query, ...options })
  return mockDelay(structuredClone(mockRetrievalResults.slice(0, options.topK)), 620)
}

export async function listEvaluationCases(knowledgeBaseId: string): Promise<EvaluationCase[]> {
  return useMockAiApi ? mockDelay(structuredClone(mockEvaluationCases), 260) : get(`/knowledge-bases/${knowledgeBaseId}/evaluations`)
}

export async function runEvaluation(knowledgeBaseId: string): Promise<EvaluationCase[]> {
  if (!useMockAiApi) return post(`/knowledge-bases/${knowledgeBaseId}/evaluations/run`)
  return mockDelay(structuredClone(mockEvaluationCases.map((item) => item.status === 'pending' ? { ...item, status: 'passed' as const, faithfulness: 0.89, retrievalScore: 0.86 } : item)), 1200)
}
