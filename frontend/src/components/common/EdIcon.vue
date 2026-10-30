<script setup>
const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 16 },
  strokeWidth: { type: Number, default: 1.5 },
})

// 全部图标为 24×24 描边路径，stroke 用 currentColor，由父级控制颜色
const PATHS = {
  'close':          ['M6 18L18 6M6 6l12 12'],
  'check':          ['M20 6L9 17l-5-5'],
  'arrow-right':    ['M5 12h14M13 6l6 6-6 6'],
  'arrow-left':     ['M19 12H5M11 18l-6-6 6-6'],
  'chevron-down':   ['M6 9l6 6 6-6'],
  'chevron-left':   ['M15 18l-6-6 6-6'],
  'chevron-right':  ['M9 18l6-6-6-6'],
  'edit':           ['M11 4H4v16h16v-7', 'M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z'],
  'trash':          ['M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6'],
  'plus':           ['M12 5v14M5 12h14'],
  'search':         ['M21 21l-5.2-5.2', 'M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z'],
  'calendar':       ['M8 2v4M16 2v4M3 10h18M5 4h14v18H5z'],
  'upload':         ['M12 16V4M7 9l5-5 5 5M4 20h16'],
  'download':       ['M12 4v12M7 11l5 5 5-5M4 20h16'],
  'eye':            ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z', 'M12 15a3 3 0 100-6 3 3 0 000 6z'],
  'eye-off':        ['M3 3l18 18', 'M10.6 10.6a3 3 0 004.2 4.2', 'M9.9 5.2A10 10 0 0112 5c6 0 10 7 10 7a17.17 17.17 0 01-3.3 4.3', 'M6.2 6.2A17.17 17.17 0 002 12s4 7 10 7a10 10 0 003.8-.8'],
  'gear':           ['M12 15a3 3 0 100-6 3 3 0 000 6z', 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z'],
  'help':           ['M12 22a10 10 0 100-20 10 10 0 000 20z', 'M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3', 'M12 17h.01'],
  'warning':        ['M12 3l9.5 17H2.5L12 3z', 'M12 9v5', 'M12 17h.01'],
  'sparkle':        ['M12 3l1.9 5.6L19.5 10l-5.6 1.4L12 17.5l-1.9-6.1L4.5 10l5.6-1.4L12 3z'],
  'image':          ['M3 5h18v14H3z', 'M8.5 11a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5z', 'M21 16l-5-5-9 8'],
  'zoom-in':        ['M21 21l-5.2-5.2', 'M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z', 'M10.5 7.5v6M7.5 10.5h6'],
}

const stroked = () => PATHS[props.name] || []
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    class="ed-icon"
  >
    <path v-for="(d, i) in stroked()" :key="i" :d="d" />
  </svg>
</template>

<style scoped>
.ed-icon { display: block; flex-shrink: 0; }
</style>
