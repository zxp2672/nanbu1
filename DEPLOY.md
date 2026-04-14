# 南部县校友会联盟 - 部署文档

## 系统要求

- Java 17+
- MySQL 8.0+
- Maven 3.8+
- Nginx (可选，用于生产环境)

## 部署步骤

### 1. 数据库配置

```bash
# 登录MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE nanbu_alumni CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户（可选）
CREATE USER 'nanbu_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON nanbu_alumni.* TO 'nanbu_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. 后端部署

```bash
# 进入后端目录
cd backend

# 修改数据库配置（如需要）
# 编辑 src/main/resources/application.yml

# 打包
mvn clean package -DskipTests

# 运行
java -jar target/alumni-1.0.0.jar
```

后端服务默认运行在 http://localhost:8080

### 3. 前端部署

#### 开发环境
直接打开 `frontend/index.html` 即可，确保后端服务已启动。

#### 生产环境（使用Nginx）

```bash
# 复制前端文件到Nginx目录
sudo cp -r frontend/* /var/www/nanbu-alumni/

# 复制Nginx配置
sudo cp nginx.conf /etc/nginx/sites-available/nanbu-alumni
sudo ln -s /etc/nginx/sites-available/nanbu-alumni /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

### 4. 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123456 | 总管理员 |
| nb1_admin | 123456 | 南部中学管理员 |
| nb2_admin | 123456 | 南部二中管理员 |
| nb3_admin | 123456 | 南部三中管理员 |
| dq_admin | 123456 | 大桥中学管理员 |
| db_admin | 123456 | 东坝中学管理员 |
| jx_admin | 123456 | 建兴中学管理员 |
| user | 123456 | 普通用户 |

### 5. API文档

#### 认证相关
- POST `/api/auth/login` - 登录
- GET `/api/auth/me` - 获取当前用户信息

#### 校友相关
- GET `/api/alumni` - 获取校友列表
- GET `/api/alumni/pending` - 获取待审核校友
- GET `/api/alumni/{id}` - 获取校友详情
- POST `/api/alumni` - 添加校友
- PUT `/api/alumni/{id}` - 更新校友
- DELETE `/api/alumni/{id}` - 删除校友
- POST `/api/alumni/{id}/approve` - 审核通过
- POST `/api/alumni/{id}/reject` - 审核拒绝

#### 资源相关
- GET `/api/resources?type={type}` - 获取资源列表
- POST `/api/resources` - 发布资源
- PUT `/api/resources/{id}` - 更新资源
- DELETE `/api/resources/{id}` - 删除资源

#### 活动相关
- GET `/api/activities?status={status}` - 获取活动列表
- POST `/api/activities` - 创建活动
- POST `/api/activities/{id}/signup` - 报名活动
- POST `/api/activities/{id}/cancel` - 取消报名

#### 动态相关
- GET `/api/posts` - 获取动态列表
- POST `/api/posts` - 发布动态
- DELETE `/api/posts/{id}` - 删除动态

## 常见问题

### 1. 数据库连接失败
检查 `application.yml` 中的数据库配置，确保用户名密码正确。

### 2. 跨域问题
确保后端CORS配置正确，或前端API_BASE_URL指向正确的后端地址。

### 3. 端口冲突
如果8080端口被占用，可以在 `application.yml` 中修改 `server.port`。

## 技术栈

- 后端：Java 17 + Spring Boot 3.x + MySQL 8.0 + JWT
- 前端：HTML5 + CSS3 + JavaScript (原生)
- 部署：Nginx + Tomcat (嵌入式)
