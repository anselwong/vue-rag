<script setup lang="ts">
import { onMounted } from 'vue'

import AppSidebar from './components/AppSidebar.vue'
import AppTopbar from './components/AppTopbar.vue'
import { useRagStore } from './stores/rag'

const store = useRagStore()
onMounted(() => store.initialize())
</script>

<template>
  <div class="app-shell">
    <AppSidebar />
    <div class="app-main"><AppTopbar /><RouterView /></div>
  </div>
</template>
