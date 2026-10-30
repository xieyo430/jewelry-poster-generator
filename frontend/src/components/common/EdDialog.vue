<script setup>
import EdIcon from './EdIcon.vue'

const props = defineProps({
  title: { type: String, default: '' },
  width: { type: [Number, String], default: 560 },
  closeOnOverlay: { type: Boolean, default: true },
  hideClose: Boolean,
})
const emit = defineEmits(['close'])

const onOverlay = () => { if (props.closeOnOverlay) emit('close') }
</script>

<template>
  <Teleport to="body">
    <div class="ed-overlay" @mousedown.self="onOverlay">
      <div
        class="ed-dialog"
        role="dialog"
        aria-modal="true"
        :style="{ width: typeof width === 'number' ? width + 'px' : width }"
      >
        <header class="ed-dialog__head">
          <h2 class="ed-dialog__title">{{ title }}</h2>
          <button
            v-if="!hideClose"
            type="button"
            class="ed-dialog__close"
            aria-label="关闭"
            @click="emit('close')"
          >
            <EdIcon name="close" :size="18" />
          </button>
        </header>
        <hr class="ed-rule" />

        <div class="ed-dialog__body">
          <slot />
        </div>

        <div v-if="$slots.footer" class="ed-dialog__foot">
          <hr class="ed-rule" />
          <div class="ed-dialog__actions">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ed-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ed-space-4);
  background: rgba(22, 21, 15, .5);
  animation: ed-fade var(--ed-base) var(--ed-ease);
}

.ed-dialog {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  max-height: 88vh;
  border: 1px solid var(--ed-ink);
  border-radius: var(--ed-radius);
  background: var(--ed-paper);
  animation: ed-rise var(--ed-base) var(--ed-ease);
}

.ed-dialog__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ed-space-4);
  padding: var(--ed-space-4) var(--ed-space-5) var(--ed-space-3);
}

.ed-dialog__title {
  font-family: var(--ed-serif);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--ed-ink);
}

.ed-dialog__close {
  display: flex;
  padding: var(--ed-space-1);
  border: 0;
  background: transparent;
  color: var(--ed-ink-faint);
  cursor: pointer;
  transition: color var(--ed-fast) var(--ed-ease);
}
.ed-dialog__close:hover { color: var(--ed-ink); }

.ed-dialog__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--ed-space-5);
}

.ed-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--ed-space-3);
  padding: var(--ed-space-4) var(--ed-space-5);
}

@keyframes ed-fade { from { opacity: 0; } }
@keyframes ed-rise { from { opacity: 0; transform: translateY(10px); } }
</style>
