# 南部县校友会联盟 - 微信小程序版本

## 项目简介

这是南部县校友会联盟的微信小程序版本，将原有的Web应用转换为原生微信小程序，提供更好的移动端用户体验。

## 功能特性

✅ **首页** - 展示统计数据、成员学校、最新动态  
✅ **校友通讯录** - 支持多维度筛选（学校、学段、年份、班级）和搜索  
✅ **资源共享** - 招聘、项目、投资等信息共享平台  
✅ **活动管理** - 活动发布、报名、状态跟踪  
✅ **个人中心** - 用户资料管理、动态发布、设置  
✅ **权限系统** - 多级管理员权限控制  
✅ **后端API集成** - 与现有Java后端无缝对接  

## 项目结构

```
wechat-miniprogram/
├── app.js                 # 小程序入口文件
├── app.json               # 小程序全局配置
├── app.wxss               # 全局样式
├── sitemap.json           # 网站地图
├── assets/                # 静态资源（图标等）
│   └── icons/
├── pages/                 # 页面目录
│   ├── home/              # 首页
│   │   ├── home.wxml
│   │   ├── home.js
│   │   ├── home.wxss
│   │   └── home.json
│   ├── alumni/            # 校友通讯录
│   ├── resource/          # 资源共享
│   ├── activity/          # 活动管理
│   ├── me/                # 个人中心
│   ├── login/             # 登录页
│   ├── admin/             # 管理页（待实现）
│   ├── alumni-detail/     # 校友详情（待实现）
│   └── activity-detail/   # 活动详情（待实现）
└── README.md
```

## 技术栈

- **前端框架**: 微信小程序原生开发
- **后端API**: Java Spring Boot (已有)
- **数据存储**: 后端数据库 + 本地缓存
- **认证方式**: JWT Token

## 快速开始

### 1. 环境准备

- 安装微信开发者工具：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- 确保后端API服务已启动（默认地址：http://localhost:8080）

### 2. 导入项目

1. 打开微信开发者工具
2. 选择"导入项目"
3. 选择 `wechat-miniprogram` 目录
4. 填写AppID（测试可使用测试号）
5. 点击"导入"

### 3. 配置后端地址

在 `app.js` 中修改后端API地址：

```javascript
globalData: {
  baseUrl: 'http://your-server:8080', // 修改为实际的后端地址
  // ...
}
```

### 4. 编译运行

点击微信开发者工具的"编译"按钮即可预览小程序。

## API接口说明

小程序使用与Web版本相同的后端API，主要接口包括：

### 认证接口
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 校友接口
- `GET /api/alumni` - 获取校友列表
- `GET /api/alumni/{id}` - 获取校友详情
- `POST /api/alumni` - 添加校友
- `PUT /api/alumni/{id}` - 更新校友
- `DELETE /api/alumni/{id}` - 删除校友
- `POST /api/alumni/{id}/approve` - 通过审核
- `POST /api/alumni/{id}/reject` - 拒绝审核

### 资源接口
- `GET /api/resources` - 获取资源列表
- `POST /api/resources` - 发布资源
- `PUT /api/resources/{id}` - 更新资源
- `DELETE /api/resources/{id}` - 删除资源

### 活动接口
- `GET /api/activities` - 获取活动列表
- `GET /api/activities/{id}` - 获取活动详情
- `POST /api/activities` - 创建活动
- `POST /api/activities/{id}/signup` - 报名活动
- `POST /api/activities/{id}/cancel` - 取消报名

### 动态接口
- `GET /api/posts` - 获取动态列表
- `POST /api/posts` - 发布动态
- `DELETE /api/posts/{id}` - 删除动态

### 用户接口
- `GET /api/users` - 获取用户列表
- `PUT /api/users/profile` - 更新用户资料

## 待完成功能

以下功能模块已规划但尚未完全实现，可根据需要继续开发：

- [ ] 校友详情页完善
- [ ] 活动详情页完善（报名/取消报名）
- [ ] 管理后台页面
- [ ] 资源发布功能
- [ ] 活动创建功能
- [ ] 图片上传功能
- [ ] 消息通知
- [ ] 分享功能

## 注意事项

1. **域名配置**: 上线前需在小程序后台配置合法的request域名
2. **HTTPS**: 生产环境必须使用HTTPS协议
3. **Token管理**: Token存储在本地，需注意安全性
4. **图片处理**: 头像等资源图片需处理加载失败的情况
5. **权限控制**: 前端已做基础权限控制，后端也需做好权限验证

## 开发规范

- 遵循微信小程序开发规范
- 使用ES6+语法
- 组件化开发，复用公共组件
- 统一的错误处理和用户提示
- 代码注释清晰

## 与Web版本的差异

| 特性 | Web版本 | 小程序版本 |
|------|---------|-----------|
| 运行环境 | 浏览器 | 微信客户端 |
| UI框架 | 自定义CSS | 小程序原生组件 |
| 路由 | hash路由 | 小程序页面栈 |
| 存储 | localStorage | wx.setStorageSync |
| 网络请求 | fetch | wx.request |
| 图表 | ECharts | 待集成（可使用wx-charts） |

## 部署上线

1. 在微信公众平台注册小程序账号
2. 完善小程序信息
3. 配置服务器域名
4. 在开发者工具中上传代码
5. 在公众平台提交审核
6. 审核通过后发布上线

## 许可证

本项目遵循原项目的开源协议。

## 联系方式

如有问题或建议，请联系开发团队。
