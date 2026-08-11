const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const doubao = require('../services/doubao');
const { buildFrontPrompt, buildFrontBgPrompt } = require('../prompts/front');
const { buildBackBgPrompt, buildCarStickerBgPrompt, buildBackPrompt } = require('../prompts/back');
const { renderBackPoster, renderCarSticker, computeLayout, buildLeaferJson, buildFrontLeaferJson, buildCarStickerJson } = require('../services/posterRenderer');
const { getEnhancePrompt, getBackgroundEnhancePrompt, getEnhanceStrength } = require('../prompts/enhance');

const UPLOAD_DIR = path.join(__dirname, '../../../data/uploads');
const LOGO_DIR = path.join(__dirname, '../../../data/logos');
const USE_SVG_RENDER = true; // false = 旧方案（AI生成完整海报）

function safeBasename(str) {
  return path.basename(String(str)).replace(/[^a-zA-Z0-9_-]/g, '');
}

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
      const imageUrl = act.imageUrls[j];
      let imgBuffer;

      try {
        if (imageUrl.startsWith('data:')) {
          // Base64 data URL
          const base64Data = imageUrl.split(',')[1];
          imgBuffer = Buffer.from(base64Data, 'base64');
        } else {
          // 文件 URL
          const localPath = path.join(UPLOAD_DIR, path.basename(imageUrl));
          if (fs.existsSync(localPath)) {
            imgBuffer = fs.readFileSync(localPath);
          }
        }

        if (imgBuffer) {
          const framed = await createFramedImage(imgBuffer, cardW, cardH);
          overlays.push({
            input: framed,
            top: Math.min(topStart + j * (cardH + 12), ih - cardH),
            left: xStart,
          });
        }
      } catch (err) {
        console.error(`[合成图片失败] ${imageUrl.substring(0, 50)}...:`, err.message);
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
    const pW = data.size?.width || 2100;
    const prompt = buildFrontPrompt(data);
    const result = await doubao.generateImage({ prompt, size, n: 1 });
    let imageUrl = result?.data?.[0]?.url || null;

    // 下载 AI 生成的图片并合成品牌 LOGO
    if (imageUrl && data.brandId) {
      try {
        const resp = await fetch(imageUrl);
        const imgBuffer = Buffer.from(await resp.arrayBuffer());
        const logoPath = path.join(LOGO_DIR, `${safeBasename(data.brandId)}.png`);
        if (fs.existsSync(logoPath)) {
          const logoW = Math.round(pW * 0.25);
          const logoMeta = await sharp(logoPath).metadata();
          const logoH = Math.round((logoMeta.height / logoMeta.width) * logoW);
          const logoBuffer = await sharp(logoPath).resize(logoW, logoH, { fit: 'inside' }).png().toBuffer();
          const top = Math.round(pW * 0.03);
          const left = Math.round((pW - logoW) / 2);
          const composited = await sharp(imgBuffer).composite([{ input: logoBuffer, top, left }]).png().toBuffer();
          const filename = `poster_front_${uuidv4()}.png`;
          fs.writeFileSync(path.join(UPLOAD_DIR, filename), composited);
          imageUrl = `/uploads/${filename}`;
        }
      } catch (e) {
        console.error('[正面海报LOGO合成失败]', e.message);
      }
    }

    res.json({
      success: true,
      imageUrl,
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

    const resp = await fetch(bgUrl);
    const bgBuffer = Buffer.from(await resp.arrayBuffer());

    // 2. 合成品牌 LOGO
    let finalBgBuffer = bgBuffer;
    if (data.brandId) {
      try {
        const logoPath = path.join(LOGO_DIR, `${safeBasename(data.brandId)}.png`);
        if (fs.existsSync(logoPath)) {
          const logoW = Math.round(pW * 0.25);
          const logoMeta = await sharp(logoPath).metadata();
          const logoH = Math.round((logoMeta.height / logoMeta.width) * logoW);
          const logoBuffer = await sharp(logoPath).resize(logoW, logoH, { fit: 'inside' }).png().toBuffer();
          const top = Math.round(pW * 0.03);
          const left = Math.round((pW - logoW) / 2);
          finalBgBuffer = await sharp(bgBuffer).composite([{ input: logoBuffer, top, left }]).png().toBuffer();
        }
      } catch (e) {
        console.error('[正面海报LOGO合成失败]', e.message);
      }
    }

    // 3. 保存背景图
    const uid = uuidv4();
    const bgFilename = `bg_front_${uid}.png`;
    fs.writeFileSync(path.join(UPLOAD_DIR, bgFilename), finalBgBuffer);
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
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), finalBgBuffer);

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

      const uid = uuidv4();
      const filename = `poster_back_${uid}.png`;
      const bgFilename = `bg_${uid}.png`;
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), composited);
      fs.writeFileSync(path.join(UPLOAD_DIR, bgFilename), bgBuffer);

      return res.json({
        success: true,
        imageUrl: `/uploads/${filename}`,
        bgImageUrl: `/uploads/${bgFilename}`,
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

    const resp = await fetch(bgUrl);
    const bgBuffer = Buffer.from(await resp.arrayBuffer());

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

    const resp = await fetch(bgUrl);
    const bgBuffer = Buffer.from(await resp.arrayBuffer());

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
      return res.status(400).json({ error: '缺少海报图片地址' });
    }

    if (posterType === 'back' && bgImageUrl) {
      // ====== 反面海报：只优化背景，重新合成文字（安全，文字不受影响） ======
      console.log('[poster/enhance] 反面海报背景优化, type:', type);
      const bgPath = path.join(UPLOAD_DIR, path.basename(bgImageUrl));
      if (!fs.existsSync(bgPath)) {
        return res.status(404).json({ error: '背景图不存在，请重新生成海报' });
      }

      const bgBuffer = fs.readFileSync(bgPath);
      const prompt = getBackgroundEnhancePrompt(bgColor, primaryColor);
      const strength = getEnhanceStrength('background', 'back');

      const result = await doubao.editImage({ imageBase64: bgBuffer.toString('base64'), prompt, size: '2100x2970', strength });
      const enhancedBgUrl = result?.data?.[0]?.url;
      if (!enhancedBgUrl) throw new Error('AI优化背景失败');

      const resp = await fetch(enhancedBgUrl);
      const enhancedBgBuffer = Buffer.from(await resp.arrayBuffer());

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
    const imgPath = path.join(UPLOAD_DIR, path.basename(imageUrl));
    if (!fs.existsSync(imgPath)) {
      return res.status(404).json({ error: '海报图片不存在' });
    }

    const imgBuffer = fs.readFileSync(imgPath);
    const prompt = getEnhancePrompt(type, { primary: primaryColor, secondary: secondaryColor, bg: bgColor });
    const strength = getEnhanceStrength(type, posterType);

    const result = await doubao.editImage({ imageBase64: imgBuffer.toString('base64'), prompt, size: '2100x2970', strength });
    const enhancedUrl = result?.data?.[0]?.url;
    if (!enhancedUrl) throw new Error('AI优化失败');

    const resp = await fetch(enhancedUrl);
    const enhancedBuffer = Buffer.from(await resp.arrayBuffer());
    const filename = `poster_enhanced_${uuidv4()}.png`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), enhancedBuffer);

    res.json({
      success: true,
      imageUrl: `/uploads/${filename}`,
    });
  } catch (err) {
    console.error('[海报优化错误]', err.message);
    res.status(500).json({
      error: '海报优化失败',
      detail: err.response?.data || err.message,
    });
  }
});

module.exports = router;
