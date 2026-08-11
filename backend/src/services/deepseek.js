const axios = require('axios');

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    this.model = process.env.DEEPSEEK_MODEL_ID || 'deepseek-v4-flash';
  }

  reload() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    this.model = process.env.DEEPSEEK_MODEL_ID || 'deepseek-v4-flash';
    console.log('[DeepSeek] 配置已重新加载');
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async chat({ messages, temperature = 0.7, max_tokens = 4096 }) {
    const url = `${this.baseUrl}/chat/completions`;

    const body = {
      model: this.model,
      max_tokens,
      temperature,
      messages,
    };

    console.log('[DeepSeek-Chat] 请求:', JSON.stringify({ url, model: this.model, messageCount: messages.length }));
    const res = await axios.post(url, body, { headers: this.getHeaders(), timeout: 120000 });
    console.log('[DeepSeek-Chat] 响应成功');

    return res.data;
  }
}

module.exports = new DeepSeekService();
