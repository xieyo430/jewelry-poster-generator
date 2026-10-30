#!/bin/bash
# ============================================================
# 海报生成器 - 服务器端一键部署脚本（在服务器上执行）
# 前提：宝塔已装好 Nginx、MySQL 5.7+（或 8.0）、Node.js 18+、PM2
# 用法：
#   1) 先按下面变量改成你的实际信息（仅首次部署需要，后续会复用已生成的 .env）
#   2) 数据库已用宝塔建好（名称为 $DB_NAME）
#   3) 上传代码到服务器 /www/wwwroot/haibao
#   4) 执行  bash deploy/deploy.sh
# ============================================================
set -euo pipefail

# ====== 首次部署时修改这里（.env 已存在时这两个值不会被使用，自动复用 .env）======
APP_DIR="/www/wwwroot/haibao"      # 项目目录
DB_NAME="haibao"                    # 数据库名
DB_USER="haibao"                    # 数据库用户（非 root，更安全）
DB_PASS="改成一个强密码"            # 数据库密码
AUTH_TOKEN="改成一个随机长串"       # 生产认证令牌（可执行 openssl rand -hex 32 生成）
# ======================

ENV_FILE="$APP_DIR/backend/.env"
NGINX_AUTH_CONF="$APP_DIR/deploy/nginx-auth.conf"

cd "$APP_DIR"

echo "==> [1/6] 创建运行时目录并赋权"
# posters 存放已保存项目持久引用的海报，不能被 24h TTL 清理，必须独立于 uploads
mkdir -p data/uploads data/posters data/logos backend/logs
chmod 755 data data/uploads data/posters backend/logs

echo "==> [2/6] 安装后端依赖"
(cd backend && npm install --production)

echo "==> [3/6] 准备后端 .env 与认证令牌"
if [ -f "$ENV_FILE" ]; then
  # 绝不能用 > 截断已有 .env：那会清掉运维手工补填的 AI Key
  echo "    检测到 $ENV_FILE 已存在，跳过生成（如需重置请先手动备份后删除）"
  EXISTING_TOKEN=$(grep -E '^AUTH_TOKEN=' "$ENV_FILE" | head -n 1 | cut -d= -f2- || true)
  if [ -n "$EXISTING_TOKEN" ]; then
    AUTH_TOKEN="$EXISTING_TOKEN"
  else
    echo "ERROR: 现有 .env 中缺少 AUTH_TOKEN，请手动补一行后重跑" >&2
    exit 1
  fi
else
  # 占位符未修改则拒绝执行，避免用已知值上线
  if [ "$DB_PASS" = "改成一个强密码" ] || [ "$AUTH_TOKEN" = "改成一个随机长串" ]; then
    echo "ERROR: 首次部署请先修改本脚本顶部的 DB_PASS / AUTH_TOKEN（AUTH_TOKEN 可 openssl rand -hex 32 生成）" >&2
    exit 1
  fi
  (umask 077 && cat > "$ENV_FILE" <<EOF
# 数据库
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
DB_NAME=$DB_NAME
# 服务
PORT=3001
AUTH_TOKEN=$AUTH_TOKEN
NODE_ENV=production
# 允许后端直接下载的 AI 图床域名后缀（逗号分隔），用于 SSRF 防护
ALLOWED_IMAGE_HOSTS=volces.com,myqcloud.com,siliconflow.cn
# 火山引擎 ARK（主力文生图）
ARK_API_KEY=
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
IMAGE_MODEL_ID=
ENHANCE_MODEL_ID=
# 硅基流动（备用）
SILICONFLOW_API_KEY=
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_IMAGE_MODEL=baidu/ERNIE-Image-Turbo
# DeepSeek（文本）
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL_ID=deepseek-v4-flash
EOF
)
  chmod 600 "$ENV_FILE"
  echo "    已生成 .env，请用 vim 补填 ARK_API_KEY / SILICONFLOW_API_KEY / DEEPSEEK_API_KEY"
fi

# Nginx 反代 /api/ 时注入同一枚令牌（浏览器永远拿不到 token）
# 片段 600 权限，由 nginx master（root）在 reload 时读取
(umask 077 && printf 'proxy_set_header Authorization "Bearer %s";\n' "$AUTH_TOKEN" > "$NGINX_AUTH_CONF")
echo "    已写入 Nginx 认证片段 $NGINX_AUTH_CONF"

echo "==> [4/6] 构建前端"
(cd frontend && npm install && npm run build)

echo "==> [5/6] 启动后端（PM2 守护）"
pm2 startOrReload deploy/ecosystem.config.js
pm2 save
pm2 startup 2>/dev/null || true   # 开机自启

echo "==> [6/6] 检查并重载 Nginx"
NGINX_BIN="$(command -v nginx || echo /www/server/nginx/sbin/nginx)"
if [ -x "$NGINX_BIN" ]; then
  if "$NGINX_BIN" -t; then
    "$NGINX_BIN" -s reload
    echo "    Nginx 已重载，/api/ 注入认证生效"
  else
    echo "WARN: nginx -t 失败，未自动 reload，请检查站点配置是否 include $NGINX_AUTH_CONF" >&2
  fi
else
  echo "WARN: 未找到 nginx，请在宝塔面板手动 reload，并确认 /api/ location 内 include 认证片段" >&2
fi

echo ""
echo "========================================================"
echo " 部署完成！"
echo " 后端已由 PM2 守护，端口 127.0.0.1:3001"
echo " 前端产物在 frontend/dist"
echo " 接下来："
echo "   1) 在宝塔给域名建站，站点根目录指向 $APP_DIR/frontend/dist"
echo "   2) 按 deploy/nginx-haibao.conf 配置反向代理（/api/ 已 include 认证片段）"
echo "   3) 域名解析 A 记录指向本服务器公网 IP，开 80/443 端口"
echo "   4) 首次部署用 vim 补填 backend/.env 里的 AI Key，然后 pm2 restart haibao-backend"
echo " 验证：curl -H 'Authorization: Bearer <AUTH_TOKEN>' http://127.0.0.1:3001/api/health"
echo "========================================================"
