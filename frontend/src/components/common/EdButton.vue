<script setup>
defineProps({
  variant: { type: String, default: 'outline' }, // solid | outline | text
  size: { type: String, default: 'md' },         // md | sm
  type: { type: String, default: 'button' },
  loading: Boolean,
  disabled: Boolean,
  block: Boolean,
})
</script>

<template>
  <button
    :type="type"
    :class="['ed-btn', `ed-btn--${variant}`, size === 'sm' && 'ed-btn--sm', block && 'ed-btn--block']"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="ed-btn__spin" aria-hidden="true"></span>
    <slot />
  </button>
</template>

<style scoped>
.ed-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ed-space-2);
  height: 40px;
  padding: 0 var(--ed-space-4);
  border: 1px solid var(--ed-ink);
  border-radius: var(--ed-radius);
  background: transparent;
  color: var(--ed-ink);
  font-family: var(--ed-sans);
  font-size: 14px;
  font-weight: 400;
  letter-spacing: .02em;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  transition: background var(--ed-fast) var(--ed-ease),
              color var(--ed-fast) var(--ed-ease),
              border-color var(--ed-fast) var(--ed-ease);
}
.ed-btn--sm { height: 30px; padding: 0 var(--ed-space-3); font-size: 13px; }
.ed-btn--block { width: 100%; }

.ed-btn--solid { background: var(--ed-accent); border-color: var(--ed-accent); color: var(--theme-on-primary, var(--ed-paper)); box-shadow: 0 8px 18px color-mix(in srgb, var(--ed-accent) 20%, transparent); }
.ed-btn--solid:hover:not(:disabled) { background: var(--ed-accent-deep); border-color: var(--ed-accent-deep); box-shadow: 0 10px 22px color-mix(in srgb, var(--ed-accent) 28%, transparent); }

.ed-btn--outline:hover:not(:disabled) { background: var(--ed-paper-deep); }
.ed-btn--outline:active:not(:disabled) { background: var(--ed-rule); }

.ed-btn--text { border-color: transparent; padding: 0 var(--ed-space-1); }
.ed-btn--text:hover:not(:disabled) { text-decoration: underline; text-underline-offset: 4px; }

.ed-btn:disabled { opacity: .35; cursor: not-allowed; }

.ed-btn__spin {
  position: relative;
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  border: 1.5px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: ed-btn-spin .85s cubic-bezier(.55,.05,.35,.95) infinite;
}
.ed-btn__spin::after {
  content: '';
  position: absolute;
  top: -2px;
  right: -1px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 14%, transparent);
}
@keyframes ed-btn-spin { to { transform: rotate(360deg); } }
</style>
