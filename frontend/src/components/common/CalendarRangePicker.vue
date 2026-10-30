<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import EdMark from './EdMark.vue'
import EdButton from './EdButton.vue'
import EdIcon from './EdIcon.vue'

const props = defineProps({
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
})
const emit = defineEmits(['update:startDate', 'update:endDate'])

const presets = [
  { label: '3天', days: 3 },
  { label: '7天', days: 7 },
  { label: '15天', days: 15 },
  { label: '1个月', days: 30 },
]

const activePreset = ref(null)

function applyPreset(preset) {
  if (activePreset.value === preset.days) {
    clearAll()
    return
  }
  const today = new Date()
  const end = new Date(today)
  end.setDate(end.getDate() + preset.days - 1)
  emit('update:startDate', fmtDate(today))
  emit('update:endDate', fmtDate(end))
  activePreset.value = preset.days
}

watch(() => [props.startDate, props.endDate], () => {
  if (!props.startDate || !props.endDate) {
    activePreset.value = null
    return
  }
  const diff = daysDiff(props.startDate, props.endDate) + 1
  const match = presets.find(p => p.days === diff)
  const todayStr = fmtDate(new Date())
  if (match && props.startDate === todayStr) {
    activePreset.value = match.days
  } else {
    activePreset.value = null
  }
})

const showCalendar = ref(false)
const calRef = ref(null)
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())

const monthLabel = computed(() => `${viewYear.value}年${viewMonth.value + 1}月`)

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

const calGrid = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1)
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const cells = []

  const prevMonthDays = new Date(viewYear.value, viewMonth.value, 0).getDate()
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({
      day: prevMonthDays - i,
      date: new Date(viewYear.value, viewMonth.value - 1, prevMonthDays - i),
      outside: true,
    })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      date: new Date(viewYear.value, viewMonth.value, d),
      outside: false,
    })
  }

  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      day: d,
      date: new Date(viewYear.value, viewMonth.value + 1, d),
      outside: true,
    })
  }

  return cells
})

function fmtDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysDiff(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000)
}

function isSameDay(d, dateStr) {
  return dateStr && fmtDate(d) === dateStr
}

function isToday(d) {
  return fmtDate(d) === fmtDate(new Date())
}

function isInRange(d) {
  if (!props.startDate || !props.endDate) return false
  const ds = fmtDate(d)
  return ds > props.startDate && ds < props.endDate
}

function isStart(d) { return isSameDay(d, props.startDate) }
function isEnd(d) { return isSameDay(d, props.endDate) }

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
}

function onDayClick(cell) {
  const clicked = fmtDate(cell.date)

  if (!props.startDate || (props.startDate && props.endDate)) {
    emit('update:startDate', clicked)
    emit('update:endDate', '')
  } else {
    if (clicked < props.startDate) {
      emit('update:endDate', props.startDate)
      emit('update:startDate', clicked)
    } else {
      emit('update:endDate', clicked)
    }
  }
}

function clearAll() {
  emit('update:startDate', '')
  emit('update:endDate', '')
  activePreset.value = null
}

function toggleCalendar() {
  showCalendar.value = !showCalendar.value
  if (showCalendar.value && props.startDate) {
    const d = new Date(props.startDate)
    viewYear.value = d.getFullYear()
    viewMonth.value = d.getMonth()
  }
}

function handleClickOutside(e) {
  if (calRef.value && !calRef.value.contains(e.target)) {
    showCalendar.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))

const startDisplay = computed(() => props.startDate || '开始日期')
const endDisplay = computed(() => props.endDate || '结束日期')
const daysBetween = computed(() => {
  if (!props.startDate || !props.endDate) return 0
  return daysDiff(props.startDate, props.endDate) + 1
})
</script>

<template>
  <div class="crp">
    <div class="crp__presets">
      <EdMark
        v-for="p in presets"
        :key="p.days"
        :selected="activePreset === p.days"
        @click="applyPreset(p)"
      >{{ p.label }}</EdMark>
    </div>

    <div class="crp__inputs" ref="calRef">
      <button type="button" class="crp__field" @click="toggleCalendar">
        <EdIcon name="calendar" :size="15" class="crp__icon" />
        <span :class="['crp__value', { 'is-empty': !startDate }]">{{ startDisplay }}</span>
      </button>
      <span class="crp__arrow">
        <EdIcon name="arrow-right" :size="15" />
      </span>
      <button type="button" class="crp__field" @click="toggleCalendar">
        <EdIcon name="calendar" :size="15" class="crp__icon" />
        <span :class="['crp__value', { 'is-empty': !endDate }]">{{ endDisplay }}</span>
      </button>
      <span v-if="daysBetween > 0" class="ed-badge crp__days">共 {{ daysBetween }} 天</span>

      <Transition name="crp-drop">
        <div v-if="showCalendar" class="crp__cal">
          <div class="crp__cal-head">
            <button type="button" class="crp__nav-btn" @click="prevMonth">
              <EdIcon name="chevron-left" :size="16" />
            </button>
            <span class="crp__cal-title">{{ monthLabel }}</span>
            <button type="button" class="crp__nav-btn" @click="nextMonth">
              <EdIcon name="chevron-right" :size="16" />
            </button>
          </div>

          <div class="crp__week-row">
            <span v-for="w in weekDays" :key="w" class="crp__week-cell">{{ w }}</span>
          </div>

          <div class="crp__day-grid">
            <button
              v-for="(cell, i) in calGrid"
              :key="i"
              :class="[
                'crp__day',
                {
                  'is-outside': cell.outside,
                  'is-today': isToday(cell.date),
                  'is-start': isStart(cell.date),
                  'is-end': isEnd(cell.date),
                  'is-range': isInRange(cell.date),
                },
              ]"
              @click="onDayClick(cell)"
            >
              {{ cell.day }}
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <div class="crp__footer">
      <EdButton v-if="startDate || endDate" variant="text" size="sm" @click="clearAll">
        <EdIcon name="trash" :size="13" />
        清空
      </EdButton>
    </div>
  </div>
</template>

<style scoped>
.crp__presets {
  display: flex;
  flex-wrap: wrap;
  column-gap: var(--ed-space-4);
  row-gap: var(--ed-space-1);
  padding-bottom: 9px;
  margin-bottom: var(--ed-space-4);
  border-bottom: 1px solid #c4cad3;
}

.crp__inputs {
  display: flex;
  align-items: center;
  gap: var(--ed-space-3);
  position: relative;
}

.crp__field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--ed-space-2);
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--ed-rule);
  border-radius: 9px;
  background: color-mix(in srgb, var(--theme-surface) 86%, var(--theme-soft));
  cursor: pointer;
  transition: border-color var(--ed-fast) var(--ed-ease), background var(--ed-fast) var(--ed-ease), box-shadow var(--ed-fast) var(--ed-ease);
}
.crp__field:hover { border-color: var(--ed-ink-faint); }
.crp__field:focus-visible { border-color: var(--ed-accent); background: var(--theme-surface); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ed-accent) 14%, transparent); }
.crp__icon { color: var(--ed-accent); }
.crp__value { font-size: 14px; color: var(--ed-ink); white-space: nowrap; }
.crp__value.is-empty { color: var(--ed-ink-faint); }
.crp__arrow { display: flex; color: var(--ed-ink-faint); flex-shrink: 0; }

.crp__cal {
  position: absolute;
  top: calc(100% + var(--ed-space-2));
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--ed-paper);
  border: 1px solid var(--ed-ink);
  padding: var(--ed-space-3) var(--ed-space-4);
  min-width: 260px;
}

.crp-drop-enter-active { transition: opacity var(--ed-fast) var(--ed-ease); }
.crp-drop-leave-active { transition: opacity var(--ed-fast) var(--ed-ease); }
.crp-drop-enter-from,
.crp-drop-leave-to { opacity: 0; }

.crp__cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--ed-space-2);
}
.crp__cal-title { font-size: 14px; font-weight: 600; color: var(--ed-ink); }
.crp__nav-btn {
  display: flex;
  border: 0;
  background: transparent;
  color: var(--ed-ink-faint);
  cursor: pointer;
  padding: var(--ed-space-1);
}
.crp__nav-btn:hover { color: var(--ed-ink); }

.crp__week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: var(--ed-space-1);
}
.crp__week-cell {
  text-align: center;
  font-size: 10px;
  color: var(--ed-ink-faint);
  padding: var(--ed-space-1) 0;
}

.crp__day-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.crp__day {
  box-sizing: border-box;
  width: 100%;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  font-size: 12px;
  color: var(--ed-ink);
  cursor: pointer;
}
.crp__day:hover { background: var(--ed-paper-deep); }
.crp__day.is-outside { color: var(--ed-ink-faint); opacity: .4; }
.crp__day.is-today { border: 1px solid var(--ed-ink); }
.crp__day.is-range { background: var(--ed-accent-tint); }
.crp__day.is-start,
.crp__day.is-end { background: var(--ed-accent-tint); font-weight: 700; }
.crp__day.is-start { border-right: 2px solid var(--ed-accent); }
.crp__day.is-end { border-left: 2px solid var(--ed-accent); }

.crp__days { flex-shrink: 0; text-transform: none; }

.crp__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: var(--ed-space-2);
  min-height: 24px;
}

@media (max-width: 480px) {
  .crp__inputs { flex-direction: column; gap: var(--ed-space-2); }
  .crp__arrow { transform: rotate(90deg); }
}
</style>
