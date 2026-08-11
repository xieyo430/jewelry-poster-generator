/**
 * 海报 AI 优化提示词
 *
 * 核心原则：
 * 1. 色彩一致性是红线 — 色相(hue)绝对不能变，只能调饱和度和对比度
 * 2. 提示词描述"期望输出"而非"要做哪些修改"
 * 3. 必须反复强调保持原始配色
 */

/**
 * 获取优化提示词
 * @param {string} type - 优化类型: color | clarity | overall
 * @param {object} colors - { primary, secondary, bg } 节日主题色（hex）
 * @returns {string}
 */
function getEnhancePrompt(type, colors = {}) {
  // 色彩锁定描述 — 每个 prompt 都必须包含
  const colorLock = 'CRITICAL: preserve the exact same color palette, hue and tone. Do NOT change any colors. Only adjust saturation and contrast within the same color family.';

  const prompts = {
    // 色彩增强 — 只提升饱和度和对比度，色相不变
    color: `The same image with slightly higher saturation and deeper contrast. ${colorLock} Keep every color in its original hue. Gold tones stay gold, backgrounds stay the same color. Same layout, same composition, same text, same everything except slightly more vivid.`,

    // 清晰度提升 — 只提升锐度，其他一切不变
    clarity: `The same image but sharper and clearer with crisper details. ${colorLock} Do not change any colors, brightness or tone. Only improve sharpness and edge definition. Same layout, same composition, same text.`,

    // 整体优化 — 综合提升但严格保持配色
    overall: `The same poster with enhanced visual quality. ${colorLock} Slightly higher saturation and contrast, sharper details, but absolutely same color palette and composition. Same layout, same text, same background colors.`,
  };

  return prompts[type] || prompts.overall;
}

/**
 * 获取反面海报背景优化提示词
 * 背景没有文字，可以稍微大胆一点，但颜色必须保持一致
 * @param {string} bgColor - 背景色 hex
 * @param {string} primaryColor - 主色 hex
 */
function getBackgroundEnhancePrompt(bgColor, primaryColor) {
  return `A smooth luxurious gradient background. CRITICAL: preserve the exact same color palette as the original. The gradient must use the same colors, same hue, same tone. Only make the gradient smoother, richer and more refined. Do NOT introduce any new colors. No text, no objects, no patterns, no jewelry, pure gradient only.`;
}

/**
 * 获取推荐的 strength 值
 */
function getEnhanceStrength(type, posterType) {
  if (posterType === 'back') return 0.25;
  return 0.2;
}

module.exports = { getEnhancePrompt, getBackgroundEnhancePrompt, getEnhanceStrength };
