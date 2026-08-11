<script setup>
defineProps({
  selected: { type: Boolean, default: false },
  dotColor: { type: String, default: '' },
  closable: { type: Boolean, default: false },
})
defineEmits(['click', 'close'])
</script>

<template>
  <button
    :class="['md3-chip', selected ? 'md3-chip--selected' : 'md3-chip--outlined']"
    @click="$emit('click')"
  >
    <span v-if="dotColor" class="md3-chip__dot" :style="{ background: dotColor }"></span>
    <span v-if="selected" class="md3-chip__check">&#10003;</span>
    <slot />
    <span v-if="closable" class="md3-chip__close" @click.stop="$emit('close')">&#10005;</span>
  </button>
</template>

<style scoped>
.md3-chip__close {
  font-size: 14px;
  opacity: 0.6;
  margin-left: -4px;
}
.md3-chip__close:hover { opacity: 1; }
</style>
