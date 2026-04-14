#!/bin/bash
# Nginx配置脚本

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

# 删除默认站点配置
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
nginx -t

# 重载Nginx
systemctl reload nginx

echo "✓ Nginx配置完成"
