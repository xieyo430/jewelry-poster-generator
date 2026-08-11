<script setup>
defineProps({
  variant: { type: String, default: 'elevated' }, // elevated, filled, outlined
  clickable: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
})
defineEmits(['click'])
</script>

<template>
  <div
    :class="[
      'md3-card',
      `md3-card--${variant}`,
      { 'md3-card--clickable': clickable, 'md3-card--selected': selected }
    ]"
    @click="$emit('click')"
  >
    <div v-if="$slots.header" class="md3-card__header">
      <slot name="header" />
    </div>
    <slot />
  </div>
</template>

<style scoped>
.md3-card--clickable {
  cursor: pointer;
  transition: box-shadow var(--md-duration-short4) var(--md-easing-standard),
              background var(--md-duration-short4) var(--md-easing-standard),
              border-color var(--md-duration-short4) var(--md-easing-standard);
}
.md3-card--clickable:hover {
  box-shadow: var(--md-elevation-2);
}
.md3-card--selected {
  border-color: var(--md-primary) !important;
  background: color-mix(in srgb, var(--md-primary-container) 30%, var(--md-surface)) !important;
}
</style>
