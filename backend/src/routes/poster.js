const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const doubao = require('../services/doubao');
const { buildFrontPrompt, buildFrontBgPrompt } = require('../prompts/front');
const { buildBackBgPrompt, buildBackPosterPrompt, buildCarStickerBgPrompt } = require('../prompts/back');
const { renderBackPoster, renderCarSticker, computeLayout, buildLeaferJson, buildFrontLeaferJson, buildCarStickerJson } = require('../services/posterRenderer');
const { getEnhancePrompt, getBackgroundEnhancePrompt, getEnhanceStrength } = require('../prompts/enhance');
const { UPLOAD_DIR, findLocalFile, fetchRemoteBuffer } = require('../services/imageStore');

async function readImageBuffer(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') throw new Error('图片地址为空');
  if (imageUrl.startsWith('data:')) {
    return Buffer.from(imageUrl.slice(imageUrl.indexOf(',') + 1), 'base64');
  }
  if (imageUrl.startsWith('/uploads/')) {
    const localPath = findLocalFile(imageUrl);
    if (!localPath) throw new Error('海报图片不存在');
    return fs.readFileSync(localPath);
  }
  if (/^https?:\/\//i.test(imageUrl)) {
    return fetchRemoteBuffer(imageUrl);
  }
  throw new Error('不支持的图片地址');
}

async function persistGeneratedImage(imageUrl, prefix) {
  const buffer = await readImageBuffer(imageUrl);
  if (!buffer.length) throw new Error('AI 返回了空图片');
  const filename = `${prefix}_${uuidv4()}.png`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

// 下载 AI 图床返回的远程图，统一走 SSRF 白名单
async function downloadProviderImage(imageUrl) {
  if (typeof imageUrl === 'string' && imageUrl.startsWith('data:')) {
    return Buffer.from(imageUrl.slice(imageUrl.indexOf(',') + 1), 'base64');
  }
  return fetchRemoteBuffer(imageUrl);
}

/**
 * POST /api/poster/front
 * Body 必填: brand, theme, colorScheme
 * Body 可选: subtitle, startDate, endDate, mainPromotion, secondaryPromotion, size
 */
router.post('/front', async (req, res) => {
  try {
    const data = req.body;

    // 参数校验
    if (!data.brand || typeof data.brand !== 'string') {
      return res.status(400).json({ error: '缺少必填参数: brand' });
    }
    if (!data.theme || typeof data.theme !== 'string') {
      return res.status(400).json({ error: '缺少必填参数: theme' });
    }
    if (!data.colorScheme) {
      return res.status(400).json({ error: '缺少必填参数: colorScheme' });
    }

    const size = data.size ? `${data.size.width}x${data.size.height}` : '2100x2970';
    const prompt = buildFrontPrompt(data);
    const result = await doubao.generateImage({ prompt, size, n: 1 });
    const generatedUrl = result?.data?.[0]?.url || null;
    if (!generatedUrl) throw new Error('AI生成正面海报失败');
    const imageUrl = await persistGeneratedImage(generatedUrl, 'poster_front');

    res.json({
      success: true,
      imageUrl,
      prompt,
      renderMode: 'single-image',
    });
  } catch (err) {
    console.error('[正面海报生成错误]', err.message);
    res.status(500).json({
      error: '正面海报生成失败',
      detail: err.response?.data || err.message,
    });
  }
});

/**
 * POST /api/poster/front-json
 * 正面海报 - 返回可编辑的 Leafer UI JSON
 */
router.post('/front-json', async (req, res) => {
  try {
    const data = req.body;

    if (!data.brand || typeof data.brand !== 'string') {
      return res.status(400).json({ error: '缺少必填参数: brand' });
    }
    if (!data.theme || typeof data.theme !== 'string') {
      return res.status(400).json({ error: '缺少必填参数: theme' });
    }
    if (!data.colorScheme) {
      return res.status(400).json({ error: '缺少必填参数: colorScheme' });
    }

    const pW = data.size?.width || 2100;
    const pH = data.size?.height || 2970;
    const sizeStr = `${pW}x${pH}`;

    // 1. AI 生成纯背景（不含文字）
    const bgPrompt = buildFrontBgPrompt(data);
    const result = await doubao.generateImage({ prompt: bgPrompt, size: sizeStr, n: 1 });
    const bgUrl = result?.data?.[0]?.url;

    if (!bgUrl) throw new Error('AI生成背景失败');

    const bgBuffer = await downloadProviderImage(bgUrl);

    // 2. 保存背景图
    const uid = uuidv4();
    const bgFilename = `bg_front_${uid}.png`;
    fs.writeFileSync(path.join(UPLOAD_DIR, bgFilename), bgBuffer);
    const bgImageUrl = `/uploads/${bgFilename}`;

    // 4. 生成 Leafer JSON
    const leaferJson = buildFrontLeaferJson(data, bgImageUrl, {
      width: pW, height: pH,
      primaryColor: data.primaryColor || '#FFD700',
      secondaryColor: data.secondaryColor || '#FF6B35',
      bgColor: data.bgColor || '#1a1a3a',
    });

    // 5. 同时生成扁平图片作为 fallback
    const filename = `poster_front_${uid}.png`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), bgBuffer);

    res.json({
      success: true,
      imageUrl: `/uploads/${filename}`,
      bgImageUrl,
      leaferJson,
      prompt: bgPrompt,
      renderMode: 'leafer',
    });
  } catch (err) {
    console.error('[正面海报JSON生成错误]', err.message);
    res.status(500).json({
      error: '正面海报生成失败',
      detail: err.response?.data || err.message,
    });
  }
});

/**
 * POST /api/poster/back
 * Body 必填: brand, activities, colorScheme
 * Body 可选: merchantInfo, size
 */
router.post('/back', async (req, res) => {
  try {
    const data = req.body;

    // 参数校验
    if (!data.brand || typeof data.brand !== 'string') {
      return res.status(400).json({ error: '缺少必填参数: brand' });
    }
    if (!Array.isArray(data.activities) || data.activities.length === 0) {
      return res.status(400).json({ error: '缺少必填参数: activities（至少1个活动）' });
    }
    if (!data.colorScheme) {
      return res.status(400).json({ error: '缺少必填参数: colorScheme' });
    }
    if (data.activities.length > 6) {
      return res.status(400).json({ error: '活动数量不能超过6个' });
    }
    const pW = data.size?.width || 2100;
    const pH = data.size?.height || 2970;
    const sizeStr = `${pW}x${pH}`;

    // AI 直接生成完整反面成图（背景+文字分层方案会互相覆盖，已弃用）
    const prompt = buildBackPosterPrompt(data);
    const result = await doubao.generateImage({ prompt, size: sizeStr, n: 1 });
    const imageUrl = result?.data?.[0]?.url || null;
    if (!imageUrl) throw new Error('AI生成反面海报失败');

    const savedUrl = await persistGeneratedImage(imageUrl, 'poster_back');

    res.json({
      success: true,
      imageUrl: savedUrl,
      prompt,
      renderMode: 'single-image',
    });
  } catch (err) {
    console.error('[反面海报生成错误]', err.message);
    res.status(500).json({
      error: '反面海报生成失败',
      detail: err.response?.data || err.message,
    });
  }
});

/**
 * POST /api/poster/car-sticker
 * Body: brand, text, phone, merchantName, width, height, primaryColor, secondaryColor, bgColor
 */
router.post('/car-sticker', async (req, res) => {
  try {
    const data = req.body;
    const pW = data.width || 2000;
    const pH = data.height || 800;
    const sizeStr = `${pW}x${pH}`;

    const bgPrompt = buildCarStickerBgPrompt(data);
    const result = await doubao.generateImage({ prompt: bgPrompt, size: sizeStr, n: 1 });
    const bgUrl = result?.data?.[0]?.url;

    if (!bgUrl) throw new Error('AI生成背景失败');

    const bgBuffer = await downloadProviderImage(bgUrl);

    const composited = await renderCarSticker(bgBuffer, data, { width: pW, height: pH });

    const filename = `car_sticker_${uuidv4()}.png`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), composited);

    res.json({
      success: true,
      imageUrl: `/uploads/${filename}`,
      prompt: bgPrompt,
    });
  } catch (err) {
    console.error('[车贴生成错误]', err.message);
    res.status(500).json({
      error: '车贴生成失败',
      detail: err.response?.data || err.message,
    });
  }
});

/**
 * POST /api/poster/back-json
 * 反面海报 - 返回可编辑的 Leafer UI JSON
 */
router.post('/back-json', async (req, res) => {
  try {
    const data = req.body;

    if (!data.brand || typeof data.brand !== 'string') {
      return res.status(400).json({ error: '缺少必填参数: brand' });
    }
    if (!Array.isArray(data.activities) || data.activities.length === 0) {
      return res.status(400).json({ error: '缺少必填参数: activities（至少1个活动）' });
    }
    if (!data.colorScheme) {
      return res.status(400).json({ error: '缺少必填参数: colorScheme' });
    }
    if (data.activities.length > 6) {
      return res.status(400).json({ error: '活动数量不能超过6个' });
    }

    const pW = data.size?.width || 2100;
    const pH = data.size?.height || 2970;
    const sizeStr = `${pW}x${pH}`;
    const brandName = data.brand;

    // 1. AI 生成背景
    const bgPrompt = buildBackBgPrompt(data);
    const result = await doubao.generateImage({ prompt: bgPrompt, size: sizeStr, n: 1 });
    const bgUrl = result?.data?.[0]?.url;

    if (!bgUrl) throw new Error('AI生成背景失败');

    const bgBuffer = await downloadProviderImage(bgUrl);

    // 2. 保存背景图
    const bgUid = uuidv4();
    const bgFilename = `bg_${bgUid}.png`;
    fs.writeFileSync(path.join(UPLOAD_DIR, bgFilename), bgBuffer);
    const bgImageUrl = `/uploads/${bgFilename}`;

    // 3. 计算布局
    const layout = computeLayout(data.activities, pW, pH);

    // 4. 生成 Leafer JSON
    let leaferJson = null;
    if (layout) {
      leaferJson = buildLeaferJson(layout, brandName, data.merchantInfo, bgImageUrl, {
        width: pW, height: pH,
        primaryColor: data.primaryColor || '#FFD700',
        secondaryColor: data.secondaryColor || '#FF6B35',
        bgColor: data.bgColor || '#1a1a3a',
      });
    }

    // 5. 同时生成扁平图片作为 fallback
    const composited = await renderBackPoster(bgBuffer, data.activities, data.merchantInfo, brandName, {
      width: pW, height: pH,
      primaryColor: data.primaryColor || '#FFD700',
      secondaryColor: data.secondaryColor || '#FF6B35',
      bgColor: data.bgColor || '#1a1a3a',
    });
    const filename = `poster_back_${bgUid}.png`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), composited);

    res.json({
      success: true,
      imageUrl: `/uploads/${filename}`,
      bgImageUrl,
      leaferJson,
      prompt: bgPrompt,
      renderMode: 'leafer',
    });
  } catch (err) {
    console.error('[反面海报JSON生成错误]', err.message);
    res.status(500).json({
      error: '反面海报生成失败',
      detail: err.response?.data || err.message,
    });
  }
});

/**
 * POST /api/poster/car-sticker-json
 * 车贴 - 返回可编辑的 Leafer UI JSON
 */
router.post('/car-sticker-json', async (req, res) => {
  try {
    const data = req.body;
    const pW = data.width || 2000;
    const pH = data.height || 800;
    const sizeStr = `${pW}x${pH}`;

    // 1. AI 生成背景
    const bgPrompt = buildCarStickerBgPrompt(data);
    const result = await doubao.generateImage({ prompt: bgPrompt, size: sizeStr, n: 1 });
    const bgUrl = result?.data?.[0]?.url;

    if (!bgUrl) throw new Error('AI生成背景失败');

    const bgBuffer = await downloadProviderImage(bgUrl);

    // 2. 保存背景图
    const uid = uuidv4();
    const bgFilename = `bg_sticker_${uid}.png`;
    fs.writeFileSync(path.join(UPLOAD_DIR, bgFilename), bgBuffer);
    const bgImageUrl = `/uploads/${bgFilename}`;

    // 3. 生成 Leafer JSON
    const leaferJson = buildCarStickerJson(data, bgImageUrl, { width: pW, height: pH });

    // 4. 同时生成扁平图片作为 fallback
    const composited = await renderCarSticker(bgBuffer, data, { width: pW, height: pH });
    const filename = `car_sticker_${uid}.png`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), composited);

    res.json({
      success: true,
      imageUrl: `/uploads/${filename}`,
      bgImageUrl,
      leaferJson,
      prompt: bgPrompt,
      renderMode: 'leafer',
    });
  } catch (err) {
    console.error('[车贴JSON生成错误]', err.message);
    res.status(500).json({
      error: '车贴生成失败',
      detail: err.response?.data || err.message,
    });
  }
});

/**
 * POST /api/poster/enhance
 * AI 优化海报（图生图）
 * Body: { imageUrl, posterType: 'front'|'back', bgImageUrl, type, activities, merchantInfo, brand, ...colors }
 */
router.post('/enhance', async (req, res) => {
  try {
    const {
      imageUrl,
      posterType = 'front',
      bgImageUrl,
      type = 'overall',
      activities,
      merchantInfo,
      brand,
      primaryColor,
      secondaryColor,
      bgColor,
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: '海报源图不存在，请先生成海报后再优化' });
    }

    let sourceBuffer;
    try {
      sourceBuffer = await readImageBuffer(imageUrl);
      if (!sourceBuffer.length) throw new Error('empty image');
    } catch (e) {
      console.error('[poster/enhance] 源图读取失败:', imageUrl, e.message);
      return res.status(404).json({ error: '海报源图已不存在，请重新生成海报后再优化' });
    }

    if (posterType === 'back' && bgImageUrl) {
      // ====== 反面海报：只优化背景，重新合成文字（安全，文字不受影响） ======
      console.log('[poster/enhance] 反面海报背景优化, type:', type);
      let bgBuffer;
      try {
        bgBuffer = await readImageBuffer(bgImageUrl);
      } catch (e) {
        console.error('[poster/enhance] 反面背景读取失败:', bgImageUrl, e.message);
        return res.status(404).json({ error: '反面背景图已不存在，请重新生成反面海报后再优化' });
      }
      const prompt = getBackgroundEnhancePrompt(bgColor, primaryColor);
      const strength = getEnhanceStrength('background', 'back');

      const result = await doubao.editImage({ imageBase64: bgBuffer.toString('base64'), prompt, size: '2100x2970', strength });
      const enhancedBgUrl = result?.data?.[0]?.url;
      if (!enhancedBgUrl) throw new Error('AI优化背景失败');

      const enhancedBgBuffer = await downloadProviderImage(enhancedBgUrl);
      if (!enhancedBgBuffer.length) throw new Error('优化后的背景为空，请稍后重试');

      const composited = await renderBackPoster(enhancedBgBuffer, activities || [], merchantInfo, brand, {
        width: 2100,
        height: 2970,
        primaryColor: primaryColor || '#FFD700',
        secondaryColor: secondaryColor || '#FF6B35',
        bgColor: bgColor || '#1a1a3a',
      });

      const filename = `poster_back_enhanced_${uuidv4()}.png`;
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), composited);

      // 同时保存优化后的背景
      const bgEnhancedFilename = `bg_enhanced_${uuidv4()}.png`;
      fs.writeFileSync(path.join(UPLOAD_DIR, bgEnhancedFilename), enhancedBgBuffer);

      return res.json({
        success: true,
        imageUrl: `/uploads/${filename}`,
        bgImageUrl: `/uploads/${bgEnhancedFilename}`,
      });
    }

    // ====== 正面海报或其他：整体 img2img ======
    console.log('[poster/enhance] 整体优化, type:', type);
    const imgBuffer = sourceBuffer;
    const prompt = getEnhancePrompt(type, { primary: primaryColor, secondary: secondaryColor, bg: bgColor });
    const strength = getEnhanceStrength(type, posterType);

    const result = await doubao.editImage({ imageBase64: imgBuffer.toString('base64'), prompt, size: '2100x2970', strength });
    const enhancedUrl = result?.data?.[0]?.url;
    if (!enhancedUrl) throw new Error('AI优化失败');

    const enhancedBuffer = await downloadProviderImage(enhancedUrl);
    if (!enhancedBuffer.length) throw new Error('优化结果为空，请稍后重试');
    const filename = `poster_enhanced_${uuidv4()}.png`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), enhancedBuffer);

    res.json({
      success: true,
      imageUrl: `/uploads/${filename}`,
    });
  } catch (err) {
    console.error('[海报优化错误]', err.message);
    res.status(500).json({
      error: '海报优化暂时失败，请保留当前内容后重试',
      detail: err.response?.data || err.message,
    });
  }
});

module.exports = router;
