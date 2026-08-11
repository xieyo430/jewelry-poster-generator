<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' }, // text, textarea
  variant: { type: String, default: 'filled' }, // filled, outlined
  error: { type: String, default: '' },
  helper: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  clearable: { type: Boolean, default: false },
  rows: { type: Number, default: 4 },
})
const emit = defineEmits(['update:modelValue'])

const focused = ref(false)

// outlined 有 label 时不需要 placeholder，label 本身就是提示
const effectivePlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder
  if (props.label && props.variant === 'outlined') return props.label
  return ' '
})

function onInput(e) {
  emit('update:modelValue', e.target.value)
}
function clear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div :class="['md3-field', `md3-field--${variant}`, { 'md3-field--error': error, 'md3-field--focused': focused }]">
    <template v-if="type === 'textarea'">
      <textarea
        :value="modelValue"
        :placeholder="placeholder || ' '"
        :disabled="disabled"
        :rows="rows"
        class="md3-field__textarea"
        @input="onInput"
        @focus="focused = true"
        @blur="focused = false"
      />
    </template>
    <template v-else>
      <input
        :value="modelValue"
        :placeholder="effectivePlaceholder"
        :disabled="disabled"
        class="md3-field__input"
        @input="onInput"
        @focus="focused = true"
        @blur="focused = false"
      />
      <label v-if="label" class="md3-field__label">{{ label }}</label>
      <button v-if="clearable && modelValue" class="md3-field__clear" @click="clear">&#10005;</button>
    </template>
    <div v-if="error" class="md3-field__error">{{ error }}</div>
    <div v-else-if="helper" class="md3-field__helper">{{ helper }}</div>
  </div>
</template>

<style scoped>
.md3-field__clear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--md-on-surface-variant);
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 50%;
}
.md3-field__clear:hover {
  background: color-mix(in srgb, var(--md-on-surface-variant) 12%, transparent);
}
</style>
