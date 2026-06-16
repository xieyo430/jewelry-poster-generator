<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  discountTypes: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择优惠类型' },
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)

const categories = computed(() => {
  const cats = [...new Set(props.discountTypes.map(d => d.category).filter(Boolean))]
  const order = ['价格优惠', '赠品活动', '会员营销', '促销活动', '金融方案', '其他']
  return order.filter(c => cats.includes(c))
})

const getTypes = (cat) => props.discountTypes.filter(d => d.category === cat)

const selectedName = computed(() => {
  const dt = props.discountTypes.find(d => d.id === props.modelValue)
  return dt ? dt.name : ''
})

const select = (dt) => {
  emit('update:modelValue', dt.id)
  open.value = false
}

// 点击外部关闭
const containerRef = ref(null)
const onClickOutside = (e) => {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    open.value = false
  }
}
import { onMounted, onUnmounted } from 'vue'
onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="containerRef" class="custom-select" tabindex="-1">
    <div class="select-trigger" :class="{ active: open }" @click="open = !open">
      <span :class="['trigger-text', { placeholder: !selectedName }]">
        {{ selectedName || placeholder }}
      </span>
      <span class="arrow" :class="{ up: open }">▾</span>
    </div>

    <Transition name="dropdown">
      <div v-if="open" class="select-dropdown">
        <template v-for="cat in categories" :key="cat">
          <div class="optgroup-label">{{ cat }}</div>
          <div
            v-for="dt in getTypes(cat)"
            :key="dt.id"
            :class="['option', { active: modelValue === dt.id }]"
            @mousedown.prevent="select(dt)"
          >
            <span class="option-name">{{ dt.name }}</span>
            <span class="option-desc">{{ dt.shortDesc || dt.inputPrompts }}</span>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.custom-select {
  position: relative;
  user-select: none;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  background: #0d0d1a;
  cursor: pointer;
  transition: border-color 0.2s;
  min-height: 20px;
}
.select-trigger:hover,
.select-trigger.active {
  border-color: #FFD700;
}

.trigger-text {
  font-size: 14px;
  color: #f0f0f0;
}
.trigger-text.placeholder {
  color: #555;
}

.arrow {
  font-size: 12px;
  color: #888;
  transition: transform 0.2s;
}
.arrow.up {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 360px;
  overflow-y: auto;
  background: #0d0d1a;
  border: 1px solid #2a2a4a;
  border-radius: 10px;
  z-index: 100;
  padding: 6px 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.optgroup-label {
  padding: 8px 14px 4px;
  font-size: 11px;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.optgroup-label:not(:first-child) {
  margin-top: 4px;
  border-top: 1px solid #1e1e3a;
  padding-top: 10px;
}

.option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.option:hover {
  background: rgba(255, 215, 0, 0.08);
}
.option.active {
  background: rgba(255, 215, 0, 0.12);
}

.option-name {
  font-size: 13px;
  color: #e0e0e0;
  flex-shrink: 0;
}
.option.active .option-name {
  color: #FFD700;
}

.option-desc {
  font-size: 11px;
  color: #666;
  text-align: right;
  flex-shrink: 0;
  max-width: 55%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 滚动条 */
.select-dropdown::-webkit-scrollbar { width: 4px; }
.select-dropdown::-webkit-scrollbar-track { background: transparent; }
.select-dropdown::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 2px; }

/* 弹出动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
