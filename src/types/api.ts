export interface HealthResponse {
  status: 'ok'
  service: string
  version: string
  environment: string
  timestamp: string
}

export interface KnowledgeBase {
  id: string
  name: string
  description: string
  documentCount: number
  chunkCount: number
  updatedAt: string
  color: string
}

export type DocumentStatus = 'ready' | 'processing' | 'failed'

export interface RagDocument {
  id: string
  knowledgeBaseId: string
  name: string
  type: 'PDF' | 'DOCX' | 'MD' | 'TXT'
  size: string
  chunkCount: number
  status: DocumentStatus
  createdAt: string
}

export interface DocumentPage { documentId: string; page: number; text: string }
export interface DocumentChunk { id: string; documentId: string; page: number; content: string; tokenCount: number }
export interface DocumentDetail extends RagDocument { pages: DocumentPage[]; chunks: DocumentChunk[] }

export interface Citation {
  id: string
  documentName: string
  page: number
  content: string
  score: number
}

/** 模型 API 返回的真实用量；缺失表示供应商未在该次响应中提供 usage。 */
export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface ChatMessage {
  id: string
  sessionId?: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  citations?: Citation[]
  usage?: TokenUsage | null
}

export interface ChatSession {
  id: string
  title: string
  updatedAt: string
  messages: ChatMessage[]
}

export interface RetrievalOptions {
  topK: number
  scoreThreshold: number
  mode: 'vector' | 'hybrid'
}

export interface RetrievalResult extends Citation {
  rank: number
  keywords: string[]
}

export interface EvaluationCase {
  id: string
  question: string
  expectedSource: string
  status: 'passed' | 'review' | 'pending'
  faithfulness: number | null
  retrievalScore: number | null
  recallAtK?: number
  mrr?: number
  latencyMs?: number
}

/** Day 13 评测扫描：单组检索配置（模式 + 融合权重 + 阈值 + topK）。 */
export interface SweepConfig {
  mode: 'vector' | 'hybrid'
  vectorWeight: number
  keywordWeight: number
  threshold: number
  topK: number
}

/** 单组配置的聚合指标（后端已按 Recall@K 降序排列）。 */
export interface SweepResultRow extends SweepConfig {
  recallAtK: number
  mrr: number
  avgLatencyMs: number
  avgScore: number | null
  minScore: number | null
}

export interface SweepResponse {
  knowledgeBaseId: string
  caseCount: number
  results: SweepResultRow[]
  best: SweepResultRow | null
  thresholdAdvice: {
    currentDefault: number
    safeUpperBound: number | null
    note: string
  }
}
