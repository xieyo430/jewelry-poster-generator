<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  discountTypes: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择优惠类型' },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const search = ref('')
const dropdownRef = ref(null)

const categories = computed(() => {
  const cats = [...new Set(props.discountTypes.map(d => d.category).filter(Boolean))]
  const order = ['价格优惠', '赠品活动', '会员营销', '促销活动', '金融方案', '其他']
  return order.filter(c => cats.includes(c))
})

const getTypes = (cat) =>
  props.discountTypes
    .filter(d => d.category === cat)
    .filter(d => !search.value || d.name.toLowerCase().includes(search.value.toLowerCase()))

const selectedName = computed(() =>
  props.discountTypes.find(d => d.id === props.modelValue)?.name || ''
)

const hasResults = computed(() => categories.value.some(c => getTypes(c).length > 0))

const selectItem = (id) => {
  emit('update:modelValue', id)
  open.value = false
  search.value = ''
}

const toggleOpen = () => {
  open.value = !open.value
  if (!open.value) search.value = ''
}

const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    open.value = false
    search.value = ''
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div ref="dropdownRef" class="dts-wrapper">
    <button :class="['md3-field md3-field--outlined', { 'dts-open': open }]" @click="toggleOpen">
      <span :class="['dts-display', { 'dts-placeholder': !selectedName }]">
        {{ selectedName || placeholder }}
      </span>
      <svg class="dts-arrow" :class="{ 'dts-arrow--up': open }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </button>

    <Transition name="dts-drop">
      <div v-if="open" class="dts-dropdown">
        <div class="dts-search">
          <input
            v-model="search"
            class="dts-search-input"
            placeholder="搜索优惠类型..."
            @click.stop
          />
        </div>
        <div class="dts-list">
          <template v-for="cat in categories" :key="cat">
            <div v-if="getTypes(cat).length" class="dts-category">{{ cat }}</div>
            <button
              v-for="dt in getTypes(cat)"
              :key="dt.id"
              :class="['dts-item', { 'dts-item--selected': dt.id === modelValue }]"
              @click="selectItem(dt.id)"
            >
              {{ dt.name }}
            </button>
          </template>
          <div v-if="!hasResults" class="dts-empty">未找到匹配项</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dts-wrapper {
  position: relative;
  width: 100%;
}

.dts-open {
  border-color: var(--md-primary) !important;
}

.dts-display {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--md-body-medium);
  color: var(--md-on-surface);
}

.dts-placeholder {
  color: var(--md-on-surface-variant);
}

.dts-arrow {
  color: var(--md-on-surface-variant);
  transition: transform var(--md-duration-short4) var(--md-easing-standard);
  flex-shrink: 0;
  margin-left: 8px;
}

.dts-arrow--up {
  transform: rotate(180deg);
}

.dts-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--md-surface-container);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-medium);
  box-shadow: var(--md-elevation-2);
  z-index: 100;
  overflow: hidden;
}

.dts-search {
  padding: 8px;
  border-bottom: 1px solid var(--md-outline-variant);
}

.dts-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-small);
  background: var(--md-surface);
  color: var(--md-on-surface);
  font-size: var(--md-body-small);
  font-family: var(--md-font-family);
  outline: none;
  box-sizing: border-box;
}

.dts-search-input:focus {
  border-color: var(--md-primary);
}

.dts-list {
  max-height: 240px;
  overflow-y: auto;
  padding: 4px 0;
}

.dts-category {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--md-on-surface-variant);
  padding: 10px 16px 4px;
}

.dts-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--md-on-surface);
  font-size: var(--md-body-small);
  font-family: var(--md-font-family);
  cursor: pointer;
  transition: background var(--md-duration-short4) var(--md-easing-standard);
}

.dts-item:hover {
  background: var(--md-surface-container-high);
}

.dts-item--selected {
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  font-weight: 500;
}

.dts-empty {
  padding: 16px;
  text-align: center;
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
}

.dts-drop-enter-active {
  transition: all var(--md-duration-short4) var(--md-easing-standard);
}
.dts-drop-leave-active {
  transition: all var(--md-duration-short3) var(--md-easing-standard);
}
.dts-drop-enter-from,
.dts-drop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scaleY(0.95);
}
</style>
