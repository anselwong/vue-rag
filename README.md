# vue-rag

Vue 3 frontend for the RAG knowledge base.

## Local development

```bash
pnpm install
pnpm dev
```

Vite runs at `http://127.0.0.1:5173` and proxies `/api` requests to the FastAPI
server at `http://127.0.0.1:8000`.

Run a production build with:

```bash
pnpm build
```
