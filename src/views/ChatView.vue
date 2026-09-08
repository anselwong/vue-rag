<script setup lang="ts">
import {
  Bot,
  ChevronRight,
  FileText,
  LoaderCircle,
  MessageSquarePlus,
  Pencil,
  Send,
  Sparkles,
  Trash2,
  UserRound,
} from '@lucide/vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import BaseModal from '../components/BaseModal.vue'
import {
  deleteChatSession,
  listChatSessions,
  mapTokenUsage,
  renameChatSession,
  streamChatMessage,
  uniqueCitations,
} from '../services/rag'
import { useRagStore } from '../stores/rag'
import type { ChatMessage, ChatSession, Citation } from '../types/api'
import { formatDateTime } from '../utils/datetime'

const store = useRagStore()
const sessions = ref<ChatSession[]>([])
const activeSessionId = ref('')
const draft = ref('')
const sending = ref(false)
const sendError = ref('')
const activeCitation = ref<Citation | null>(null)
const contextMenu = ref<{ x: number; y: number; session: ChatSession } | null>(
  null,
)
const renameTarget = ref<ChatSession | null>(null)
const renameOpen = ref(false)
const renameValue = ref('')
const actionError = ref('')
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

function openContextMenu(event: MouseEvent, session: ChatSession) {
  event.preventDefault()
  // 菜单定位使用 fixed 坐标，跟随鼠标且不影响会话列表自身的布局滚动。
  contextMenu.value = {
    x: Math.min(event.clientX, window.innerWidth - 170),
    y: Math.min(event.clientY, window.innerHeight - 90),
    session,
  }
}

function closeContextMenu() {
  contextMenu.value = null
}

function beginRename() {
  if (!contextMenu.value) return
  renameTarget.value = contextMenu.value.session
  renameValue.value = contextMenu.value.session.title
  renameOpen.value = true
  closeContextMenu()
}

async function saveRename() {
  const session = renameTarget.value
  const title = renameValue.value.trim()
  if (!session || !title) return
  actionError.value = ''
  try {
    if (!session.id.startsWith('session-'))
      await renameChatSession(store.selectedKnowledgeBaseId, session.id, title)
    session.title = title
    renameOpen.value = false
    renameTarget.value = null
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '重命名失败'
  }
}

async function removeSession() {
  const target = contextMenu.value?.session
  closeContextMenu()
  if (!target) return
  if (!window.confirm(`确定删除会话“${target.title}”吗？`)) return
  actionError.value = ''
  try {
    if (!target.id.startsWith('session-'))
      await deleteChatSession(store.selectedKnowledgeBaseId, target.id)
    const index = sessions.value.findIndex((item) => item.id === target.id)
    if (index >= 0) sessions.value.splice(index, 1)
    if (activeSessionId.value === target.id)
      activeSessionId.value = sessions.value[0]?.id ?? ''
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '删除失败'
  }
}

async function send() {
  const content = draft.value.trim()
  if (!content || sending.value) return
  if (!activeSession.value) newSession()
  const session = activeSession.value!
  const now = formatDateTime(new Date())
  session.messages.push({
    id: `message-${Date.now()}`,
    role: 'user',
    content,
    createdAt: now,
  })
  if (session.title === '新对话') session.title = content.slice(0, 20)
  draft.value = ''
  sending.value = true
  sendError.value = ''
  await nextTick()
  messageArea.value?.scrollTo({
    top: messageArea.value.scrollHeight,
    behavior: 'smooth',
  })
  try {
    // 流式接口先返回会话 ID，再持续更新同一条助手消息，避免等待完整答案。
    const assistantMessage: ChatMessage = {
      id: `message-${Date.now()}`,
      role: 'assistant',
      content: '',
      createdAt: now,
      citations: [],
    }
    session.messages.push(assistantMessage)
    // 从响应式数组重新取对象；直接修改 push 前的普通对象引用不会触发 Vue 更新。
    const assistant = session.messages[session.messages.length - 1]
    await streamChatMessage(
      store.selectedKnowledgeBaseId,
      content,
      session.id.startsWith('session-') ? undefined : session.id,
      (event, data) => {
        if (
          event === 'meta' &&
          data.session_id &&
          session.id.startsWith('session-')
        ) {
          session.id = data.session_id
          activeSessionId.value = data.session_id
        } else if (event === 'delta') {
          // 不做定时器或 sleep，收到后端分片后立即交给 Vue 渲染。
          assistant.content += data.content ?? ''
        } else if (event === 'done') {
          assistant.citations = uniqueCitations(data.citations ?? [])
          // SSE 直接透传后端 snake_case 字段，必须和普通 JSON 接口一样转换，
          // 否则模板读取 promptTokens 等驼峰字段时只能得到 undefined。
          assistant.usage = mapTokenUsage(data.usage)
        } else if (event === 'error') {
          throw new Error(data.message ?? '流式问答失败')
        }
      },
    )
  } catch (error) {
    sendError.value =
      error instanceof Error ? error.message : '问答请求失败，请稍后重试'
  } finally {
    sending.value = false
  }
  await nextTick()
  messageArea.value?.scrollTo({
    top: messageArea.value.scrollHeight,
    behavior: 'smooth',
  })
}

onMounted(() => {
  load()
  window.addEventListener('click', closeContextMenu)
})
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
        @contextmenu="openContextMenu($event, session)"
      >
        <span>{{ session.title }}</span
        ><small>{{ formatDateTime(session.updatedAt) }}</small>
      </button>
      <div
        v-if="contextMenu"
        class="session-context-menu"
        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
        @click.stop
      >
        <button type="button" @click="beginRename">
          <Pencil :size="14" />重命名
        </button>
        <button type="button" class="danger" @click="removeSession">
          <Trash2 :size="14" />删除会话
        </button>
      </div>
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
              ><time>{{ formatDateTime(message.createdAt) }}</time>
            </div>
            <p>{{ message.content }}</p>
            <div v-if="message.role === 'assistant' && message.usage" class="message-usage" title="由模型 API 返回的真实 Token 用量">
              <span>本次用量</span><strong>{{ message.usage.totalTokens }}</strong><span>Token</span><i>输入 {{ message.usage.promptTokens }} · 输出 {{ message.usage.completionTokens }}</i>
            </div>
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
        <p v-if="sendError" class="form-error chat-error">{{ sendError }}</p>
      </footer>
    </section>

    <BaseModal
      :open="renameOpen"
      title="重命名会话"
      @close="renameOpen = false"
    >
      <form class="modal-form" @submit.prevent="saveRename">
        <label
          ><span>会话名称</span
          ><input v-model="renameValue" maxlength="120" autofocus
        /></label>
        <p v-if="actionError" class="form-error">{{ actionError }}</p>
        <footer>
          <button
            class="button secondary"
            type="button"
            @click="renameOpen = false"
          >
            取消</button
          ><button
            class="button primary"
            type="submit"
            :disabled="!renameValue.trim()"
          >
            保存
          </button>
        </footer>
      </form>
    </BaseModal>

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
