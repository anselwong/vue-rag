# vue-rag

Vue 3 frontend for the RAG knowledge base.

## Local development

```bash
pnpm install
pnpm dev
```

Vite runs at `http://127.0.0.1:5173` and proxies `/api` requests to the FastAPI
server at `http://127.0.0.1:8000`.

The frontend uses the real FastAPI content API by default. Day 4 knowledge bases and
documents call FastAPI, while the later AI screens remain mocked. To use local demo
data instead, create `.env.local`:

```bash
VITE_USE_MOCK=true
VITE_API_BASE_URL=/api/v1
```

The planned backend contract is documented in [`docs/api-contract.md`](docs/api-contract.md).

Run a production build with:

```bash
pnpm build
```
