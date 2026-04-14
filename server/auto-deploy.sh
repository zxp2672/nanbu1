#!/bin/bash
# 南部县校友会联盟 - 自动部署脚本
# 使用方法: bash auto-deploy.sh

set -e

echo "======================================"
echo "南部县校友会联盟 - 自动部署"
echo "======================================"
echo ""

cd /opt/nanbu-alumni/nanbu1

echo "[1/6] 拉取最新代码..."
git pull origin main
echo "✅ 代码更新完成"
echo ""

echo "[2/6] 安装依赖..."
cd server
npm install --production
echo "✅ 依赖安装完成"
echo ""

echo "[3/6] 初始化数据库..."
node init-database.js
echo "✅ 数据库初始化完成"
echo ""

echo "[4/6] 检查数据..."
sqlite3 database.sqlite "SELECT '校友数量: ' || count(*) FROM alumni;"
sqlite3 database.sqlite "SELECT '用户数量: ' || count(*) FROM users;"
echo ""

echo "[5/6] 重启应用..."
pm2 restart nanbu-alumni
echo "✅ 应用重启完成"
echo ""

echo "[6/6] 检查状态..."
sleep 2
pm2 status
echo ""

echo "======================================"
echo "✅ 部署完成！"
echo "======================================"
echo ""
echo "访问地址:"
echo "  - https://xy1.001tf.com"
echo "  - http://47.109.159.143"
echo ""
echo "测试账号:"
echo "  - 管理员: admin / 123456"
echo "  - 普通用户: user / 123456"
echo ""
