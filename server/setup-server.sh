#!/bin/bash
# 服务器初始化脚本 - 首次部署时运行一次
# 适配 Alibaba Cloud Linux 3 (OpenAnolis Edition)
# 使用方法: bash setup-server.sh

set -e

GITHUB_REPO="https://github.com/zxp2672/nanbu1.git"
PROJECT_DIR="/opt/nanbu-alumni/nanbu1"
SERVER_DIR="$PROJECT_DIR/server"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "======================================"
echo " 服务器初始化 & 自动部署配置"
echo " 系统: Alibaba Cloud Linux 3"
echo "======================================"

# 1. 安装基础环境
echo ""
echo -e "${YELLOW}[1/6] 安装基础环境...${NC}"

# 安装 Git
if ! command -v git &>/dev/null; then
    echo "安装 Git..."
    dnf install -y git
fi
echo -e "${GREEN}Git: $(git --version)${NC}"

# 安装 Node.js 18（使用阿里云镜像源，适配 AL3）
if ! command -v node &>/dev/null; then
    echo "安装 Node.js 18..."
    # 方法1: 使用 NodeSource（AL3 兼容 el8）
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - 2>&1 || {
        echo "NodeSource 安装失败，尝试备用方法..."
        # 方法2: 使用 dnf module
        dnf module enable -y nodejs:18 2>/dev/null || true
        dnf install -y nodejs npm
    }
    # 如果上面都失败，尝试直接安装
    if ! command -v node &>/dev/null; then
        dnf install -y nodejs npm
    fi
fi
echo -e "${GREEN}Node.js: $(node -v)${NC}"
echo -e "${GREEN}npm: $(npm -v)${NC}"

# 安装 PM2
if ! command -v pm2 &>/dev/null; then
    echo "安装 PM2..."
    npm install -g pm2
fi
echo -e "${GREEN}PM2: $(pm2 -v)${NC}"

# 安装 Nginx
if ! command -v nginx &>/dev/null; then
    echo "安装 Nginx..."
    dnf install -y nginx
    systemctl enable nginx
fi
echo -e "${GREEN}Nginx: $(nginx -v 2>&1)${NC}"

# 2. 克隆或更新代码
echo ""
echo -e "${YELLOW}[2/6] 拉取项目代码...${NC}"
mkdir -p /opt/nanbu-alumni
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "更新已有代码..."
    cd $PROJECT_DIR
    git pull origin main
else
    echo "克隆代码仓库..."
    cd /opt/nanbu-alumni
    git clone $GITHUB_REPO
fi
echo -e "${GREEN}✓ 代码拉取完成${NC}"

# 3. 安装项目依赖
echo ""
echo -e "${YELLOW}[3/6] 安装项目依赖...${NC}"
cd $SERVER_DIR
npm install --production
echo -e "${GREEN}✓ 依赖安装完成${NC}"

# 4. 配置 Nginx
echo ""
echo -e "${YELLOW}[4/6] 配置 Nginx...${NC}"
mkdir -p /etc/nginx/conf.d

cat > /etc/nginx/conf.d/nanbu-alumni.conf << 'EOF'
server {
    listen 80;
    server_name xy1.001tf.com 47.109.159.143;

    access_log /var/log/nginx/nanbu-alumni-access.log;
    error_log  /var/log/nginx/nanbu-alumni-error.log;

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        root /opt/nanbu-alumni/nanbu1/frontend;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API 代理到 Node.js
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

    client_max_body_size 10M;
}
EOF

nginx -t && {
    if systemctl is-active --quiet nginx; then
        systemctl reload nginx
    else
        systemctl start nginx
    fi
}
echo -e "${GREEN}✓ Nginx 配置完成${NC}"

# 5. 启动主应用
echo ""
echo -e "${YELLOW}[5/6] 启动主应用...${NC}"
cd $SERVER_DIR

# 停止旧进程（忽略错误）
pm2 delete nanbu-alumni 2>/dev/null || true

# 启动应用
pm2 start server.js --name nanbu-alumni \
    --env production \
    --log /var/log/nanbu-app.log \
    --time

pm2 save

# 设置开机自启（AL3 使用 systemd）
pm2 startup systemd -u root --hp /root 2>&1 | grep -E "^sudo|^systemctl" | bash || true
systemctl enable pm2-root 2>/dev/null || true

echo -e "${GREEN}✓ 主应用启动完成${NC}"

# 6. 启动 Webhook 服务
echo ""
echo -e "${YELLOW}[6/6] 启动 Webhook 自动部署服务...${NC}"
chmod +x $SERVER_DIR/auto-deploy.sh

pm2 delete nanbu-webhook 2>/dev/null || true
pm2 start $SERVER_DIR/deploy-webhook.js --name nanbu-webhook \
    --log /var/log/nanbu-webhook.log \
    --time

pm2 save

echo -e "${GREEN}✓ Webhook 服务启动完成${NC}"

# 开放防火墙端口（如果 firewalld 在运行）
if systemctl is-active --quiet firewalld; then
    echo ""
    echo "配置防火墙..."
    firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
    firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || true
    firewall-cmd --permanent --add-port=9000/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    echo -e "${GREEN}✓ 防火墙配置完成${NC}"
fi

# 验证部署
echo ""
echo "======================================"
echo " 验证部署状态"
echo "======================================"
sleep 2

echo ""
echo "PM2 进程状态:"
pm2 status

echo ""
echo "Nginx 状态:"
systemctl status nginx --no-pager -l | head -5

echo ""
echo "测试本地访问:"
curl -s -o /dev/null -w "Node.js (3000): HTTP %{http_code}\n" http://localhost:3000 || echo "Node.js 尚未就绪"
curl -s -o /dev/null -w "Nginx  (80):   HTTP %{http_code}\n" http://localhost || echo "Nginx 尚未就绪"

echo ""
echo "======================================"
echo -e "${GREEN} 初始化完成！${NC}"
echo "======================================"
echo ""
echo "应用地址:    http://47.109.159.143"
echo "域名地址:    http://xy1.001tf.com"
echo "Webhook地址: http://47.109.159.143:9000/webhook"
echo ""
echo "常用管理命令:"
echo "  查看应用日志:  pm2 logs nanbu-alumni"
echo "  查看部署日志:  tail -f /var/log/nanbu-deploy.log"
echo "  重启应用:      pm2 restart nanbu-alumni"
echo "  查看进程状态:  pm2 status"
echo ""
echo "下一步 - 在 GitHub 配置 Webhook:"
echo "  1. 打开 https://github.com/zxp2672/nanbu1/settings/hooks/new"
echo "  2. Payload URL: http://47.109.159.143:9000/webhook"
echo "  3. Content type: application/json"
echo "  4. Secret: nanbu-deploy-secret-2024"
echo "  5. 选择 'Just the push event'"
echo "  6. 点击 Add webhook"
echo ""
echo "配置完成后，每次 git push 将自动触发服务器部署！"
