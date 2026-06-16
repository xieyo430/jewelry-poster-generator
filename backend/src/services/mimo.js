const axios = require('axios');

class MimoService {
  constructor() {
    this.apiKey = process.env.MIMO_API_KEY;
    this.baseUrl = process.env.MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1';
    this.model = process.env.MIMO_MODEL_ID || 'mimo-v2.5-pro';
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async chat({ messages, temperature = 0.7, max_tokens = 4096 }) {
    const url = `${this.baseUrl}/chat/completions`;
    const body = { model: this.model, messages, temperature, max_tokens };

    console.log('[MiMo-Chat] 请求:', JSON.stringify({ url, model: this.model, messageCount: messages.length }));
    const res = await axios.post(url, body, { headers: this.getHeaders(), timeout: 120000 });
    console.log('[MiMo-Chat] 响应成功');
    return res.data;
  }
}

module.exports = new MimoService();
