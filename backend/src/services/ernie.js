const axios = require('axios');

class ErnieService {
  constructor() {
    this.apiKey = process.env.ERNIE_API_KEY;
    this.baseUrl = process.env.ERNIE_BASE_URL || 'https://qianfan.baidubce.com/v2';
    this.imageModel = process.env.ERNIE_IMAGE_MODEL || 'ernie-image-turbo';
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async generateImage({ prompt, size = '1024x1792', n = 1 }) {
    const url = `${this.baseUrl}/images/generations`;
    const body = {
      model: this.imageModel,
      prompt,
      n,
      size,
    };

    console.log('[ERNIE-Image] 请求:', JSON.stringify({ url, ...body }));
    const res = await axios.post(url, body, { headers: this.getHeaders(), timeout: 120000 });
    console.log('[ERNIE-Image] 响应成功');
    return res.data;
  }
}

module.exports = new ErnieService();
