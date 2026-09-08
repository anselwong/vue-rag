<script setup lang="ts">
import AppShell from './AppShell.vue'
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { router } from './router'

const auth = useAuthStore()
onMounted(async () => {
  await auth.initialize()
  window.addEventListener('rag-auth-expired', () => router.push('/login'))
})
</script>

<template><RouterView v-if="$route.name === 'login'" /><AppShell v-else /></template>
