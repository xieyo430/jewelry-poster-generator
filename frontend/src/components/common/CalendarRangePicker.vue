<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
})
const emit = defineEmits(['update:startDate', 'update:endDate'])

// ---- Presets ----
const presets = [
  { label: '3天', days: 3 },
  { label: '7天', days: 7 },
  { label: '15天', days: 15 },
  { label: '1个月', days: 30 },
]

const activePreset = ref(null)

function applyPreset(preset) {
  if (activePreset.value === preset.days) {
    // toggle off
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

// Sync activePreset when dates change externally
watch(() => [props.startDate, props.endDate], () => {
  if (!props.startDate || !props.endDate) {
    activePreset.value = null
    return
  }
  const diff = daysDiff(props.startDate, props.endDate) + 1
  const match = presets.find(p => p.days === diff)
  // Also check if startDate is today
  const todayStr = fmtDate(new Date())
  if (match && props.startDate === todayStr) {
    activePreset.value = match.days
  } else {
    activePreset.value = null
  }
})

// ---- Calendar state ----
const showCalendar = ref(false)
const calRef = ref(null)
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth()) // 0-based

const monthLabel = computed(() => `${viewYear.value}年${viewMonth.value + 1}月`)

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

// Build 6-row grid of dates for current view month
const calGrid = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1)
  // getDay(): 0=Sun, adjust to Mon=0
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const cells = []

  // Previous month padding
  const prevMonthDays = new Date(viewYear.value, viewMonth.value, 0).getDate()
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({
      day: prevMonthDays - i,
      date: new Date(viewYear.value, viewMonth.value - 1, prevMonthDays - i),
      outside: true,
    })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      date: new Date(viewYear.value, viewMonth.value, d),
      outside: false,
    })
  }

  // Next month padding (fill to 42 cells = 6 rows)
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
    // Start fresh
    emit('update:startDate', clicked)
    emit('update:endDate', '')
  } else {
    // Have start, no end
    if (clicked < props.startDate) {
      // Clicked before start → swap
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

// ---- Toggle calendar ----
function toggleCalendar() {
  showCalendar.value = !showCalendar.value
  if (showCalendar.value && props.startDate) {
    const d = new Date(props.startDate)
    viewYear.value = d.getFullYear()
    viewMonth.value = d.getMonth()
  }
}

// ---- Click outside ----
function handleClickOutside(e) {
  if (calRef.value && !calRef.value.contains(e.target)) {
    showCalendar.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))

// ---- Display text ----
const startDisplay = computed(() => props.startDate || '开始日期')
const endDisplay = computed(() => props.endDate || '结束日期')
const daysBetween = computed(() => {
  if (!props.startDate || !props.endDate) return 0
  return daysDiff(props.startDate, props.endDate) + 1
})
</script>

<template>
  <div class="crp">
    <!-- Preset chips -->
    <div class="crp__presets">
      <button
        v-for="p in presets"
        :key="p.days"
        :class="['md3-chip', activePreset === p.days ? 'md3-chip--selected' : 'md3-chip--outlined']"
        @click="applyPreset(p)"
      >
        {{ p.label }}
      </button>
    </div>

    <!-- Date inputs + calendar -->
    <div class="crp__inputs" ref="calRef">
      <button class="crp__field" @click="toggleCalendar">
        <svg class="crp__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span :class="['crp__value', { 'crp__value--empty': !startDate }]">{{ startDisplay }}</span>
      </button>
      <span class="crp__arrow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </span>
      <button class="crp__field" @click="toggleCalendar">
        <svg class="crp__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span :class="['crp__value', { 'crp__value--empty': !endDate }]">{{ endDisplay }}</span>
      </button>

      <!-- Calendar dropdown -->
      <Transition name="crp-drop">
        <div v-if="showCalendar" class="crp__cal">
          <!-- Month nav -->
          <div class="crp__cal-head">
            <button class="crp__nav-btn" @click="prevMonth">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span class="crp__cal-title">{{ monthLabel }}</span>
            <button class="crp__nav-btn" @click="nextMonth">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          <!-- Weekday headers -->
          <div class="crp__week-row">
            <span v-for="w in weekDays" :key="w" class="crp__week-cell">{{ w }}</span>
          </div>

          <!-- Day grid -->
          <div class="crp__day-grid">
            <button
              v-for="(cell, i) in calGrid"
              :key="i"
              :class="[
                'crp__day',
                {
                  'crp__day--outside': cell.outside,
                  'crp__day--today': isToday(cell.date),
                  'crp__day--start': isStart(cell.date),
                  'crp__day--end': isEnd(cell.date),
                  'crp__day--range': isInRange(cell.date),
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

    <!-- Footer -->
    <div class="crp__footer">
      <span v-if="daysBetween > 0" class="crp__info">共 {{ daysBetween }} 天</span>
      <button v-if="startDate || endDate" class="crp__clear" @click="clearAll">清除</button>
    </div>
  </div>
</template>

<style scoped>
.crp {
  width: 100%;
}

/* ---- Presets ---- */
.crp__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.md3-chip {
  height: 32px;
  padding: 0 16px;
  border-radius: var(--md-shape-small);
  font-size: var(--md-label-large);
  font-weight: 500;
  font-family: var(--md-font-family);
  cursor: pointer;
  transition: all var(--md-duration-short4) var(--md-easing-standard);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.md3-chip--outlined {
  background: transparent;
  border: 1px solid var(--md-outline);
  color: var(--md-on-surface);
}
.md3-chip--outlined:hover {
  background: color-mix(in srgb, var(--md-on-surface) 8%, transparent);
}

.md3-chip--selected {
  background: var(--md-primary-container);
  border: none;
  color: var(--md-on-primary-container);
}
.md3-chip--selected:hover {
  box-shadow: var(--md-elevation-1);
}

/* ---- Date fields ---- */
.crp__inputs {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.crp__field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-shape-extra-small);
  background: transparent;
  cursor: pointer;
  font-family: var(--md-font-family);
  transition: border-color var(--md-duration-short4) var(--md-easing-standard);
}
.crp__field:hover {
  border-color: var(--md-on-surface);
}

.crp__icon {
  flex-shrink: 0;
  color: var(--md-on-surface-variant);
  opacity: 0.7;
}

.crp__value {
  font-size: var(--md-body-medium);
  color: var(--md-on-surface);
  white-space: nowrap;
}
.crp__value--empty {
  color: var(--md-on-surface-variant);
  opacity: 0.6;
}

.crp__arrow {
  display: flex;
  align-items: center;
  color: var(--md-on-surface-variant);
  flex-shrink: 0;
}

/* ---- Calendar dropdown ---- */
.crp__cal {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--md-surface-container);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-medium);
  box-shadow: var(--md-elevation-2);
  padding: 10px;
  min-width: 260px;
}

.crp-drop-enter-active {
  transition: all var(--md-duration-short4) var(--md-easing-emphasized-decel);
}
.crp-drop-leave-active {
  transition: all var(--md-duration-short3) var(--md-easing-emphasized-accel);
}
.crp-drop-enter-from,
.crp-drop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scaleY(0.95);
}

/* Calendar header */
.crp__cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.crp__cal-title {
  font-size: var(--md-body-medium);
  font-weight: 600;
  color: var(--md-on-surface);
}

.crp__nav-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--md-shape-full);
  border: none;
  background: transparent;
  color: var(--md-on-surface-variant);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--md-duration-short4) var(--md-easing-standard);
}
.crp__nav-btn:hover {
  background: var(--md-surface-container-highest);
}

/* Weekday row */
.crp__week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 2px;
}

.crp__week-cell {
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--md-on-surface-variant);
  padding: 2px 0;
}

/* Day grid */
.crp__day-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}

.crp__day {
  width: 100%;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--md-shape-full);
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  color: var(--md-on-surface);
  cursor: pointer;
  font-family: var(--md-font-family);
  transition: all var(--md-duration-short3) var(--md-easing-standard);
  position: relative;
}

.crp__day:hover {
  background: color-mix(in srgb, var(--md-primary) 12%, transparent);
}

.crp__day--outside {
  color: var(--md-on-surface-variant);
  opacity: 0.35;
}

.crp__day--today {
  box-shadow: inset 0 0 0 1.5px var(--md-primary);
}

.crp__day--start,
.crp__day--end {
  background: var(--md-primary);
  color: var(--md-on-primary);
  font-weight: 600;
}
.crp__day--start:hover,
.crp__day--end:hover {
  background: var(--md-primary);
  filter: brightness(1.1);
}

.crp__day--range {
  background: color-mix(in srgb, var(--md-primary) 12%, transparent);
  border-radius: 0;
}
.crp__day--start {
  border-radius: var(--md-shape-full) 0 0 var(--md-shape-full);
}
.crp__day--end {
  border-radius: 0 var(--md-shape-full) var(--md-shape-full) 0;
}
.crp__day--start.crp__day--end {
  border-radius: var(--md-shape-full);
}

/* ---- Footer ---- */
.crp__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  min-height: 18px;
}

.crp__info {
  font-size: var(--md-body-small);
  color: var(--md-primary);
  font-weight: 500;
}

.crp__clear {
  background: transparent;
  border: none;
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
  cursor: pointer;
  padding: 2px 8px;
  border-radius: var(--md-shape-small);
  font-family: var(--md-font-family);
  transition: all var(--md-duration-short4) var(--md-easing-standard);
  margin-left: auto;
}
.crp__clear:hover {
  background: var(--md-surface-container-high);
  color: var(--md-on-surface);
}

/* ---- Responsive ---- */
@media (max-width: 480px) {
  .crp__inputs {
    flex-direction: column;
    gap: 8px;
  }
  .crp__arrow {
    transform: rotate(90deg);
  }
}
</style>
