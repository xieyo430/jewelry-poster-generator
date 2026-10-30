const axios = require('axios');
const sharp = require('sharp');
const { fetchRemoteBuffer } = require('./imageStore');

// 硅基流动支持的尺寸范围: 256-2048
// 生成后用 sharp 缩放到目标尺寸
const SF_MAX = 2048;

function getSupportedSize(targetW, targetH) {
  const ratio = targetW / targetH;
  let w, h;
  if (ratio >= 1) {
    // 横版或正方形
    w = Math.min(SF_MAX, Math.round(targetW));
    h = Math.round(w / ratio);
  } else {
    // 竖版
    h = Math.min(SF_MAX, Math.round(targetH));
    w = Math.round(h * ratio);
  }
  // 确保在范围内
  w = Math.max(256, Math.min(SF_MAX, w));
  h = Math.max(256, Math.min(SF_MAX, h));
  return { w, h, sizeStr: `${w}x${h}` };
}

// 火山引擎 Seedream 单张图片总像素上限：超出会直接返回 InvalidParameter
// （image area must be at most 4624220 pixels），所以请求前先等比压回上限内。
// 只往下压、不放大：本来就合法的尺寸原样透传。
const ARK_MAX_AREA = 4624220;

function clampArkSize(size) {
  const [w, h] = String(size || '').split('x').map(Number);
  if (!w || !h || w * h <= ARK_MAX_AREA) return size;
  const scale = Math.sqrt(ARK_MAX_AREA / (w * h)) * 0.999;
  const nw = Math.max(16, Math.floor(w * scale / 8) * 8);
  const nh = Math.max(16, Math.floor(h * scale / 8) * 8);
  console.log(`[Ark-Size] ${w}x${h} (${w * h}px) 超出模型上限 ${ARK_MAX_AREA}px，等比压到 ${nw}x${nh} (${nw * nh}px)`);
  return `${nw}x${nh}`;
}

class DoubaoService {
  constructor() {
    // 硅基流动（备用）
    this.sfApiKey = process.env.SILICONFLOW_API_KEY;
    this.sfBaseUrl = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1';
    this.sfModel = process.env.SILICONFLOW_IMAGE_MODEL || 'baidu/ERNIE-Image-Turbo';

    // 火山引擎（主力：文生图 + 图生图/优化）
    this.arkApiKey = process.env.ARK_API_KEY;
    this.arkBaseUrl = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
    this.imageModel = process.env.IMAGE_MODEL_ID;
    this.enhanceModel = process.env.ENHANCE_MODEL_ID; // Seedream 5.0
  }

  reload() {
    this.sfApiKey = process.env.SILICONFLOW_API_KEY;
    this.sfBaseUrl = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1';
    this.sfModel = process.env.SILICONFLOW_IMAGE_MODEL || 'baidu/ERNIE-Image-Turbo';
    this.arkApiKey = process.env.ARK_API_KEY;
    this.arkBaseUrl = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
    this.imageModel = process.env.IMAGE_MODEL_ID;
    this.enhanceModel = process.env.ENHANCE_MODEL_ID;
  }

  getSfHeaders() {
    return {
      'Authorization': `Bearer ${this.sfApiKey}`,
      'Content-Type': 'application/json',
    };
  }

  getArkHeaders() {
    return {
      'Authorization': `Bearer ${this.arkApiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * 用 sharp 缩放图片到目标尺寸
   */
  async resizeImage(buffer, targetW, targetH) {
    return await sharp(buffer)
      .resize(targetW, targetH, { fit: 'cover' })
      .png()
      .toBuffer();
  }

  /**
   * 解析 "2100x2970" 格式
   */
  parseSize(size) {
    if (!size) return { w: 2100, h: 2970 };
    const [w, h] = size.split('x').map(Number);
    return { w: w || 2100, h: h || 2970 };
  }

  /**
   * 硅基流动 - 文生图
   */
  async sfGenerateImage({ prompt, size = '2100x2970', n = 1 }) {
    const { w: targetW, h: targetH } = this.parseSize(size);
    const { sizeStr } = getSupportedSize(targetW, targetH);

    const url = `${this.sfBaseUrl}/images/generations`;
    const body = {
      model: this.sfModel,
      prompt,
      n,
      size: sizeStr,
    };

    console.log('[SiliconFlow-Image] 请求:', JSON.stringify({ url, ...body }));
    const res = await axios.post(url, body, { headers: this.getSfHeaders(), timeout: 120000 });
    console.log('[SiliconFlow-Image] 响应成功, 耗时:', res.data?.timings?.inference, 's');

    // 如果生成尺寸与目标不同，缩放
    const imageUrl = res.data?.data?.[0]?.url;
    if (imageUrl) {
      try {
        let imgBuffer = await fetchRemoteBuffer(imageUrl);
        const meta = await sharp(imgBuffer).metadata();
        if (meta.width !== targetW || meta.height !== targetH) {
          console.log(`[SiliconFlow-Image] 缩放 ${meta.width}x${meta.height} -> ${targetW}x${targetH}`);
          imgBuffer = await this.resizeImage(imgBuffer, targetW, targetH);
          // 转为 data URL 返回（与原 Doubao 格式一致）
          const base64 = imgBuffer.toString('base64');
          res.data.data[0].url = `data:image/png;base64,${base64}`;
        }
      } catch (e) {
        console.error('[SiliconFlow-Image] 缩放失败:', e.message);
      }
    }

    return res.data;
  }

  /**
   * 硅基流动 - 图生图
   */
  async sfEditImage({ imageBase64, prompt, size = '2100x2970', strength }) {
    const { w: targetW, h: targetH } = this.parseSize(size);
    const { sizeStr } = getSupportedSize(targetW, targetH);

    const url = `${this.sfBaseUrl}/images/generations`;
    const body = {
      model: this.sfModel,
      prompt,
      size: sizeStr,
      n: 1,
      image: `data:image/png;base64,${imageBase64}`,
    };
    // strength 在硅基流动可能不支持，但不报错就加上
    if (strength !== undefined) body.strength = strength;

    console.log('[SiliconFlow-Edit] 请求:', JSON.stringify({ url, model: this.sfModel, prompt: prompt.slice(0, 80), size: sizeStr, strength }));
    const res = await axios.post(url, body, { headers: this.getSfHeaders(), timeout: 180000 });
    console.log('[SiliconFlow-Edit] 响应成功, 耗时:', res.data?.timings?.inference, 's');

    // 缩放到目标尺寸
    const imageUrl = res.data?.data?.[0]?.url;
    if (imageUrl) {
      try {
        let imgBuffer = await fetchRemoteBuffer(imageUrl);
        const meta = await sharp(imgBuffer).metadata();
        if (meta.width !== targetW || meta.height !== targetH) {
          console.log(`[SiliconFlow-Edit] 缩放 ${meta.width}x${meta.height} -> ${targetW}x${targetH}`);
          imgBuffer = await this.resizeImage(imgBuffer, targetW, targetH);
          const base64 = imgBuffer.toString('base64');
          res.data.data[0].url = `data:image/png;base64,${base64}`;
        }
      } catch (e) {
        console.error('[SiliconFlow-Edit] 缩放失败:', e.message);
      }
    }

    return res.data;
  }

  /**
   * 火山引擎 Seedream - 文生图（主力）
   */
  async arkGenerateImage({ prompt, size = '2100x2970', n = 1 }) {
    const { w: targetW, h: targetH } = this.parseSize(size);
    const model = this.imageModel || this.enhanceModel;
    const url = `${this.arkBaseUrl}/images/generations`;
    const body = { model, prompt, n, size: clampArkSize(size), watermark: false };
    console.log('[Ark-Image] 请求:', JSON.stringify({ url, ...body }));
    const res = await axios.post(url, body, { headers: this.getArkHeaders(), timeout: 120000 });
    console.log('[Ark-Image] 响应成功');
    return await this.normalizeArkResult(res.data, targetW, targetH);
  }

  /**
   * 把 Ark 的返回统一成「目标尺寸的 data URL」，与硅基流动分支的输出形状一致。
   * Ark 给的是 24h 过期的 http 链接，且受单张面积上限限制（见 clampArkSize）：
   * 求 2100x2970 时实际只出 1800x2552，直接透传会让调用方拿到会过期、尺寸偏小的图。
   */
  async normalizeArkResult(data, targetW, targetH) {
    const item = data?.data?.[0];
    if (!item) return data;
    try {
      let buf;
      if (item.b64_json) {
        buf = Buffer.from(item.b64_json, 'base64');
      } else if (typeof item.url === 'string' && item.url.startsWith('data:')) {
        buf = Buffer.from(item.url.slice(item.url.indexOf(',') + 1), 'base64');
      } else if (typeof item.url === 'string' && /^https?:/i.test(item.url)) {
        buf = await fetchRemoteBuffer(item.url);
      } else {
        return data;
      }
      const meta = await sharp(buf).metadata();
      if (meta.width !== targetW || meta.height !== targetH) {
        console.log(`[Ark-Image] 缩放 ${meta.width}x${meta.height} -> ${targetW}x${targetH}`);
        buf = await this.resizeImage(buf, targetW, targetH);
      }
      item.url = `data:image/png;base64,${buf.toString('base64')}`;
      delete item.b64_json;
    } catch (e) {
      console.error('[Ark-Image] 结果归一化失败，按原始响应返回:', e.message);
    }
    return data;
  }

  /**
   * 文生图（兼容旧接口）：主力火山引擎 Seedream，失败再退硅基流动
   */
  async generateImage({ prompt, size = '2100x2970', n = 1 }) {
    if (this.arkApiKey) {
      try {
        return await this.arkGenerateImage({ prompt, size, n });
      } catch (err) {
        console.error('[Ark-Image] 失败，尝试备用:', err.response?.data || err.message);
      }
    }
    if (this.sfApiKey) {
      return await this.sfGenerateImage({ prompt, size, n });
    }
    throw new Error('未配置生图 API Key：请设置 ARK_API_KEY 或 SILICONFLOW_API_KEY');
  }

  /**
   * 图生图 - ESSDREM 5.0（火山引擎，优先）
   */
  async editImage({ imageBase64, prompt, size = '2100x2970', strength }) {
    // 优先使用火山引擎 ESSDREM 5.0
    if (this.enhanceModel) {
      try {
        const url = `${this.arkBaseUrl}/images/generations`;
        const body = {
          model: this.enhanceModel,
          prompt,
          reference_image: `data:image/png;base64,${imageBase64}`,
          size: clampArkSize(size),
          n: 1,
        };
        if (strength !== undefined) body.strength = strength;
        console.log('[Seedream-Edit] 请求:', JSON.stringify({ url, model: this.enhanceModel, prompt: prompt.slice(0, 80), size: body.size, strength }));
        const res = await axios.post(url, body, { headers: this.getArkHeaders(), timeout: 180000 });
        console.log('[Seedream-Edit] 响应成功');
        return res.data;
      } catch (err) {
        console.error('[Seedream-Edit] 失败，尝试备用:', err.response?.data || err.message);
      }
    }
    // 备用：硅基流动
    if (this.sfApiKey) {
      try {
        return await this.sfEditImage({ imageBase64, prompt, size, strength });
      } catch (err) {
        console.error('[SiliconFlow-Edit] 失败:', err.response?.data || err.message);
      }
    }
    // 最后兜底：火山引擎文生图模型
    const url = `${this.arkBaseUrl}/images/generations`;
    const body = { model: this.imageModel, prompt, reference_image: `data:image/png;base64,${imageBase64}`, size: clampArkSize(size), n: 1 };
    if (strength !== undefined) body.strength = strength;
    console.log('[Doubao-Edit] 请求:', JSON.stringify({ url, model: this.imageModel, prompt: prompt.slice(0, 80), size: body.size, strength }));
    const res = await axios.post(url, body, { headers: this.getArkHeaders(), timeout: 180000 });
    console.log('[Doubao-Edit] 响应成功');
    return res.data;
  }
}

module.exports = new DoubaoService();
