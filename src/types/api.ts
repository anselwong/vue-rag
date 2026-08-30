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

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  citations?: Citation[]
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
}
