// ============================================================
// PM2 进程守护配置 - 海报生成器后端
// 用法：在服务器上执行  pm2 start deploy/ecosystem.config.js
// 说明：
//   1) NODE_ENV=production 时后端强制要求 AUTH_TOKEN，否则拒绝启动；
//   2) AUTH_TOKEN 只写在 backend/.env（deploy.sh 生成，600 权限），
//      由 Nginx 在 /api/ 反代时注入 Authorization 头，浏览器不接触令牌，
//      所以本文件不再出现 AUTH_TOKEN，避免占位符覆盖 .env 里的真值；
//   3) 下面所有 /www/wwwroot/haibao 路径必须与 deploy.sh 的 APP_DIR 一致。
// ============================================================

module.exports = {
  apps: [
    {
      name: 'haibao-backend',
      cwd: '/www/wwwroot/haibao/backend',   // 与 deploy.sh 的 APP_DIR/backend 保持一致
      script: 'src/app.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '500M',
      // 自动重启，崩溃后拉起
      autorestart: true,
      // 日志（与 APP_DIR/backend/logs 保持一致）
      out_file: '/www/wwwroot/haibao/backend/logs/out.log',
      error_file: '/www/wwwroot/haibao/backend/logs/error.log',
      time: true,
    },
  ],
}
