/**
 * 品牌LOGO生成提示词
 * 纯白背景，仅生成品牌LOGO图形，不含任何额外文字或装饰
 */
function buildLogoPrompt(brandName, festival) {
  return `生成一个珠宝品牌的LOGO，品牌名称：${brandName}。

要求：
- 纯白背景，仅LOGO图形本身，不要任何额外的文字说明
- 风格简洁大气、高端珠宝质感
- 适合${festival}节日氛围
- 图形为主，不含品牌名称文字
- 比例1:1，居中构图
- 整体干净、清晰、专业`;
}

module.exports = { buildLogoPrompt };
