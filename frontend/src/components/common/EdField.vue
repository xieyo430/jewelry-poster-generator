<script setup>
import EdIcon from './EdIcon.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' },       // text | password | textarea
  rows: { type: Number, default: 4 },
  error: { type: String, default: '' },
  helper: { type: String, default: '' },
  required: Boolean,
  disabled: Boolean,
})
const emit = defineEmits(['update:modelValue'])

const onInput = (e) => emit('update:modelValue', e.target.value)
</script>

<template>
  <label class="ed-field" :class="{ 'is-error': error, 'is-disabled': disabled }">
    <span v-if="label || required" class="ed-field__head">
      <span class="ed-field__label ed-label">{{ label }}</span>
      <span v-if="required" class="ed-field__req ed-badge ed-badge--req">必选</span>
    </span>

    <textarea
      v-if="type === 'textarea'"
      class="ed-field__area"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      @input="onInput"
    />
    <input
      v-else
      class="ed-field__input"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="onInput"
    />

    <span v-if="error" class="ed-field__msg ed-field__msg--error">
      <EdIcon name="warning" :size="13" />
      {{ error }}
    </span>
    <span v-else-if="helper" class="ed-field__msg ed-meta">{{ helper }}</span>
  </label>
</template>

<style scoped>
.ed-field { display: block; width: 100%; }

.ed-field__head {
  display: flex;
  align-items: baseline;
  gap: var(--ed-space-2);
  margin-bottom: 7px;
}
.ed-field__req { text-transform: none; }
.ed-field__label { color: var(--ed-ink-soft); font-size: 12px; font-weight: 600; }

.ed-field__input,
.ed-field__area {
  display: block;
  width: 100%;
  padding: 11px 13px;
  border: 1px solid var(--ed-rule);
  border-radius: 9px;
  background: color-mix(in srgb, var(--theme-surface) 86%, var(--theme-soft));
  color: var(--ed-ink);
  font-family: var(--ed-sans);
  font-size: 14px;
  line-height: 1.6;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .65);
  transition: border-color var(--ed-fast) var(--ed-ease), background var(--ed-fast) var(--ed-ease), box-shadow var(--ed-fast) var(--ed-ease);
}
.ed-field__area { resize: vertical; min-height: 104px; }

.ed-field__input::placeholder,
.ed-field__area::placeholder { color: var(--ed-ink-faint); opacity: .9; }

.ed-field:hover .ed-field__input,
.ed-field:hover .ed-field__area { border-color: var(--ed-ink-faint); }

/* 只抹掉鼠标点击产生的默认描边。键盘 Tab 聚焦时必须保留全局 :focus-visible 焦点环——
   注意不能在基础规则里写 outline:none：scoped 样式会加 [data-v-xxx] 属性选择器，
   特异性 (0,2,0) 高于全局 :focus-visible 的 (0,1,0)，会把焦点环整个吃掉。 */
.ed-field__input:focus:not(:focus-visible),
.ed-field__area:focus:not(:focus-visible) { outline: none; }

.ed-field__input:focus,
.ed-field__area:focus {
  border-color: var(--ed-accent);
  background: var(--theme-surface);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ed-accent) 14%, transparent), inset 0 1px 0 rgba(255, 255, 255, .7);
}
.ed-field:focus-within .ed-field__label { color: var(--ed-accent); }

.ed-field.is-error .ed-field__input,
.ed-field.is-error .ed-field__area { border-color: var(--ed-danger); }

.ed-field.is-disabled { opacity: .45; }

.ed-field__msg {
  display: flex;
  align-items: center;
  gap: var(--ed-space-1);
  margin-top: var(--ed-space-2);
}
.ed-field__msg--error {
  font-size: var(--ed-label);
  color: var(--ed-danger);
}
</style>
