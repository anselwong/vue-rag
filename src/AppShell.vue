<script setup lang="ts">
import { onMounted } from 'vue'

import AppSidebar from './components/AppSidebar.vue'
import AppTopbar from './components/AppTopbar.vue'
import { useRagStore } from './stores/rag'
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'

const store = useRagStore()
const auth = useAuthStore()
const router = useRouter()
onMounted(() => { if (auth.isAuthenticated) store.initialize(true) })
function logout() { store.reset(); auth.logout(); router.push('/login') }
</script>

<template>
  <div class="app-shell">
    <AppSidebar />
    <div class="app-main"><AppTopbar @logout="logout" /><RouterView /></div>
  </div>
</template>
