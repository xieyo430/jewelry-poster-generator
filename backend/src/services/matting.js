/**
 * 抠图服务封装
 * 调用Python rembg服务进行图片去背景
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const REMBG_URL = 'http://localhost:5000';
const MATTED_DIR = path.join(__dirname, '../../../data/matted');

// 确保抠图输出目录存在
if (!fs.existsSync(MATTED_DIR)) {
  fs.mkdirSync(MATTED_DIR, { recursive: true });
}

/**
 * 检查rembg服务是否可用
 */
async function isAvailable() {
  try {
    const resp = await axios.get(`${REMBG_URL}/health`, { timeout: 3000 });
    return resp.data?.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * 对图片buffer进行抠图
 * @param {Buffer} imageBuffer - 图片buffer
 * @param {string} filename - 原始文件名（用于日志）
 * @returns {Promise<Buffer>} 抠图后的PNG buffer
 */
async function removeBackground(imageBuffer, filename = 'image') {
  const formData = new FormData();
  formData.append('image', imageBuffer, {
    filename: filename,
    contentType: 'image/png'
  });

  const resp = await axios.post(`${REMBG_URL}/remove-bg`, formData, {
    headers: formData.getHeaders(),
    timeout: 60000,  // 抠图可能需要较长时间
    responseType: 'arraybuffer'
  });

  return Buffer.from(resp.data);
}

/**
 * 对文件路径进行抠图
 * @param {string} filePath - 图片文件路径
 * @returns {Promise<Buffer>} 抠图后的PNG buffer
 */
async function removeBackgroundFromFile(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  return removeBackground(imageBuffer, filename);
}

/**
 * 抠图并保存到matted目录
 * @param {string} sourceUrl - 原图URL（如 /uploads/xxx.png）
 * @returns {Promise<string>} 抠图后的URL（如 /matted/matted_xxx.png）
 */
async function removeBackgroundAndSave(sourceUrl) {
  const filename = path.basename(sourceUrl);
  const sourcePath = path.join(__dirname, '../../../data/uploads', filename);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`源文件不存在: ${sourcePath}`);
  }

  const mattedBuffer = await removeBackgroundFromFile(sourcePath);
  const mattedFilename = `matted_${filename.replace(/\.[^.]+$/, '.png')}`;
  const mattedPath = path.join(MATTED_DIR, mattedFilename);

  fs.writeFileSync(mattedPath, mattedBuffer);
  return `/matted/${mattedFilename}`;
}

module.exports = {
  isAvailable,
  removeBackground,
  removeBackgroundFromFile,
  removeBackgroundAndSave
};
