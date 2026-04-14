#!/bin/bash
# 南部县校友会联盟 - 服务器部署脚本
# 目标服务器: 47.109.159.143
# 域名: xy1.001tf.com

set -e

echo "======================================"
echo "南部县校友会联盟 - 部署脚本"
echo "======================================"
echo ""

# 配置变量
REMOTE_USER="root"
REMOTE_HOST="47.109.159.143"
REMOTE_DIR="/opt/nanbu-alumni"
PROJECT_NAME="nanbu1"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}步骤 1/6: 检查本地文件...${NC}"
if [ ! -f "server/server.js" ]; then
    echo -e "${RED}错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 本地文件检查通过${NC}"
echo ""

echo -e "${YELLOW}步骤 2/6: 打包项目文件...${NC}"
# 创建临时打包目录
TEMP_DIR=$(mktemp -d)
cd ..
tar -czf "$TEMP_DIR/${PROJECT_NAME}.tar.gz" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.sqlite' \
    --exclude='backend' \
    --exclude='nginx-1.29.8' \
    --exclude='*.png' \
    --exclude='.DS_Store' \
    ${PROJECT_NAME}/
cd ${PROJECT_NAME}
echo -e "${GREEN}✓ 项目打包完成${NC}"
echo ""

echo -e "${YELLOW}步骤 3/6: 上传到服务器...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_DIR}"
scp "$TEMP_DIR/${PROJECT_NAME}.tar.gz" ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/
echo -e "${GREEN}✓ 文件上传完成${NC}"
echo ""

echo -e "${YELLOW}步骤 4/6: 在服务器上解压和安装...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
cd /opt/nanbu-alumni
tar -xzf nanbu1.tar.gz
cd nanbu1/server

# 安装依赖
echo "安装Node.js依赖..."
npm install --production

# 创建数据库目录
mkdir -p data

# 设置权限
chmod +x start.sh
chmod +x backup.sh

echo "✓ 服务器端安装完成"
ENDSSH
echo -e "${GREEN}✓ 服务器安装完成${NC}"
echo ""

echo -e "${YELLOW}步骤 5/6: 配置Nginx...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
# 创建Nginx配置
cat > /etc/nginx/sites-available/nanbu-alumni << 'EOF'
server {
    listen 80;
    server_name xy1.001tf.com;
    
    # 日志配置
    access_log /var/log/nginx/nanbu-alumni-access.log;
    error_log /var/log/nginx/nanbu-alumni-error.log;
    
    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        root /opt/nanbu-alumni/nanbu1;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 前端静态文件
    location / {
        root /opt/nanbu-alumni/nanbu1/frontend;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
    
    # 文件上传大小限制
    client_max_body_size 10M;
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/nanbu-alumni /etc/nginx/sites-enabled/

# 测试Nginx配置
nginx -t

# 重载Nginx
systemctl reload nginx

echo "✓ Nginx配置完成"
ENDSSH
echo -e "${GREEN}✓ Nginx配置完成${NC}"
echo ""

echo -e "${YELLOW}步骤 6/6: 启动应用...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
cd /opt/nanbu-alumni/nanbu1/server

# 停止旧进程
pm2 delete nanbu-alumni 2>/dev/null || true

# 使用PM2启动应用
pm2 start server.js --name nanbu-alumni --env production

# 设置开机自启
pm2 save
pm2 startup

echo "✓ 应用启动完成"
ENDSSH
echo -e "${GREEN}✓ 应用启动完成${NC}"
echo ""

# 清理临时文件
rm -rf "$TEMP_DIR"

echo "======================================"
echo -e "${GREEN}✓ 部署完成！${NC}"
echo "======================================"
echo ""
echo "访问地址:"
echo "  - HTTP: http://xy1.001tf.com"
echo "  - 服务器: http://47.109.159.143:3000"
echo ""
echo "管理命令:"
echo "  - 查看日志: ssh root@47.109.159.143 'pm2 logs nanbu-alumni'"
echo "  - 重启服务: ssh root@47.109.159.143 'pm2 restart nanbu-alumni'"
echo "  - 查看状态: ssh root@47.109.159.143 'pm2 status'"
echo ""
echo -e "${YELLOW}注意: 请确保域名 xy1.001tf.com 已解析到 47.109.159.143${NC}"
echo ""
