<script setup lang="ts">
import { X } from '@lucide/vue'

defineProps<{ open: boolean; title: string }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="$emit('close')">
      <section class="modal" role="dialog" aria-modal="true" :aria-label="title">
        <header><h2>{{ title }}</h2><button class="icon-button quiet" type="button" title="关闭" @click="$emit('close')"><X :size="18" /></button></header>
        <slot />
      </section>
    </div>
  </Teleport>
</template>

