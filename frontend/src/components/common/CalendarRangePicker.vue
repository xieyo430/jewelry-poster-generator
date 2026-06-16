<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
})

const emit = defineEmits(['update:startDate', 'update:endDate'])

// 年月
const year = ref(new Date().getFullYear())
const month = ref(new Date().getMonth() + 1)

const currentYear = computed(() => year.value)
const currentMonth = computed(() => month.value)

// 生成日历网格
const calendarGrid = computed(() => {
  const firstDay = new Date(year.value, month.value - 1, 1).getDay()
  const daysInMonth = new Date(year.value, month.value, 0).getDate()

  const grid = []
  // 填充前部空白
  for (let i = 0; i < firstDay; i++) {
    grid.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push(d)
  }
  return grid
})

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

const formatDate = (d) => {
  const m = String(month.value).padStart(2, '0')
  const day = String(d).padStart(2, '0')
  return `${year.value}-${m}-${day}`
}

const today = new Date()
const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

// 选择状态
const selecting = ref(false) // false=选开始, true=选结束

const isInRange = (d) => {
  if (!d) return false
  const dateStr = formatDate(d)
  if (!props.startDate && !props.endDate) return false
  if (props.startDate && props.endDate) {
    return dateStr >= props.startDate && dateStr <= props.endDate
  }
  if (props.startDate && selecting.value) {
    return dateStr >= props.startDate
  }
  return dateStr === props.startDate
}

const isStart = (d) => {
  if (!d || !props.startDate) return false
  return formatDate(d) === props.startDate
}

const isEnd = (d) => {
  if (!d || !props.endDate) return false
  return formatDate(d) === props.endDate
}

const isToday = (d) => {
  if (!d) return false
  return formatDate(d) === todayStr
}

const selectDay = (d) => {
  if (!d) return
  const dateStr = formatDate(d)

  if (!selecting.value) {
    // 选开始日期
    emit('update:startDate', dateStr)
    emit('update:endDate', '')
    selecting.value = true
  } else {
    // 选结束日期
    if (dateStr < props.startDate) {
      // 如果结束日期在开始日期之前，交换
      emit('update:endDate', props.startDate)
      emit('update:startDate', dateStr)
    } else {
      emit('update:endDate', dateStr)
    }
    selecting.value = false
  }
}

const prevMonth = () => {
  if (month.value === 1) {
    year.value--
    month.value = 12
  } else {
    month.value--
  }
}

const nextMonth = () => {
  if (month.value === 12) {
    year.value++
    month.value = 1
  } else {
    month.value++
  }
}

const reset = () => {
  emit('update:startDate', '')
  emit('update:endDate', '')
  selecting.value = false
}

const formatDisplay = (dateStr) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`
}
</script>

<template>
  <div class="calendar-picker">
    <div class="date-display">
      <div class="date-field" :class="{ active: !selecting && startDate, active: selecting }">
        <span class="date-label">开始日期</span>
        <span class="date-value">{{ formatDisplay(startDate) || '请选择' }}</span>
      </div>
      <span class="date-arrow">→</span>
      <div class="date-field" :class="{ active: selecting && endDate }">
        <span class="date-label">结束日期</span>
        <span class="date-value">{{ formatDisplay(endDate) || '请选择' }}</span>
      </div>
    </div>

    <div class="calendar-box">
      <div class="calendar-header">
        <button class="month-btn" @click="prevMonth">‹</button>
        <span class="month-title">{{ year }}年 {{ monthNames[month - 1] }}</span>
        <button class="month-btn" @click="nextMonth">›</button>
      </div>

      <div class="weekday-row">
        <span v-for="w in weekdays" :key="w" class="weekday">{{ w }}</span>
      </div>

      <div class="days-grid">
        <template v-for="d in calendarGrid" :key="d">
          <span v-if="d === null" class="day empty"></span>
          <button
            v-else
            :class="[
              'day',
              { 'in-range': isInRange(d) },
              { 'range-start': isStart(d) },
              { 'range-end': isEnd(d) },
              { today: isToday(d) },
            ]"
            @click="selectDay(d)"
          >
            {{ d }}
          </button>
        </template>
      </div>
    </div>

    <div class="calendar-footer">
      <span class="hint-text">{{ selecting ? '请选择结束日期' : '请选择开始日期' }}</span>
      <button class="clear-btn" @click="reset">清除</button>
    </div>
  </div>
</template>

<style scoped>
.calendar-picker {
  background: #0d0d1a;
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 16px;
  width: 100%;
  max-width: 380px;
}

.date-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #1e1e3a;
}

.date-field {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  text-align: center;
  transition: all 0.2s;
}

.date-field.active {
  border-color: #FFD700;
  background: rgba(255, 215, 0, 0.06);
}

.date-label {
  display: block;
  font-size: 11px;
  color: #888;
  margin-bottom: 2px;
}

.date-value {
  font-size: 13px;
  color: #ccc;
}

.date-field.active .date-value { color: #FFD700; }

.date-arrow { color: #555; font-size: 16px; }

.calendar-box { margin-bottom: 12px; }

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.month-btn {
  background: transparent;
  border: 1px solid #2a2a4a;
  color: #ccc;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.month-btn:hover { border-color: #FFD700; color: #FFD700; }

.month-title { font-size: 15px; font-weight: 600; color: #e0e0e0; }

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
}

.weekday {
  text-align: center;
  font-size: 11px;
  color: #666;
  padding: 4px 0;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #bbb;
  cursor: pointer;
  transition: all 0.15s;
}

.day:hover { background: rgba(255, 215, 0, 0.1); }

.day.empty { cursor: default; }

.day.in-range {
  background: rgba(255, 215, 0, 0.12);
  border-radius: 0;
}

.day.range-start,
.day.range-end {
  background: linear-gradient(135deg, #FFD700, #FF6B35);
  color: #000;
  font-weight: 700;
  border-radius: 8px;
}

.day.range-start { border-radius: 8px 0 0 8px; }
.day.range-end { border-radius: 0 8px 8px 0; }
.day.range-start.range-end { border-radius: 8px; }

.day.today {
  border: 1px solid #555;
}

.calendar-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #1e1e3a;
}

.hint-text { font-size: 11px; color: #666; }

.clear-btn {
  background: transparent;
  border: none;
  color: #FF6B6B;
  font-size: 12px;
  cursor: pointer;
}

.clear-btn:hover { text-decoration: underline; }
</style>
