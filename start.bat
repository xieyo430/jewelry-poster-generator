@echo off
echo ========================================
echo   珠宝节日海报生成器 - 启动脚本
echo ========================================
echo.

:: 启动后端
echo [1/2] 启动后端服务...
cd /d %~dp0backend
start "haibao-backend" cmd /c "node src/app.js"
echo 后端启动中... (端口 3001)

:: 等待后端启动
timeout /t 2 /nobreak >nul

:: 启动前端
echo [2/2] 启动前端开发服务器...
cd /d %~dp0frontend
start "haibao-frontend" cmd /c "npx vite"

echo.
echo ========================================
echo 后端: http://localhost:3001
echo 前端: http://localhost:5173
echo ========================================
echo.
echo 首次使用请先配置 backend/.env 中的 ARK_API_KEY
pause
