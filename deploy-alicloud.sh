#!/bin/bash
# 南部县校友会联盟 - 阿里云服务器部署脚本
# 目标服务器: 47.109.159.143
# 域名: xy1.001tf.com
# 系统: Alibaba Cloud Linux 3 (OpenAnolis Edition)

set -e

echo "======================================"
echo "南部县校友会联盟 - 部署到阿里云"
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
NC='\033[0m'

echo -e "${YELLOW}步骤 1/7: 检查本地文件...${NC}"
if [ ! -f "server/server.js" ]; then
    echo -e "${RED}错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 本地文件检查通过${NC}"
echo ""

echo -e "${YELLOW}步骤 2/7: 打包项目文件...${NC}"
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
    --exclude='deploy*.sh' \
    --exclude='deploy*.bat' \
    ${PROJECT_NAME}/
cd ${PROJECT_NAME}
echo -e "${GREEN}✓ 项目打包完成${NC}"
echo ""

echo -e "${YELLOW}步骤 3/7: 上传到服务器...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_DIR}"
scp "$TEMP_DIR/${PROJECT_NAME}.tar.gz" ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/
echo -e "${GREEN}✓ 文件上传完成${NC}"
echo ""

echo -e "${YELLOW}步骤 4/7: 在服务器上安装环境...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
#!/bin/bash

echo "检查Node.js..."
if ! command -v node &> /dev/null; then
    echo "安装Node.js..."
    # 使用NodeSource安装Node.js 18
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
fi

echo "检查PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "安装PM2..."
    npm install -g pm2
fi

echo "检查Nginx..."
if ! command -v nginx &> /dev/null; then
    echo "安装Nginx..."
    yum install -y nginx
    systemctl enable nginx
fi

echo "解压项目文件..."
cd /opt/nanbu-alumni
tar -xzf nanbu1.tar.gz
cd nanbu1/server

echo "安装项目依赖..."
npm install --production

echo "创建数据目录..."
mkdir -p data

echo "设置权限..."
chmod +x start.sh
chmod +x backup.sh

echo "✓ 环境安装完成"
ENDSSH
echo -e "${GREEN}✓ 环境安装完成${NC}"
echo ""

echo -e "${YELLOW}步骤 5/7: 配置Nginx...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
#!/bin/bash

# 创建Nginx配置（Alibaba Cloud Linux使用nginx.conf.d目录）
mkdir -p /etc/nginx/conf.d

cat > /etc/nginx/conf.d/nanbu-alumni.conf << 'EOF'
server {
    listen 80;
    server_name xy1.001tf.com;
    
    # 日志配置
    access_log /var/log/nginx/nanbu-alumni-access.log;
    error_log /var/log/nginx/nanbu-alumni-error.log;
    
    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        root /opt/nanbu-alumni/nanbu1/frontend;
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

# 检查Nginx配置
echo "测试Nginx配置..."
nginx -t

# 启动或重载Nginx
if systemctl is-active --quiet nginx; then
    echo "重载Nginx..."
    systemctl reload nginx
else
    echo "启动Nginx..."
    systemctl start nginx
fi

echo "✓ Nginx配置完成"
ENDSSH
echo -e "${GREEN}✓ Nginx配置完成${NC}"
echo ""

echo -e "${YELLOW}步骤 6/7: 启动应用...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
cd /opt/nanbu-alumni/nanbu1/server

# 停止旧进程
pm2 delete nanbu-alumni 2>/dev/null || true

# 启动应用
echo "启动应用..."
pm2 start server.js --name nanbu-alumni --env production

# 保存配置
pm2 save

# 设置开机自启
pm2 startup systemd -u root --hp /root

echo "✓ 应用启动完成"
ENDSSH
echo -e "${GREEN}✓ 应用启动完成${NC}"
echo ""

echo -e "${YELLOW}步骤 7/7: 验证部署...${NC}"
sleep 3
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
echo "检查应用状态..."
pm2 status

echo ""
echo "检查Nginx状态..."
systemctl status nginx --no-pager -l

echo ""
echo "测试本地访问..."
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost:3000

echo ""
echo "测试Nginx代理..."
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost
ENDSSH
echo -e "${GREEN}✓ 验证完成${NC}"
echo ""

# 清理临时文件
rm -rf "$TEMP_DIR"

echo "======================================"
echo -e "${GREEN}✓ 部署完成！${NC}"
echo "======================================"
echo ""
echo "访问地址:"
echo "  - 域名: http://xy1.001tf.com"
echo "  - IP: http://47.109.159.143"
echo "  - 直接访问: http://47.109.159.143:3000"
echo ""
echo "管理命令:"
echo "  - 查看日志: ssh root@47.109.159.143 'pm2 logs nanbu-alumni'"
echo "  - 重启服务: ssh root@47.109.159.143 'pm2 restart nanbu-alumni'"
echo "  - 查看状态: ssh root@47.109.159.143 'pm2 status'"
echo "  - 查看Nginx: ssh root@47.109.159.143 'systemctl status nginx'"
echo ""
echo -e "${YELLOW}注意事项:${NC}"
echo "  1. 确保域名 xy1.001tf.com 已解析到 47.109.159.143"
echo "  2. 确保服务器安全组开放了 80 和 3000 端口"
echo "  3. 首次访问数据库会自动初始化"
echo ""
