<script setup lang="ts">
import {
  Bot,
  ChevronRight,
  FileText,
  LoaderCircle,
  MessageSquarePlus,
  Send,
  Sparkles,
  UserRound,
} from '@lucide/vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import { listChatSessions, sendChatMessage } from '../services/rag'
import { useRagStore } from '../stores/rag'
import type { ChatMessage, ChatSession, Citation } from '../types/api'

const store = useRagStore()
const sessions = ref<ChatSession[]>([])
const activeSessionId = ref('')
const draft = ref('')
const sending = ref(false)
const activeCitation = ref<Citation | null>(null)
const messageArea = ref<HTMLElement | null>(null)
const activeSession = computed(() =>
  sessions.value.find((item) => item.id === activeSessionId.value),
)

async function load() {
  if (!store.selectedKnowledgeBaseId) return
  sessions.value = await listChatSessions(store.selectedKnowledgeBaseId)
  activeSessionId.value = sessions.value[0]?.id ?? ''
}

function newSession() {
  const session: ChatSession = {
    id: `session-${Date.now()}`,
    title: '新对话',
    updatedAt: '刚刚',
    messages: [],
  }
  sessions.value.unshift(session)
  activeSessionId.value = session.id
}

async function send() {
  const content = draft.value.trim()
  if (!content || sending.value) return
  if (!activeSession.value) newSession()
  const session = activeSession.value!
  const now = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  session.messages.push({
    id: `message-${Date.now()}`,
    role: 'user',
    content,
    createdAt: now,
  })
  if (session.title === '新对话') session.title = content.slice(0, 20)
  draft.value = ''
  sending.value = true
  await nextTick()
  messageArea.value?.scrollTo({
    top: messageArea.value.scrollHeight,
    behavior: 'smooth',
  })
  try {
    session.messages.push(
      await sendChatMessage(store.selectedKnowledgeBaseId, content),
    )
  } finally {
    sending.value = false
  }
  await nextTick()
  messageArea.value?.scrollTo({
    top: messageArea.value.scrollHeight,
    behavior: 'smooth',
  })
}

onMounted(load)
watch(() => store.selectedKnowledgeBaseId, load)
</script>

<template>
  <main class="chat-layout">
    <aside class="session-panel">
      <button class="button secondary full" type="button" @click="newSession">
        <MessageSquarePlus :size="17" />新建对话
      </button>
      <p class="session-label">最近对话</p>
      <button
        v-for="session in sessions"
        :key="session.id"
        :class="['session-item', { active: session.id === activeSessionId }]"
        type="button"
        @click="activeSessionId = session.id"
      >
        <span>{{ session.title }}</span
        ><small>{{ session.updatedAt }}</small>
      </button>
    </aside>

    <section class="conversation">
      <header class="conversation-header">
        <div>
          <span class="chat-bot-icon"><Sparkles :size="17" /></span
          ><span
            ><strong>知识库助手</strong
            ><small
              >{{ store.selectedKnowledgeBase?.name }} · 引用已开启</small
            ></span
          >
        </div>
      </header>
      <div ref="messageArea" class="message-area">
        <div v-if="!activeSession?.messages.length" class="chat-empty">
          <span><Bot :size="28" /></span>
          <h2>从知识库中寻找答案</h2>
          <p>输入一个与当前知识库相关的问题。</p>
          <button type="button" @click="draft = '如何减少知识库回答中的幻觉？'">
            如何减少回答幻觉？
          </button>
        </div>
        <article
          v-for="message in activeSession?.messages"
          :key="message.id"
          :class="['message', message.role]"
        >
          <span class="message-avatar"
            ><UserRound v-if="message.role === 'user'" :size="17" /><Bot
              v-else
              :size="18"
          /></span>
          <div class="message-body">
            <div class="message-meta">
              <strong>{{
                message.role === 'user' ? '你' : '知识库助手'
              }}</strong
              ><time>{{ message.createdAt }}</time>
            </div>
            <p>{{ message.content }}</p>
            <div v-if="message.citations?.length" class="citation-list">
              <button
                v-for="(citation, index) in message.citations"
                :key="citation.id"
                type="button"
                @click="activeCitation = citation"
              >
                <span>[{{ index + 1 }}]</span><FileText :size="14" />{{
                  citation.documentName
                }}
                · 第 {{ citation.page }} 页<ChevronRight :size="14" />
              </button>
            </div>
          </div>
        </article>
        <article v-if="sending" class="message assistant">
          <span class="message-avatar"><Bot :size="18" /></span>
          <div class="message-body typing">
            <LoaderCircle class="spinning" :size="16" />正在检索并生成回答
          </div>
        </article>
      </div>
      <footer class="composer">
        <textarea
          v-model="draft"
          rows="2"
          placeholder="向知识库提问..."
          @keydown.enter.exact.prevent="send"
        /><button
          class="send-button"
          type="button"
          title="发送"
          :disabled="!draft.trim() || sending"
          @click="send"
        >
          <Send :size="18" /></button
        ><small>回答内容由 AI 生成，请结合引用原文判断</small>
      </footer>
    </section>

    <aside v-if="activeCitation" class="citation-drawer">
      <header>
        <span>引用原文</span
        ><button
          class="icon-button quiet"
          type="button"
          title="关闭引用"
          @click="activeCitation = null"
        >
          ×
        </button>
      </header>
      <div>
        <span class="score"
          >相关度 {{ Math.round(activeCitation.score * 100) }}%</span
        >
        <h3>{{ activeCitation.documentName }}</h3>
        <p>第 {{ activeCitation.page }} 页</p>
        <blockquote>{{ activeCitation.content }}</blockquote>
      </div>
    </aside>
  </main>
</template>
