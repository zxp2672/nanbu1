#!/bin/bash
# 服务器初始化脚本 - 首次部署时运行一次
# 配置自动部署工作流：GitHub Webhook → 自动拉取 → 重启
# 使用方法: bash setup-server.sh

set -e

GITHUB_REPO="https://github.com/zxp2672/nanbu1.git"
PROJECT_DIR="/opt/nanbu-alumni/nanbu1"
SERVER_DIR="$PROJECT_DIR/server"

echo "======================================"
echo " 服务器初始化 & 自动部署配置"
echo "======================================"

# 1. 安装基础环境
echo "[1/6] 检查并安装 Node.js..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
fi
echo "Node.js: $(node -v)"

echo "[1/6] 检查并安装 PM2..."
if ! command -v pm2 &>/dev/null; then
    npm install -g pm2
fi

echo "[1/6] 检查并安装 Git..."
if ! command -v git &>/dev/null; then
    yum install -y git
fi

echo "[1/6] 检查并安装 Nginx..."
if ! command -v nginx &>/dev/null; then
    yum install -y nginx
    systemctl enable nginx
fi

# 2. 克隆或更新代码
echo "[2/6] 拉取项目代码..."
mkdir -p /opt/nanbu-alumni
if [ -d "$PROJECT_DIR/.git" ]; then
    cd $PROJECT_DIR
    git pull origin main
else
    cd /opt/nanbu-alumni
    git clone $GITHUB_REPO
fi

# 3. 安装项目依赖
echo "[3/6] 安装项目依赖..."
cd $SERVER_DIR
npm install --production

# 4. 配置 Nginx
echo "[4/6] 配置 Nginx..."
mkdir -p /etc/nginx/conf.d
cat > /etc/nginx/conf.d/nanbu-alumni.conf << 'EOF'
server {
    listen 80;
    server_name xy1.001tf.com 47.109.159.143;

    access_log /var/log/nginx/nanbu-alumni-access.log;
    error_log  /var/log/nginx/nanbu-alumni-error.log;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /opt/nanbu-alumni/nanbu1/frontend;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    client_max_body_size 10M;
}
EOF

nginx -t && systemctl reload nginx || systemctl start nginx

# 5. 启动主应用
echo "[5/6] 启动主应用..."
cd $SERVER_DIR
pm2 delete nanbu-alumni 2>/dev/null || true
pm2 start server.js --name nanbu-alumni --env production
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

# 6. 启动 Webhook 服务
echo "[6/6] 启动 Webhook 自动部署服务..."
chmod +x $SERVER_DIR/auto-deploy.sh
pm2 delete nanbu-webhook 2>/dev/null || true
pm2 start $SERVER_DIR/deploy-webhook.js --name nanbu-webhook
pm2 save

echo ""
echo "======================================"
echo " 初始化完成！"
echo "======================================"
echo ""
echo "应用地址:    http://47.109.159.143"
echo "Webhook地址: http://47.109.159.143:9000/webhook"
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
