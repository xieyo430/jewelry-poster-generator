/**
 * 节日主题色工具。
 *
 * 海报生成仍然使用节日接口返回的原始色值；工作台则使用下方派生出的
 * UI 色值，保证浅色金/粉色也能在按钮、导航和文字上保持可读。
 */

export function hexToRgb(hex = '#000000') {
  const clean = String(hex).replace('#', '').trim()
  const normalized = clean.length === 3
    ? clean.split('').map(char => char + char).join('')
    : clean.padEnd(6, '0').slice(0, 6)
  const n = Number.parseInt(normalized, 16)
  if (Number.isNaN(n)) return [0, 0, 0]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h * 360, s, l]
}

function hslToHex(h, s, l) {
  h = (((h % 360) + 360) % 360) / 360
  s = Math.max(0, Math.min(1, s))
  l = Math.max(0, Math.min(1, l))
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  if (s === 0) { const v = Math.round(l * 255); return rgbToHex(v, v, v) }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return rgbToHex(
    hue2rgb(p, q, h + 1/3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1/3) * 255
  )
}

export function mixHex(base, target, amount = 0.5) {
  const [r1, g1, b1] = hexToRgb(base)
  const [r2, g2, b2] = hexToRgb(target)
  const t = Math.max(0, Math.min(1, amount))
  return rgbToHex(
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  )
}

function hexToRgba(hex, alpha) {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * 根据节日生成完整工作台主题。
 *
 * primaryRaw / secondaryRaw / bgRaw 给海报预览使用；theme-* 是工作台 UI
 * 使用的安全派生色。这样既保留节日的个性，也不会让浅色主色变成低对比
 * 的按钮或导航文字。
 */
export function deriveThemePalette(festival = {}) {
  const primaryRaw = festival.primaryColor || '#A86B18'
  const secondaryRaw = festival.secondaryColor || '#D9B45B'
  const bgRaw = festival.bgColor || '#211A12'
  const [h, s] = rgbToHsl(...hexToRgb(primaryRaw))
  const uiSaturation = Math.max(0.42, Math.min(1, s * 1.08))
  const uiLightness = Math.max(0.28, Math.min(0.46, 0.36 + s * 0.08))
  const primary = hslToHex(h, uiSaturation, uiLightness)
  const primaryDeep = hslToHex(h, uiSaturation, Math.max(0.18, uiLightness - 0.12))
  const deep = mixHex(primaryDeep, '#0C1118', 0.44)
  const secondary = ensureContrast(secondaryRaw, bgRaw, 4.5)
  const wash = mixHex('#F6F7F9', bgRaw, 0.12)
  const surface = mixHex('#FFFFFF', bgRaw, 0.1)
  const soft = mixHex('#FFFFFF', primary, 0.12)
  const border = mixHex('#FFFFFF', primary, 0.38)

  return {
    '--ed-accent': primary,
    '--ed-accent-deep': primaryDeep,
    '--ed-accent-tint': soft,
    '--theme-primary': primary,
    '--theme-primary-raw': primaryRaw,
    '--theme-primary-deep': primaryDeep,
    '--theme-secondary': secondary,
    '--theme-secondary-raw': secondaryRaw,
    '--theme-bg': bgRaw,
    '--theme-deep': deep,
    '--theme-wash': wash,
    '--theme-surface': surface,
    '--theme-soft': soft,
    '--theme-border': border,
    '--theme-on-primary': readableOn(primary),
    '--theme-on-deep': readableOn(deep),
    '--theme-glow': hexToRgba(primaryRaw, 0.16),
    '--theme-glow-secondary': hexToRgba(secondaryRaw, 0.13),
  }
}

// 默认值由 ed-tokens.css 的 :root 唯一持有；这里只记录运行时改过的 key，
// 重置时移除内联值，:root 默认即自动生效。
const appliedKeys = new Set()

export function applyPalette(palette) {
  const root = document.documentElement
  for (const [key, value] of Object.entries(palette)) {
    root.style.setProperty(key, value)
    appliedKeys.add(key)
  }
}

export function resetPalette() {
  const root = document.documentElement
  appliedKeys.forEach(key => root.style.removeProperty(key))
  appliedKeys.clear()
}

// WCAG 相对亮度（0-1）：sRGB 先线性化再加权
function channelLuminance(c) {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
}

export function contrastRatio(a, b) {
  const la = luminance(a), lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// 取与底色对比度更高的一方作为文字色
export function readableOn(bg) {
  return contrastRatio('#1A1A1A', bg) >= contrastRatio('#FFFFFF', bg) ? '#1A1A1A' : '#FFFFFF'
}

/**
 * 辅色对比度守护：辅色在底色上对比度不足时，向白/黑方向逐档插值直到达标。
 * 用于把节日 secondaryColor 变成可安全承担文字/描边的 accent。
 */
export function ensureContrast(fg, bg, min = 4.5) {
  if (contrastRatio(fg, bg) >= min) return fg
  const target = contrastRatio('#000000', bg) >= contrastRatio('#FFFFFF', bg) ? '#000000' : '#FFFFFF'
  const [r1, g1, b1] = hexToRgb(fg)
  const [r2, g2, b2] = hexToRgb(target)
  for (let t = 0.1; t <= 1.001; t += 0.1) {
    const out = rgbToHex(
      r1 + (r2 - r1) * t,
      g1 + (g2 - g1) * t,
      b1 + (b2 - b1) * t,
    )
    if (contrastRatio(out, bg) >= min) return out
  }
  return target
}
