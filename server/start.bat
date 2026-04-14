@echo off
chcp 65001 >nul
echo ========================================
echo   南部县校友会联盟 - 快速启动脚本
echo ========================================
echo.

echo [1/3] 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未检测到Node.js，请先安装Node.js
    echo    下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js 已安装

echo.
echo [2/3] 检查依赖...
if not exist node_modules (
    echo 📦 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在
)

echo.
echo [3/3] 启动服务器...
echo.
echo 🚀 服务器即将启动...
echo 📍 访问地址: http://localhost:3000
echo.
echo 默认账号:
echo   - 总管理员: admin / 123456
echo   - 学校管理员: nb1_admin / 123456
echo   - 普通用户: user / 123456
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

node server.js
