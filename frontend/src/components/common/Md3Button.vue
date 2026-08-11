<script setup>
defineProps({
  variant: { type: String, default: 'filled' }, // filled, tonal, outlined, text
  size: { type: String, default: 'default' }, // default, small, large
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  icon: { type: Boolean, default: false },
})
</script>

<template>
  <button
    :class="[
      icon ? 'md3-icon-btn' : 'md3-btn',
      icon ? `md3-icon-btn--${variant}` : `md3-btn--${variant}`,
      size === 'small' && !icon ? 'md3-btn--small' : '',
      size === 'large' && !icon ? 'md3-btn--large' : '',
      { 'md3-btn--loading': loading }
    ]"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="md3-spinner md3-spinner--inline">
      <span class="md3-spinner__circle"></span>
    </span>
    <slot v-else />
  </button>
</template>

<style scoped>
.md3-btn--small { height: 32px; padding: 0 16px; font-size: var(--md-label-medium); }
.md3-btn--large { height: 48px; padding: 0 32px; font-size: var(--md-label-large); }
.md3-btn--loading { opacity: 0.7; pointer-events: none; }
</style>
