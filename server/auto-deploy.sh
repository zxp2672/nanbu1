#!/bin/bash
# 自动部署脚本 - 由 webhook 触发
# 拉取最新代码并重启应用

set -e

PROJECT_DIR="/opt/nanbu-alumni/nanbu1"
SERVER_DIR="$PROJECT_DIR/server"
LOG_FILE="/var/log/nanbu-deploy.log"

echo "========================================" | tee -a $LOG_FILE
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始自动部署" | tee -a $LOG_FILE

# 拉取最新代码
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 拉取代码..." | tee -a $LOG_FILE
cd $PROJECT_DIR
git pull origin main 2>&1 | tee -a $LOG_FILE

# 安装/更新依赖
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 更新依赖..." | tee -a $LOG_FILE
cd $SERVER_DIR
npm install --production 2>&1 | tee -a $LOG_FILE

# 初始化/补充演示数据
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 初始化演示数据..." | tee -a $LOG_FILE
node $SERVER_DIR/init-database.js 2>&1 | tee -a $LOG_FILE

# 重启应用
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 重启应用..." | tee -a $LOG_FILE
pm2 restart nanbu-alumni 2>&1 | tee -a $LOG_FILE

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 部署完成 ✓" | tee -a $LOG_FILE
echo "========================================" | tee -a $LOG_FILE
