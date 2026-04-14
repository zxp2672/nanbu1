# 南部县校友会联盟 - 生产环境部署指南

## 📋 系统架构

本项目支持两种运行模式：

### 模式一：纯静态网站（演示/离线模式）
- 使用 localStorage 存储数据
- 无需服务器，可直接在浏览器中打开
- 适合演示和离线使用

### 模式二：完整后端（生产环境）
- Node.js + Express + SQLite 数据库
- 支持多用户真实数据存储
- JWT Token 认证
- RESTful API 接口

---

## 🚀 快速开始

### 方式一：使用 Node.js 服务器（推荐 - 生产环境）

#### 1. 安装依赖

```bash
cd server
npm install
```

#### 2. 启动服务器

```bash
npm start
```

服务器将在 http://localhost:3000 启动

#### 3. 访问应用

打开浏览器访问：http://localhost:3000

**默认账号：**
- 总管理员：admin / 123456
- 学校管理员：nb1_admin / 123456
- 普通用户：user / 123456

---

### 方式二：纯静态文件（演示模式）

直接在浏览器中打开 `frontend/index.html` 文件即可。

⚠️ 注意：此模式数据存储在浏览器 localStorage 中，清除浏览器数据会导致数据丢失。

---

## 📦 生产环境部署

### 使用 PM2 部署（推荐）

#### 1. 安装 PM2

```bash
npm install -g pm2
```

#### 2. 启动应用

```bash
cd server
pm2 start server.js --name "nanbu-alumni"
```

#### 3. 设置开机自启

```bash
pm2 startup
pm2 save
```

#### 4. 常用命令

```bash
pm2 status          # 查看状态
pm2 logs            # 查看日志
pm2 restart         # 重启
pm2 stop            # 停止
pm2 delete          # 删除
```

---

### 使用 Docker 部署

#### 1. 创建 Dockerfile

在 `server/` 目录创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

#### 2. 构建镜像

```bash
cd server
docker build -t nanbu-alumni .
```

#### 3. 运行容器

```bash
docker run -d \
  --name nanbu-alumni \
  -p 3000:3000 \
  -v $(pwd)/database.sqlite:/app/database.sqlite \
  nanbu-alumni
```

---

## 🔧 配置说明

### 环境变量

在 `server/` 目录创建 `.env` 文件：

```env
PORT=3000
JWT_SECRET=your-secret-key-here
NODE_ENV=production
```

### 数据库

- 数据库文件：`server/database.sqlite`
- 自动初始化表结构和演示数据
- 建议定期备份此文件

### 数据备份

```bash
# 备份数据库
cp server/database.sqlite server/database.sqlite.backup

# 恢复数据库
cp server/database.sqlite.backup server/database.sqlite
```

---

## 🌐 Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📊 API 接口文档

### 认证接口

- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 校友接口

- `GET /api/alumni` - 获取校友列表
- `GET /api/alumni/:id` - 获取校友详情
- `POST /api/alumni` - 添加校友
- `PUT /api/alumni/:id` - 更新校友
- `DELETE /api/alumni/:id` - 删除校友
- `POST /api/alumni/:id/approve` - 审核通过
- `POST /api/alumni/:id/reject` - 审核拒绝

### 资源接口

- `GET /api/resources` - 获取资源列表
- `POST /api/resources` - 创建资源
- `PUT /api/resources/:id` - 更新资源
- `DELETE /api/resources/:id` - 删除资源

### 活动接口

- `GET /api/activities` - 获取活动列表
- `POST /api/activities` - 创建活动
- `POST /api/activities/:id/signup` - 报名活动
- `POST /api/activities/:id/cancel` - 取消报名

### 动态接口

- `GET /api/posts` - 获取动态列表
- `POST /api/posts` - 发布动态
- `DELETE /api/posts/:id` - 删除动态

### 学校接口

- `GET /api/schools` - 获取学校列表

---

## 🔐 安全建议

1. **修改 JWT_SECRET**：在生产环境中务必修改默认的 JWT 密钥
2. **使用 HTTPS**：生产环境建议配置 SSL 证书
3. **定期备份**：定期备份 SQLite 数据库文件
4. **更新依赖**：定期运行 `npm update` 更新依赖包
5. **防火墙**：仅开放必要的端口（80/443）

---

## 🛠 故障排查

### 端口被占用

```bash
# 查看端口占用
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

### 数据库损坏

如果数据库文件损坏，可以删除后重启服务器自动重建：

```bash
rm server/database.sqlite
npm start
```

### 查看日志

```bash
# PM2 日志
pm2 logs nanbu-alumni

# 或直接查看
tail -f ~/.pm2/logs/nanbu-alumni-out.log
```

---

## 📞 技术支持

如有问题，请访问 GitHub 项目地址：
https://github.com/zxp2672/nanbu1

---

## 📝 更新日志

### v2.0.0 (2024)
- ✨ 完整后端 API 支持
- 🗄 SQLite 数据库集成
- 🔐 JWT Token 认证
- 📊 真实数据存储
- 🎨 现代化 UI 升级
- 📱 响应式设计

---

**祝使用愉快！** 🎉
