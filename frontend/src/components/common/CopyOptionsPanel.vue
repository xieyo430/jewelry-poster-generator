<script setup>
import { ref } from 'vue'
import EdButton from './EdButton.vue'
import EdIcon from './EdIcon.vue'
import EdDialog from './EdDialog.vue'

const props = defineProps({
  options: { type: Array, default: () => [] },
  loading: Boolean,
  error: { type: String, default: '' },
  filtered: Boolean,
  hasExisting: Boolean,
})
const emit = defineEmits(['refresh', 'apply'])

const pending = ref(null)
function onUse(opt) {
  if (props.hasExisting) pending.value = opt
  else emit('apply', opt, 'overwrite')
}
function resolve(mode) {
  emit('apply', pending.value, mode)
  pending.value = null
}
</script>

<template>
  <div>
    <div v-if="loading" class="copy-loading" aria-live="polite">
      <span class="copy-loading__bar copy-loading__bar--wide" />
      <span class="copy-loading__bar" />
      <span class="copy-loading__status">AI 正在整理 3 组候选文案…</span>
    </div>
    <div v-if="error" class="note">
      <EdIcon name="warning" :size="13" class="note__icon" />
      <span>{{ error }}</span>
    </div>

    <div v-if="options.length" class="cands">
      <span class="cands__head ed-label">
        AI 文案候选
        <span v-if="filtered" class="cands__flag">已自动替换违规表述</span>
      </span>
      <div v-for="(o, i) in options" :key="i" class="cand">
        <div class="cand__body">
          <p class="cand__title">{{ o.title }}</p>
          <p class="cand__sub ed-meta">{{ o.subtitle }}</p>
        </div>
        <EdButton variant="outline" size="sm" @click="onUse(o)">使用</EdButton>
      </div>
      <EdButton variant="text" size="sm" :disabled="loading" @click="emit('refresh')">
        <EdIcon name="sparkle" :size="14" />
        换一批
      </EdButton>
    </div>

    <EdDialog v-if="pending" title="已有文案内容" :width="400" @close="pending = null">
      <p class="dlg-text">是否用 AI 文案覆盖当前内容？</p>
      <template #footer>
        <EdButton variant="text" size="sm" @click="pending = null">取消</EdButton>
        <EdButton variant="outline" size="sm" @click="resolve('merge')">合并</EdButton>
        <EdButton variant="solid" size="sm" @click="resolve('overwrite')">覆盖</EdButton>
      </template>
    </EdDialog>
  </div>
</template>

<style scoped>
.cands {
  display: flex;
  flex-direction: column;
  gap: var(--ed-space-3);
  padding: var(--ed-space-4);
  border: 1px solid var(--ed-rule);
}
.cands__head { display: flex; align-items: center; gap: var(--ed-space-3); }
.cands__flag {
  font-size: 11px;
  letter-spacing: .02em;
  text-transform: none;
  color: var(--ed-danger);
}
.cand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ed-space-4);
  padding: var(--ed-space-2) 0;
  border-bottom: 1px solid #c4cad3;
}
.cand:last-of-type { border-bottom: 0; }
.cand__body { min-width: 0; }
.cand__title { font-size: 14px; font-weight: 600; color: var(--ed-ink); }
.cand__sub { margin-top: 2px; text-transform: none; letter-spacing: .02em; }
.dlg-text { font-size: 14px; color: var(--ed-ink-soft); }
.copy-loading { display: grid; gap: 9px; margin-top: var(--ed-space-3); padding: var(--ed-space-4); border: 1px solid color-mix(in srgb, var(--ed-accent) 20%, var(--ed-rule)); background: color-mix(in srgb, var(--ed-accent-tint) 42%, transparent); }
.copy-loading__bar { position: relative; display: block; width: 62%; height: 9px; overflow: hidden; border-radius: 999px; background: var(--ed-rule); }
.copy-loading__bar::after { content: ''; position: absolute; inset: 0 auto 0 -38%; width: 38%; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--ed-accent) 72%, white), transparent); animation: copy-sweep 1.35s ease-in-out infinite; }
.copy-loading__bar--wide { width: 84%; }
.copy-loading__status { display: inline-flex; align-items: center; gap: 8px; color: var(--ed-ink-faint); font-size: 11px; }
.copy-loading__status::before { content: ''; width: 8px; height: 8px; border: 1.5px solid var(--ed-accent); border-right-color: transparent; border-radius: 50%; animation: copy-spin .8s linear infinite; }
@keyframes copy-sweep { to { left: 100%; } }
@keyframes copy-spin { to { transform: rotate(360deg); } }
</style>
