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
| Send chat message | POST | `/knowledge-bases/{kb_id}/chat` | `ChatMessage` |
| Debug retrieval | POST | `/knowledge-bases/{kb_id}/retrieval/search` | `RetrievalResult[]` |
| List evaluation cases | GET | `/knowledge-bases/{kb_id}/evaluations` | `EvaluationCase[]` |
| Run evaluation | POST | `/knowledge-bases/{kb_id}/evaluations/run` | `EvaluationCase[]` |

Document upload uses `multipart/form-data` with a `file` field. Other POST endpoints use
JSON. Knowledge-base responses use snake_case fields from FastAPI; the frontend service
maps them to its camelCase view model. The final chat endpoint will move to SSE when
streaming generation is implemented.
