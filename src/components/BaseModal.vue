<script setup lang="ts">
defineProps<{ open: boolean; title: string }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <el-dialog class="app-dialog" :model-value="open" :title="title" width="min(520px, calc(100% - 32px))" @close="$emit('close')">
    <slot />
  </el-dialog>
</template>
