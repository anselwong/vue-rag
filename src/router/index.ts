import { createRouter, createWebHistory } from 'vue-router'

import ChatView from '../views/ChatView.vue'
import DashboardView from '../views/DashboardView.vue'
import DocumentsView from '../views/DocumentsView.vue'
import EvaluationView from '../views/EvaluationView.vue'
import KnowledgeBasesView from '../views/KnowledgeBasesView.vue'
import RetrievalView from '../views/RetrievalView.vue'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '../stores/auth'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { title: '登录' } },
    { path: '/', name: 'dashboard', component: DashboardView, meta: { title: '系统概览', eyebrow: '工作台', requiresAuth: true } },
    { path: '/knowledge-bases', name: 'knowledge-bases', component: KnowledgeBasesView, meta: { title: '知识库', eyebrow: '内容管理', requiresAuth: true } },
    { path: '/documents', name: 'documents', component: DocumentsView, meta: { title: '文档管理', eyebrow: '内容管理', requiresAuth: true } },
    { path: '/chat', name: 'chat', component: ChatView, meta: { title: '知识问答', eyebrow: 'RAG 对话', requiresAuth: true } },
    { path: '/retrieval', name: 'retrieval', component: RetrievalView, meta: { title: '检索调试', eyebrow: '效果优化', requiresAuth: true } },
    { path: '/evaluation', name: 'evaluation', component: EvaluationView, meta: { title: '效果评测', eyebrow: '效果优化', requiresAuth: true } },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.name === 'login' && auth.isAuthenticated) return { name: 'dashboard' }
})
