/**
 * MD3 Color Utilities
 * Generates Material Design 3 tonal palettes from seed colors.
 */

// Hex ↔ RGB
function hexToRgb(hex) {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]
  const n = parseInt(hex, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('')
}

// RGB ↔ HSL
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

function hslToRgb(h, s, l) {
  h /= 360
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v] }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255)
  ]
}

/**
 * MD3 Tone → HSL Lightness mapping
 * Tone 0 = black, Tone 100 = white
 */
const TONE_TO_L = {
  0: 0, 4: 0.04, 6: 0.06, 10: 0.10, 12: 0.12,
  17: 0.17, 20: 0.20, 22: 0.22, 24: 0.24, 25: 0.25,
  30: 0.30, 35: 0.35, 40: 0.40, 50: 0.50,
  60: 0.60, 70: 0.70, 80: 0.80, 87: 0.87,
  90: 0.90, 92: 0.92, 94: 0.94, 95: 0.95, 96: 0.96, 98: 0.98, 99: 0.99, 100: 1
}

/**
 * Generate a hex color from HSL hue/saturation and a tone level
 */
function toneColor(hue, sat, tone) {
  const l = TONE_TO_L[tone] ?? (tone / 100)
  // Reduce saturation for very light/dark tones
  let s = sat
  if (tone <= 10 || tone >= 95) s *= 0.6
  else if (tone <= 20 || tone >= 90) s *= 0.85
  const [r, g, b] = hslToRgb(hue, s, l)
  return rgbToHex(r, g, b)
}

/**
 * Generate a full MD3 tonal palette from a seed hex color.
 * Returns an object keyed by CSS variable names.
 */
export function generateTonalPalette(seedHex) {
  const [r, g, b] = hexToRgb(seedHex)
  const [hue, sat] = rgbToHsl(r, g, b)

  return {
    '--md-source': seedHex,
    // Primary
    '--md-primary': toneColor(hue, sat, 40),
    '--md-on-primary': '#ffffff',
    '--md-primary-container': toneColor(hue, sat, 90),
    '--md-on-primary-container': toneColor(hue, sat, 10),
    // Secondary (same hue, lower saturation)
    '--md-secondary': toneColor(hue, sat * 0.5, 40),
    '--md-on-secondary': '#ffffff',
    '--md-secondary-container': toneColor(hue, sat * 0.5, 90),
    '--md-on-secondary-container': toneColor(hue, sat * 0.5, 10),
    // Tertiary (same hue, shifted)
    '--md-tertiary': toneColor((hue + 60) % 360, sat * 0.7, 40),
    '--md-on-tertiary': '#ffffff',
    '--md-tertiary-container': toneColor((hue + 60) % 360, sat * 0.7, 90),
    '--md-on-tertiary-container': toneColor((hue + 60) % 360, sat * 0.7, 10),
    // Error
    '--md-error': '#ba1a1a',
    '--md-on-error': '#ffffff',
    '--md-error-container': '#ffdad6',
    '--md-on-error-container': '#410002',
    // Surface (neutral from seed hue, very low saturation)
    '--md-surface': toneColor(hue, sat * 0.08, 99),
    '--md-surface-dim': toneColor(hue, sat * 0.08, 87),
    '--md-surface-bright': toneColor(hue, sat * 0.08, 99),
    '--md-surface-container-lowest': '#ffffff',
    '--md-surface-container-low': toneColor(hue, sat * 0.08, 96),
    '--md-surface-container': toneColor(hue, sat * 0.08, 94),
    '--md-surface-container-high': toneColor(hue, sat * 0.08, 92),
    '--md-surface-container-highest': toneColor(hue, sat * 0.08, 90),
    '--md-on-surface': toneColor(hue, sat * 0.08, 10),
    '--md-on-surface-variant': toneColor(hue, sat * 0.08, 30),
    // Outline
    '--md-outline': toneColor(hue, sat * 0.08, 50),
    '--md-outline-variant': toneColor(hue, sat * 0.08, 80),
    // Inverse
    '--md-inverse-surface': toneColor(hue, sat * 0.08, 20),
    '--md-inverse-on-surface': toneColor(hue, sat * 0.08, 95),
    '--md-inverse-primary': toneColor(hue, sat, 80),
  }
}

/**
 * Default palette (blue) when no festival is selected
 */
export const DEFAULT_PALETTE = generateTonalPalette('#3b74f1')

/**
 * Apply a palette to :root as CSS custom properties
 */
export function applyPalette(palette) {
  const root = document.documentElement
  for (const [key, value] of Object.entries(palette)) {
    root.style.setProperty(key, value)
  }
}

/**
 * Reset palette to defaults
 */
export function resetPalette() {
  applyPalette(DEFAULT_PALETTE)
}
