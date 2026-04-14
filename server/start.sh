#!/bin/bash

echo "========================================"
echo "  南部县校友会联盟 - 快速启动脚本"
echo "========================================"
echo ""

# 检查Node.js
echo "[1/3] 检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到Node.js，请先安装Node.js"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js 已安装: $(node --version)"

# 检查依赖
echo ""
echo "[2/3] 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已存在"
fi

# 启动服务器
echo ""
echo "[3/3] 启动服务器..."
echo ""
echo "🚀 服务器即将启动..."
echo "📍 访问地址: http://localhost:3000"
echo ""
echo "默认账号:"
echo "  - 总管理员: admin / 123456"
echo "  - 学校管理员: nb1_admin / 123456"
echo "  - 普通用户: user / 123456"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "========================================"
echo ""

node server.js
