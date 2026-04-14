# 🚀 快速开始指南

## 方式一：使用 Node.js 服务器（推荐 - 生产环境）

### Windows 用户

```bash
# 1. 进入服务器目录
cd server

# 2. 双击运行启动脚本
start.bat
```

或者手动执行：

```bash
cd server
npm install
npm start
```

### Mac/Linux 用户

```bash
# 1. 进入服务器目录
cd server

# 2. 添加执行权限
chmod +x start.sh

# 3. 运行启动脚本
./start.sh
```

或者手动执行：

```bash
cd server
npm install
npm start
```

### 访问应用

打开浏览器访问：**http://localhost:3000**

**默认账号：**
- 总管理员：`admin` / `123456`
- 学校管理员：`nb1_admin` / `123456`
- 普通用户：`user` / `123456`

---

## 方式二：使用 Docker

```bash
cd server
docker-compose up -d
```

访问：http://localhost:3000

---

## 方式三：纯静态文件（演示模式）

直接在浏览器中打开 `frontend/index.html`

⚠️ 注意：数据存储在浏览器本地，清除浏览器数据会丢失。

---

## 📊 数据库备份

### Windows

```bash
cd server
backup.bat
```

### Mac/Linux

```bash
cd server
chmod +x backup.sh
./backup.sh
```

备份文件保存在：`server/backups/`

---

## 📚 详细文档

查看完整部署文档：[PRODUCTION.md](PRODUCTION.md)

---

## ❓ 常见问题

### 端口被占用

修改 `server/server.js` 中的端口号：
```javascript
const PORT = process.env.PORT || 3000; // 改为其他端口
```

### 重置数据库

删除 `server/database.sqlite` 文件，重启服务器自动重建。

---

**祝使用愉快！** 🎉
