import type { ChatSession, EvaluationCase, KnowledgeBase, RagDocument, RetrievalResult } from '../types/api'

export const mockKnowledgeBases: KnowledgeBase[] = [
  { id: 'kb-product', name: '产品文档库', description: '产品设计、需求规范和发布说明', documentCount: 4, chunkCount: 186, updatedAt: '今天 10:24', color: '#2f8f78' },
  { id: 'kb-tech', name: '研发知识库', description: '技术方案、API 文档和故障手册', documentCount: 7, chunkCount: 342, updatedAt: '昨天 18:40', color: '#3468a5' },
  { id: 'kb-interview', name: '面试资料库', description: 'RAG 原理、项目复盘和高频问题', documentCount: 3, chunkCount: 128, updatedAt: '8 月 25 日', color: '#a5652e' },
]

export const mockDocuments: RagDocument[] = [
  { id: 'doc-1', knowledgeBaseId: 'kb-product', name: '智能知识库产品需求文档.pdf', type: 'PDF', size: '2.4 MB', chunkCount: 68, status: 'ready', createdAt: '今天 10:24' },
  { id: 'doc-2', knowledgeBaseId: 'kb-product', name: '检索与引用设计规范.docx', type: 'DOCX', size: '864 KB', chunkCount: 42, status: 'ready', createdAt: '昨天 17:31' },
  { id: 'doc-3', knowledgeBaseId: 'kb-product', name: 'v1.2-release-notes.md', type: 'MD', size: '126 KB', chunkCount: 31, status: 'ready', createdAt: '8 月 25 日' },
  { id: 'doc-4', knowledgeBaseId: 'kb-product', name: '用户反馈汇总.txt', type: 'TXT', size: '98 KB', chunkCount: 45, status: 'ready', createdAt: '8 月 24 日' },
  { id: 'doc-5', knowledgeBaseId: 'kb-tech', name: 'RAG 技术架构设计.pdf', type: 'PDF', size: '3.1 MB', chunkCount: 84, status: 'ready', createdAt: '昨天 14:20' },
  { id: 'doc-6', knowledgeBaseId: 'kb-tech', name: '向量数据库选型报告.pdf', type: 'PDF', size: '1.8 MB', chunkCount: 56, status: 'ready', createdAt: '8 月 24 日' },
]

export const mockSessions: ChatSession[] = [
  {
    id: 'session-1', title: '如何减少知识库回答幻觉？', updatedAt: '刚刚', messages: [
      { id: 'message-1', role: 'user', content: '如何减少知识库回答中的幻觉？', createdAt: '12:08' },
      { id: 'message-2', role: 'assistant', content: '可以从检索和生成两端同时控制。检索侧设置合理的相似度阈值，并使用混合检索提高召回质量；生成侧要求模型只能依据上下文回答，当证据不足时明确拒答。系统还应展示引用片段，让用户能够核验答案来源。', createdAt: '12:08', citations: [
        { id: 'citation-1', documentName: '检索与引用设计规范.docx', page: 6, content: '回答必须由检索上下文支持。当最高相关度低于阈值时，系统应返回证据不足，而不是要求模型自行补充。', score: 0.92 },
        { id: 'citation-2', documentName: '智能知识库产品需求文档.pdf', page: 18, content: '回答区域展示引用序号，点击后可定位到原始文档页码和对应文本片段。', score: 0.87 },
      ] },
    ],
  },
  { id: 'session-2', title: '切片大小如何选择？', updatedAt: '昨天', messages: [] },
  { id: 'session-3', title: '向量检索和关键词检索', updatedAt: '8 月 25 日', messages: [] },
]

export const mockRetrievalResults: RetrievalResult[] = [
  { id: 'result-1', rank: 1, documentName: '检索与引用设计规范.docx', page: 6, score: 0.92, keywords: ['拒答', '阈值'], content: '回答必须由检索上下文支持。当最高相关度低于阈值时，系统应返回证据不足，而不是要求模型自行补充。对于业务关键问题，引用信息需包含文档名称、页码和原始片段。' },
  { id: 'result-2', rank: 2, documentName: '智能知识库产品需求文档.pdf', page: 18, score: 0.87, keywords: ['引用', '溯源'], content: '回答区域展示引用序号，点击引用后可定位到原始文档页码和对应文本片段。用户可以通过来源信息判断生成内容是否可信。' },
  { id: 'result-3', rank: 3, documentName: '用户反馈汇总.txt', page: 3, score: 0.79, keywords: ['准确性', '反馈'], content: '多数用户希望系统在无法确定答案时明确说明，而不是给出看似完整但无法验证的内容。引用来源能够显著提高用户对结果的信任。' },
]

export const mockEvaluationCases: EvaluationCase[] = [
  { id: 'eval-1', question: '知识库支持哪些文件格式？', expectedSource: '智能知识库产品需求文档.pdf', status: 'passed', faithfulness: 0.94, retrievalScore: 0.91 },
  { id: 'eval-2', question: '相似度低于阈值时如何处理？', expectedSource: '检索与引用设计规范.docx', status: 'passed', faithfulness: 0.96, retrievalScore: 0.93 },
  { id: 'eval-3', question: '系统目前支持多少并发用户？', expectedSource: '智能知识库产品需求文档.pdf', status: 'review', faithfulness: 0.68, retrievalScore: 0.61 },
  { id: 'eval-4', question: '删除文档后向量如何处理？', expectedSource: '待补充', status: 'pending', faithfulness: null, retrievalScore: null },
]

export function mockDelay<T>(value: T, delay = 420): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), delay))
}

