const path = require('path');
const fs = require('fs');

// uploads：临时文件（用户上传、AI 成图），24h TTL 清理
// posters：已保存项目持久引用的图片，不参与 TTL 清理
const DATA_DIR = path.join(__dirname, '../../../data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const PERSISTENT_DIR = path.join(DATA_DIR, 'posters');
for (const dir of [UPLOAD_DIR, PERSISTENT_DIR]) fs.mkdirSync(dir, { recursive: true });

// /uploads/<name> 先查持久目录再查临时目录；路径里的 ../ 由 path.basename 语义挡掉
function findLocalFile(url) {
  if (typeof url !== 'string' || !url.startsWith('/uploads/')) return null;
  const name = path.basename(url);
  for (const dir of [PERSISTENT_DIR, UPLOAD_DIR]) {
    const fp = path.join(dir, name);
    if (fs.existsSync(fp)) return fp;
  }
  return null;
}

// SSRF 防护：后端只允许直接抓取 AI 图床域名（火山/腾讯 COS/硅基流动）
const ALLOWED_HOST_SUFFIXES = (process.env.ALLOWED_IMAGE_HOSTS || 'volces.com,myqcloud.com,siliconflow.cn')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

function assertFetchableUrl(imageUrl) {
  let u;
  try {
    u = new URL(imageUrl);
  } catch {
    throw new Error('不支持的图片地址');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('不支持的图片协议');
  const host = u.hostname.toLowerCase();
  const allowed = ALLOWED_HOST_SUFFIXES.some(s => host === s || host.endsWith(`.${s}`));
  if (!allowed) throw new Error('不支持的图片地址');
}

// 下载允许名单内的远程图；禁止跟随重定向，防止白名单 host 302 跳到 169.254.169.254 等内网地址
async function fetchRemoteBuffer(imageUrl) {
  assertFetchableUrl(imageUrl);
  const resp = await fetch(imageUrl, { redirect: 'manual' });
  if (!resp.ok) throw new Error(`图片下载失败 (${resp.status})`);
  return Buffer.from(await resp.arrayBuffer());
}

module.exports = {
  UPLOAD_DIR,
  PERSISTENT_DIR,
  findLocalFile,
  assertFetchableUrl,
  fetchRemoteBuffer,
};
