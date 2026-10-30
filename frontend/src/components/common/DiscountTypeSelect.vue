<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import EdField from './EdField.vue'
import EdIcon from './EdIcon.vue'

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
  <div ref="dropdownRef" class="dts">
    <button type="button" :class="['dts__trigger', { 'is-open': open }]" @click="toggleOpen">
      <span :class="['dts__value', { 'is-placeholder': !selectedName }]">
        {{ selectedName || placeholder }}
      </span>
      <EdIcon name="chevron-down" :size="15" class="dts__arrow" :class="{ 'is-up': open }" />
    </button>

    <Transition name="dts-drop">
      <div v-if="open" class="dts__panel">
        <div class="dts__search">
          <EdIcon name="search" :size="14" class="dts__search-icon" />
          <EdField v-model="search" placeholder="搜索优惠类型..." />
        </div>
        <div class="dts__list">
          <template v-for="cat in categories" :key="cat">
            <div v-if="getTypes(cat).length" class="dts__cat ed-label">{{ cat }}</div>
            <button
              v-for="dt in getTypes(cat)"
              :key="dt.id"
              type="button"
              :class="['dts__item', { 'is-selected': dt.id === modelValue }]"
              @click="selectItem(dt.id)"
            >
              {{ dt.name }}
            </button>
          </template>
          <div v-if="!hasResults" class="dts__empty">
            <hr class="ed-rule" />
            <p class="ed-meta">未找到匹配项</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dts__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--ed-space-2);
  height: 40px;
  padding: 0;
  border: 0;
  border-bottom: 1px solid var(--ed-rule);
  background: transparent;
  cursor: pointer;
}
.dts__trigger:hover,
.dts__trigger.is-open { border-bottom-color: var(--ed-ink); }
.dts__value { flex: 1; text-align: left; font-size: 14px; color: var(--ed-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dts__value.is-placeholder { color: var(--ed-ink-faint); }
.dts__arrow { color: var(--ed-ink-faint); transition: transform var(--ed-fast) var(--ed-ease); }
.dts__arrow.is-up { transform: rotate(180deg); }

.dts__panel {
  position: absolute;
  top: calc(100% + var(--ed-space-2));
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--ed-paper);
  border: 1px solid var(--ed-ink);
}

.dts-drop-enter-active { transition: opacity var(--ed-fast) var(--ed-ease); }
.dts-drop-leave-active { transition: opacity var(--ed-fast) var(--ed-ease); }
.dts-drop-enter-from,
.dts-drop-leave-to { opacity: 0; }

.dts__search {
  display: flex;
  align-items: flex-end;
  gap: var(--ed-space-2);
  padding: var(--ed-space-3) var(--ed-space-4) 0;
}
.dts__search-icon { color: var(--ed-ink-faint); margin-bottom: var(--ed-space-2); }

.dts__list { max-height: 260px; overflow-y: auto; padding: var(--ed-space-2) 0 var(--ed-space-3); }
.dts__cat { padding: var(--ed-space-3) var(--ed-space-4) var(--ed-space-1); color: var(--ed-ink-faint); }
.dts__item {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--ed-space-2) var(--ed-space-4);
  border: 0;
  border-left: 2px solid transparent;
  background: transparent;
  color: var(--ed-ink);
  font-size: 14px;
  cursor: pointer;
}
.dts__item:hover { background: var(--ed-paper-deep); }
.dts__item.is-selected { border-left-color: var(--ed-accent); font-weight: 600; }

.dts__empty { padding: var(--ed-space-4); text-align: center; }
.dts__empty .ed-meta { display: block; margin-top: var(--ed-space-3); text-transform: none; }
</style>
