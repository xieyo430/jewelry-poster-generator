const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const doubao = require('../services/doubao');
const { buildFrontPrompt } = require('../prompts/front');
const { buildBackBgPrompt, buildCarStickerBgPrompt, buildBackPrompt } = require('../prompts/back');
const { renderBackPoster, renderCarSticker } = require('../services/posterRenderer');

const UPLOAD_DIR = path.join(__dirname, '../../../data/uploads');
const USE_SVG_RENDER = true; // false = 旧方案（AI生成完整海报）

/**
 * 生成金色相框图片卡片
 */
async function createFramedImage(imagePath, cardW, cardH) {
  const bw = Math.max(3, Math.round(cardW * 0.015));
  const iw = cardW - bw * 2;
  const ih = cardH - bw * 2;
  const product = await sharp(imagePath).resize(iw, ih, { fit: 'cover' }).png().toBuffer();
  const card = await sharp({
    create: { width: cardW, height: cardH, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  }).png().toBuffer();
  const withPhoto = await sharp(card).composite([{ input: product, top: bw, left: bw }]).png().toBuffer();
  const frame = await sharp({
    create: { width: cardW + bw * 2, height: cardH + bw * 2, channels: 4, background: { r: 255, g: 215, b: 0, alpha: 1 } }
  }).png().toBuffer();
  return await sharp(frame).composite([{ input: withPhoto, top: bw, left: bw }]).png().toBuffer();
}

/**
 * 旧方案：AI生成完整海报后再合成商品图（兜底）
 */
async function compositeProductImagesLegacy(imageBuffer, activities) {
  if (!activities || activities.length === 0) return imageBuffer;
  const metadata = await sharp(imageBuffer).metadata();
  const iw = metadata.width || 2100;
  const ih = metadata.height || 2970;
  const activityAreaHeight = Math.floor(ih * 0.72);
  const numActivities = activities.length;
  const moduleHeight = Math.floor(activityAreaHeight / numActivities);
  const overlays = [];

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    if (!act.imageUrls || act.imageUrls.length === 0) continue;
    const yCenter = Math.floor(moduleHeight * (i + 0.5));
    const cardW = act.type === 'multi_image' ? 140 : 200;
    const cardH = act.type === 'multi_image' ? 140 : 200;
    const topStart = yCenter - Math.floor(cardH / 2);
    const xStart = iw - 380;

    for (let j = 0; j < act.imageUrls.length; j++) {
      const localPath = path.join(UPLOAD_DIR, path.basename(act.imageUrls[j]));
      if (fs.existsSync(localPath)) {
        try {
          const framed = await createFramedImage(localPath, cardW, cardH);
          overlays.push({
            input: framed,
            top: Math.min(topStart + j * (cardH + 12), ih - cardH),
            left: xStart,
          });
        } catch (err) {
          console.error(`[合成图片失败] ${localPath}:`, err.message);
        }
      }
    }
  }
  if (overlays.length === 0) return imageBuffer;
  return await sharp(imageBuffer).composite(overlays).png().toBuffer();
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
    res.json({
      success: true,
      imageUrl: result?.data?.[0]?.url || null,
      prompt,
      rawResult: result,
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

    if (USE_SVG_RENDER) {
      // ====== 新方案：AI画背景 + SVG渲染文字布局 ======
      console.log('[poster/back] data.bgColor:', data.bgColor, 'data.primaryColor:', data.primaryColor);
      console.log('[poster/back] activities:', data.activities.map(a => ({ bg: a.bgColor, highlight: a.highlight, content: (a.discountDetail || a.content || '').slice(0, 30) })));
      const bgPrompt = buildBackBgPrompt(data);
      const result = await doubao.generateImage({ prompt: bgPrompt, size: sizeStr, n: 1 });
      const bgUrl = result?.data?.[0]?.url;

      if (!bgUrl) throw new Error('AI生成背景失败');

      const resp = await fetch(bgUrl);
      const bgBuffer = Buffer.from(await resp.arrayBuffer());

      const composited = await renderBackPoster(bgBuffer, data.activities, data.merchantInfo, data.brand, {
        width: pW,
        height: pH,
        primaryColor: data.primaryColor || '#FFD700',
        secondaryColor: data.secondaryColor || '#FF6B35',
        bgColor: data.bgColor || '#1a1a3a',
      });

      const filename = `poster_back_${uuidv4()}.png`;
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), composited);

      return res.json({
        success: true,
        imageUrl: `/uploads/${filename}`,
        prompt: bgPrompt,
        renderMode: 'svg',
      });
    }

    // ====== 旧方案兜底 ======
    const prompt = buildBackPrompt(data);
    const result = await doubao.generateImage({ prompt, size: sizeStr, n: 1 });
    let imageUrl = result?.data?.[0]?.url || null;

    if (imageUrl && data.activities?.some(a => a.imageUrls?.length > 0)) {
      try {
        const resp = await fetch(imageUrl);
        const buffer = Buffer.from(await resp.arrayBuffer());
        const composited = await compositeProductImagesLegacy(buffer, data.activities);
        const filename = `poster_back_${uuidv4()}.png`;
        fs.writeFileSync(path.join(UPLOAD_DIR, filename), composited);
        imageUrl = `/uploads/${filename}`;
      } catch (e) {
        console.error('[旧方案合成错误]', e.message);
      }
    }

    res.json({
      success: true,
      imageUrl,
      prompt,
      rawResult: result,
      renderMode: 'legacy',
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

    const resp = await fetch(bgUrl);
    const bgBuffer = Buffer.from(await resp.arrayBuffer());

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

module.exports = router;
