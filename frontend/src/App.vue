<script setup>
import { toasts } from './composables/useToast'
</script>

<template>
  <RouterView />
  <Teleport to="body">
    <div class="toasts" aria-live="polite">
      <div
        v-for="t in toasts"
        :key="t.id"
        :class="['toast', `toast--${t.type}`]"
      >
        <span class="toast__mark" aria-hidden="true" />
        <span class="toast__msg">{{ t.msg }}</span>
      </div>
    </div>
  </Teleport>
</template>
