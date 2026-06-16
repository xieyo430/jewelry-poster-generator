const axios = require('axios');

class DoubaoService {
  constructor() {
    this.apiKey = process.env.ARK_API_KEY;
    this.baseUrl = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
    this.imageModel = process.env.IMAGE_MODEL_ID;
    this.chatModel = process.env.CHAT_MODEL_ID;
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * 调用文生图模型生成图片 (Doubao-Seedream-5.0-lite)
   */
  async generateImage({ prompt, size = '2100x2970', n = 1 }) {
    const url = `${this.baseUrl}/images/generations`;
    const body = {
      model: this.imageModel,
      prompt,
      n,
      size,
    };

    console.log('[Doubao-Image] 请求:', JSON.stringify({ url, ...body }));
    const res = await axios.post(url, body, { headers: this.getHeaders(), timeout: 120000 });
    console.log('[Doubao-Image] 响应成功');
    return res.data;
  }

  /**
   * 调用多模态/对话模型 (Doubao-Seed-2.0-pro)
   */
  async chat({ messages, temperature = 0.7, max_tokens = 4096 }) {
    const url = `${this.baseUrl}/chat/completions`;
    const body = {
      model: this.chatModel,
      messages,
      temperature,
      max_tokens,
    };

    console.log('[Doubao-Chat] 请求:', JSON.stringify({ url, messageCount: messages.length }));
    const res = await axios.post(url, body, { headers: this.getHeaders(), timeout: 120000 });
    console.log('[Doubao-Chat] 响应成功');
    return res.data;
  }
}

module.exports = new DoubaoService();
