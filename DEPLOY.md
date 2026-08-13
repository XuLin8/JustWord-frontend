# 🚀 JustWord 前端部署指南

本文档介绍如何在各种环境下部署 JustWord 前端应用。

---

## 📋 目录

- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
  - [Vercel 部署](#vercel-部署)
  - [Netlify 部署](#netlify-部署)
  - [Nginx 部署](#nginx-部署)
  - [Docker 部署](#docker-部署)
- [环境变量配置](#环境变量配置)
- [常见问题](#常见问题)

---

## 开发环境部署

### 前置要求

- Node.js 16+
- npm 或 yarn
- Git

### 步骤

```bash
# 1. 克隆仓库
git clone https://github.com/XuLin8/JustWord-frontend.git
cd JustWord-frontend

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置 API 地址

# 4. 启动开发服务器
npm run dev

# 5. 访问应用
# http://localhost:5173
```

---

## 生产环境部署

### Vercel 部署（推荐）⭐

Vercel 是最简单的部署方式，支持自动构建和 HTTPS。

#### 方法 1：通过 GitHub 自动部署

1. Fork 本仓库到你的 GitHub
2. 登录 [Vercel](https://vercel.com)
3. 点击 **Add New Project**
4. 选择 `JustWord-frontend` 仓库
5. 框架预设选择 **Vite**
6. 点击 **Deploy**

#### 方法 2：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel

# 按照提示操作：
# - 选择项目
# - 确认配置
# - 等待部署完成
```

#### 环境变量配置

在 Vercel 项目设置中添加：

| 变量名 | 值 |
|--------|-----|
| `VITE_API_BASE_URL` | `https://your-backend-api.com` |

---

### Netlify 部署

1. 登录 [Netlify](https://netlify.com)
2. 点击 **Add new site** → **Import an existing project**
3. 连接 GitHub 仓库
4. 构建命令: `npm run build`
5. 发布目录: `dist`
6. 点击 **Deploy**

---

### Nginx 部署（服务器）

#### 1. 构建项目

```bash
npm run build
# 构建产物在 dist/ 目录
```

#### 2. 上传到服务器

```bash
scp -r dist/* user@your-server:/var/www/justword/
```

#### 3. Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/justword;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理（可选）
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### 4. 重启 Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

### Docker 部署

#### 1. 创建 Dockerfile

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 2. 构建并运行

```bash
# 构建镜像
docker build -t justword-frontend .

# 运行容器
docker run -d -p 80:80 --name justword-frontend justword-frontend
```

#### 3. Docker Compose

```yaml
version: '3.8'

services:
  frontend:
    build: .
    container_name: justword-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://your-backend:3000
```

---

## 🌍 环境变量配置

### 开发环境

创建 `.env.development`：

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 生产环境

创建 `.env.production`：

```env
VITE_API_BASE_URL=https://api.your-domain.com
```

### 构建时指定

```bash
# 使用生产环境变量构建
VITE_API_BASE_URL=https://api.your-domain.com npm run build
```

---

## 🔧 常见问题

### 1. 构建失败

```bash
# 清理缓存重新安装
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 2. 页面空白 / 404

检查 Nginx 配置是否正确处理 SPA 路由：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 3. API 请求跨域

- 开发环境: 配置 Vite 代理
- 生产环境: 后端配置 CORS

### 4. 环境变量不生效

- 确保变量以 `VITE_` 开头
- 修改后需要重启开发服务器

---

## 📊 部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] 环境变量已配置
- [ ] 构建成功 (`npm run build`)
- [ ] 静态文件已上传到服务器
- [ ] Nginx/Web 服务器配置正确
- [ ] API 地址指向正确的后端
- [ ] HTTPS 已配置（生产环境）
- [ ] 监控和日志已设置

---

## 🔗 相关链接

- [前端仓库](https://github.com/XuLin8/JustWord-frontend)
- [后端仓库](https://github.com/XuLin8/JustWord-backend)
- [Vite 文档](https://vitejs.dev/)
- [React 文档](https://react.dev/)

---

## 📝 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| 1.0.0 | 2026-08-13 | 初始版本 |
