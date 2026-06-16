const axios = require('axios');
const sharp = require('sharp');

class VisionLocatorService {
  constructor() {
    this.apiKey = process.env.ARK_API_KEY;
    this.baseUrl = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
    this.modelId = process.env.VISION_MODEL_ID || process.env.CHAT_MODEL_ID;
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * 分析海报图片，定位产品展示区域
   * @param {Buffer} imageBuffer - 海报图片Buffer
   * @returns {Array<{x: number, y: number, width: number, height: number}>} 归一化坐标(0-1)
   */
  async locateProductAreas(imageBuffer) {
    if (!this.modelId) {
      console.warn('[VisionLocator] 未配置VISION_MODEL_ID，跳过Vision定位');
      return [];
    }

    try {
      // 压缩图片：缩放到1050宽，转JPEG减小体积
      console.log('[VisionLocator] 压缩图片...');
      const compressed = await sharp(imageBuffer)
        .resize(1050, null, { withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();

      const base64 = compressed.toString('base64');
      console.log(`[VisionLocator] 图片大小: ${(base64.length / 1024 / 1024).toFixed(2)}MB`);

      const prompt = `分析这张海报图片，找出所有"产品展示区域"。

产品展示区域的特征：
- 浅色/白色/纯色的矩形空白区域
- 区域内没有文字、图案或装饰
- 与周围深色背景有明显色差

返回JSON数组，每个元素：{"x": 0.1, "y": 0.3, "width": 0.2, "height": 0.15}
x/y为左上角坐标(0-1)，width/height为宽高(0-1)。
找不到则返回 []
只返回JSON，不要其他文字。`;

      console.log('[VisionLocator] 调用Vision模型...');
      const url = `${this.baseUrl}/chat/completions`;
      const body = {
        model: this.modelId,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
              { type: 'text', text: prompt },
            ],
          },
        ],
        max_tokens: 1024,
        temperature: 0.1,
      };

      const res = await axios.post(url, body, { headers: this.getHeaders(), timeout: 120000 });
      const content = res.data?.choices?.[0]?.message?.content || '';
      console.log('[VisionLocator] Vision响应:', content.substring(0, 500));

      return this.parseResponse(content);
    } catch (err) {
      console.error('[VisionLocator] Vision调用失败:', err.message);
      return [];
    }
  }

  /**
   * 解析Vision响应，提取坐标数组
   */
  parseResponse(content) {
    try {
      let jsonStr = content.trim();

      // 提取```json代码块
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      // 找到第一个[和最后一个]
      const arrStart = jsonStr.indexOf('[');
      const arrEnd = jsonStr.lastIndexOf(']');
      if (arrStart !== -1 && arrEnd !== -1) {
        jsonStr = jsonStr.slice(arrStart, arrEnd + 1);
      }

      const parsed = JSON.parse(jsonStr);

      if (!Array.isArray(parsed)) {
        console.warn('[VisionLocator] 响应不是数组:', typeof parsed);
        return [];
      }

      // 验证和过滤坐标
      const valid = parsed.filter(item => {
        if (typeof item.x !== 'number' || typeof item.y !== 'number' ||
            typeof item.width !== 'number' || typeof item.height !== 'number') {
          return false;
        }
        if (item.x < 0 || item.x > 1 || item.y < 0 || item.y > 1) return false;
        if (item.width <= 0 || item.height <= 0) return false;
        if (item.width > 0.8 || item.height > 0.8) return false;
        if (item.x + item.width > 1.05 || item.y + item.height > 1.05) return false;
        return true;
      });

      console.log(`[VisionLocator] 找到 ${valid.length} 个有效产品区域`);
      return valid;
    } catch (err) {
      console.error('[VisionLocator] JSON解析失败:', err.message, '\n原始内容:', content.substring(0, 300));
      return [];
    }
  }
}

module.exports = new VisionLocatorService();
