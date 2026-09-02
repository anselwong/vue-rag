# Backend API contract

All endpoints use the `/api/v1` prefix. The frontend implementation is in
`src/services/rag.ts`; setting `VITE_USE_MOCK=false` switches every function to these APIs.

| Frontend action | Method | Endpoint | Response |
| --- | --- | --- | --- |
| List knowledge bases | GET | `/knowledge-bases` | `KnowledgeBase[]` |
| Create knowledge base | POST | `/knowledge-bases` | `KnowledgeBase` |
| List documents | GET | `/knowledge-bases/{kb_id}/documents` | `RagDocument[]` |
| Upload document | POST | `/knowledge-bases/{kb_id}/documents` | `RagDocument` |
| Delete document | DELETE | `/knowledge-bases/{kb_id}/documents/{document_id}` | `204 No Content` |
| Read parsed document | GET | `/knowledge-bases/{kb_id}/documents/{document_id}` | `DocumentDetailResponse` |
| List chat sessions | GET | `/knowledge-bases/{kb_id}/chat-sessions` | `ChatSession[]` |
| Rename chat session | PATCH | `/knowledge-bases/{kb_id}/chat-sessions/{session_id}` | `{ title }` |
| Delete chat session | DELETE | `/knowledge-bases/{kb_id}/chat-sessions/{session_id}` | `204 No Content` |
| Send chat message | POST | `/knowledge-bases/{kb_id}/chat` | `ChatMessage` |
| Stream chat message | POST | `/knowledge-bases/{kb_id}/chat/stream` | SSE `meta/delta/done/error` |
| Debug retrieval | POST | `/knowledge-bases/{kb_id}/retrieval/search` | `RetrievalResult[]` |
| List evaluation cases | GET | `/knowledge-bases/{kb_id}/evaluations` | `EvaluationCase[]` |
| Run evaluation | POST | `/knowledge-bases/{kb_id}/evaluations/run` | `EvaluationCase[]` |
| Generate evaluation cases | POST | `/knowledge-bases/{kb_id}/evaluations/generate` | `EvaluationCase[]` |

Document upload uses `multipart/form-data` with a `file` field. Other POST endpoints use
JSON. Knowledge-base responses use snake_case fields from FastAPI; the frontend service
maps them to its camelCase view model. The streaming endpoint sends a session ID in
`meta`, answer fragments in `delta`, and citations in `done`.
