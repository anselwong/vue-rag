import { mockDelay, mockDocuments, mockEvaluationCases, mockKnowledgeBases, mockRetrievalResults, mockSessions } from '../mock/data'
import type { ChatMessage, ChatSession, Citation, DocumentDetail, EvaluationCase, KnowledgeBase, RagDocument, RetrievalOptions, RetrievalResult, SweepConfig, SweepResponse, SweepResultRow, TokenUsage } from '../types/api'
import { get, patch, post, remove } from './http'
import { formatDateTime } from '../utils/datetime'

// 默认使用真实后端；只有显式设置 VITE_USE_MOCK=true 时才走本地演示数据。
export const useMockApi = (import.meta.env.VITE_USE_MOCK ?? 'false') === 'true'
// 评测仍保留 mock；Day 7 聊天已切换真实后端。
const useMockAiApi = false
const useMockRetrievalApi = false

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

/** 将普通 JSON 与 SSE 返回的 snake_case usage 统一为前端消息字段。 */
export function mapTokenUsage(item: any): TokenUsage | null {
  if (!item) return null
  const promptTokens = item.promptTokens ?? item.prompt_tokens
  const completionTokens = item.completionTokens ?? item.completion_tokens
  const totalTokens = item.totalTokens ?? item.total_tokens
  if (promptTokens === undefined || completionTokens === undefined || totalTokens === undefined) return null
  return { promptTokens, completionTokens, totalTokens }
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
  if (useMockAiApi) return mockDelay(structuredClone(mockSessions), 240)
  return get<any[]>(`/knowledge-bases/${knowledgeBaseId}/chat-sessions`).then((items) => items.map((item) => ({
    id: item.id,
    title: item.title,
    updatedAt: item.updatedAt ?? item.updated_at,
    messages: (item.messages ?? []).map((message: any) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt ?? message.created_at,
      citations: uniqueCitations(message.citations ?? []),
      usage: mapTokenUsage(message.usage),
    })),
  })))
}

export async function renameChatSession(knowledgeBaseId: string, sessionId: string, title: string): Promise<void> {
  if (useMockAiApi) return
  await patch(`/knowledge-bases/${knowledgeBaseId}/chat-sessions/${sessionId}`, { title })
}

export async function deleteChatSession(knowledgeBaseId: string, sessionId: string): Promise<void> {
  if (useMockAiApi) return
  await remove(`/knowledge-bases/${knowledgeBaseId}/chat-sessions/${sessionId}`)
}

export async function sendChatMessage(knowledgeBaseId: string, message: string, sessionId?: string): Promise<ChatMessage> {
  if (!useMockAiApi) {
    return post<any>(`/knowledge-bases/${knowledgeBaseId}/chat`, { message, session_id: sessionId }).then((item) => ({
      id: item.id,
      sessionId: item.session_id ?? item.sessionId,
      role: item.role,
      content: item.content,
      createdAt: item.createdAt ?? new Date().toLocaleString('zh-CN', { hour12: false }),
      // 一个文档可能被切成多个 chunk；回答仍使用全部 chunk，但 UI 按文档+页码去重，避免重复卡片。
      citations: uniqueCitations(item.citations ?? []),
      usage: mapTokenUsage(item.usage),
    }))
  }
  return mockDelay({
    id: `message-${Date.now()}`,
    role: 'assistant',
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    content: '基于当前知识库，降低幻觉的关键是保证检索证据质量，并约束模型只依据检索上下文回答。建议同时设置相似度阈值、保留可追溯引用，并在证据不足时明确拒答。',
    citations: structuredClone(mockRetrievalResults.slice(0, 2)),
  }, 900)
}

/** SSE 增量消费：每收到一个 data 片段就回调，避免等待完整回答才刷新界面。 */
export async function streamChatMessage(knowledgeBaseId: string, message: string, sessionId: string | undefined, onEvent: (event: string, data: any) => void): Promise<void> {
  const base = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
  const response = await fetch(`${base}/knowledge-bases/${knowledgeBaseId}/chat/stream`, {
    method: 'POST', headers: { Accept: 'text/event-stream', 'Content-Type': 'application/json' }, body: JSON.stringify({ message, session_id: sessionId }),
  })
  if (!response.ok || !response.body) throw new Error(`请求失败（HTTP ${response.status}）`)
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''
    events.forEach((block) => {
      // SSE 规范允许 LF 或 CRLF；trim 可避免事件名携带尾部的 \r 导致分支匹配失败。
      const type = block.split('\n').find((line) => line.startsWith('event: '))?.slice(7).trim() ?? 'message'
      const line = block.split('\n').find((value) => value.startsWith('data: '))
      if (line) {
        try { onEvent(type, JSON.parse(line.slice(6))) } catch { onEvent(type, { content: line.slice(6) }) }
      }
    })
    if (done) break
  }
}

export function uniqueCitations(items: any[]): Citation[] {
  const seen = new Set<string>()
  return items
    .map((citation) => ({ ...citation, documentName: citation.documentName ?? citation.document_name }))
    .filter((citation) => {
      const key = `${citation.documentName}:${citation.page}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export async function searchKnowledgeBase(knowledgeBaseId: string, query: string, options: RetrievalOptions): Promise<RetrievalResult[]> {
  if (!useMockRetrievalApi) {
    return post<any[]>(`/knowledge-bases/${knowledgeBaseId}/retrieval/search`, { query, top_k: options.topK, score_threshold: options.scoreThreshold, mode: options.mode }).then((items) => items.map((item) => ({ ...item, documentName: item.documentName ?? item.document_name })))
  }
  return mockDelay(structuredClone(mockRetrievalResults.slice(0, options.topK)), 620)
}

export async function listEvaluationCases(knowledgeBaseId: string): Promise<EvaluationCase[]> {
  if (useMockAiApi) return mockDelay(structuredClone(mockEvaluationCases), 260)
  return get<any[]>(`/knowledge-bases/${knowledgeBaseId}/evaluations`).then((items) => items.map(mapEvaluationCase))
}

export async function runEvaluation(knowledgeBaseId: string): Promise<EvaluationCase[]> {
  if (!useMockAiApi) return post<any[]>(`/knowledge-bases/${knowledgeBaseId}/evaluations/run`).then((items) => items.map(mapEvaluationCase))
  return mockDelay(structuredClone(mockEvaluationCases.map((item) => item.status === 'pending' ? { ...item, status: 'passed' as const, faithfulness: 0.89, retrievalScore: 0.86 } : item)), 1200)
}

export async function generateEvaluationCases(knowledgeBaseId: string): Promise<EvaluationCase[]> {
  if (useMockAiApi) return mockDelay(structuredClone(mockEvaluationCases), 300)
  return post<any[]>(`/knowledge-bases/${knowledgeBaseId}/evaluations/generate`).then((items) => items.map(mapEvaluationCase))
}

/** Day 13 参数扫描：一次跑多组检索配置对比召回质量；configs 为空时后端使用内置默认扫描集。 */
export async function runEvaluationSweep(knowledgeBaseId: string, configs?: SweepConfig[]): Promise<SweepResponse> {
  const payload = configs?.length
    ? { configs: configs.map((item) => ({ mode: item.mode, vector_weight: item.vectorWeight, keyword_weight: item.keywordWeight, threshold: item.threshold, top_k: item.topK })) }
    : {}
  return post<any>(`/knowledge-bases/${knowledgeBaseId}/evaluations/sweep`, payload).then(mapSweepResponse)
}

function mapSweepRow(item: any): SweepResultRow {
  return { ...item, vectorWeight: item.vectorWeight ?? item.vector_weight, keywordWeight: item.keywordWeight ?? item.keyword_weight, topK: item.topK ?? item.top_k, recallAtK: item.recallAtK ?? item.recall_at_k, avgLatencyMs: item.avgLatencyMs ?? item.avg_latency_ms, avgScore: item.avgScore ?? item.avg_score, minScore: item.minScore ?? item.min_score }
}

function mapSweepResponse(item: any): SweepResponse {
  const advice = item.thresholdAdvice ?? item.threshold_advice ?? {}
  return {
    knowledgeBaseId: item.knowledgeBaseId ?? item.knowledge_base_id,
    caseCount: item.caseCount ?? item.case_count,
    results: (item.results ?? []).map(mapSweepRow),
    best: item.best ? mapSweepRow(item.best) : null,
    thresholdAdvice: { currentDefault: advice.currentDefault ?? advice.current_default ?? 0.35, safeUpperBound: advice.safeUpperBound ?? advice.safe_upper_bound ?? null, note: advice.note ?? '' },
  }
}

function mapEvaluationCase(item: any): EvaluationCase {
  return { ...item, expectedSource: item.expectedSource ?? item.expected_source, retrievalScore: item.retrievalScore ?? item.retrieval_score, faithfulness: item.faithfulness ?? null, recallAtK: item.recallAtK ?? item.recall_at_k, mrr: item.mrr, latencyMs: item.latencyMs ?? item.latency_ms }
}
