# 📚 JustWord - 智能单词学习应用

> 一个基于 React + TypeScript 的现代化单词学习应用，支持智能批改、两轮巩固学习模式、词库管理等功能。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Zustand](https://img.shields.io/badge/Zustand-4.0-brown)](https://zustand-demo.pmnd.rs/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ✨ 功能特性

### 📝 单词管理
- ➕ 添加/编辑/删除单词
- 📥 批量导入词库 (JSON / CSV)
- 📤 导出词库 (JSON / CSV)
- 🔍 实时搜索与筛选
- 🚫 单词去重检查

### 🧠 两轮巩固学习模式
- **第一轮：英译汉** — 看英文单词，写出中文释义
- **第二轮：汉译英** — 看中文释义，写出英文拼写
- 智能判断：完全正确 / 部分正确 / 近义词 / 拼写错误
- 学习结果回顾与统计

### 🤖 AI 智能批改 (可选)
- 接入大模型 API (DeepSeek / OpenAI 兼容)
- 近义词辨析与使用场景说明
- 个性化学习反馈

### 📦 词库管理
- 导出 JSON / CSV 格式
- 导入 JSON / CSV 词库
- 清空词库（二次确认防误删）

### 🔐 用户系统 (开发中)
- JWT 认证
- 注册 / 登录
- 个人词库云端同步

---

## 🖼️ 界面预览

| 单词本 | 学习模式 | 词库管理 |
|--------|----------|----------|
| ![单词本](https://via.placeholder.com/300x180/4a90d9/fff?text=单词本) | ![学习模式](https://via.placeholder.com/300x180/7c3aed/fff?text=学习模式) | ![词库管理](https://via.placeholder.com/300x180/22c55e/fff?text=词库管理) |

---

## 🛠️ 技术栈

| 技术 | 说明 |
|------|------|
| **React 18** | 前端框架 |
| **TypeScript** | 类型安全 |
| **Vite** | 构建工具 |
| **Zustand** | 状态管理 |
| **LocalForage** | 本地存储 (IndexedDB) |

---

## 📁 项目结构

```
justword-frontend/
├── src/
│   ├── components/          # 组件目录
│   │   ├── ImportExport/    # 导入导出组件
│   │   └── LearnMode/       # 学习模式组件
│   ├── hooks/               # 自定义 Hooks
│   ├── store/               # Zustand 状态管理
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   ├── App.tsx              # 主应用组件
│   └── main.tsx             # 入口文件
├── public/                  # 静态资源
├── index.html               # HTML 模板
├── package.json             # 项目依赖
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
└── README.md                # 项目文档
```

---

## 🚀 快速开始

### 前置要求

- Node.js 16+
- npm 或 yarn
- Git

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/XuLin8/JustWord-frontend.git
cd JustWord-frontend

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，配置后端 API 地址

# 4. 启动开发服务器
npm run dev

# 5. 浏览器访问
# http://localhost:5173
```

### 生产构建

```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

---

## 🔧 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | 后端 API 地址 | `/api` |

### .env.example

```env
# 后端 API 地址
VITE_API_BASE_URL=http://localhost:3000
```

---

## 📡 后端 API

前端需要对接以下 API：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/words` | GET | 获取所有单词 |
| `/api/words` | POST | 创建单词 |
| `/api/words/{id}` | PUT | 更新单词 |
| `/api/words/{id}` | DELETE | 删除单词 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/ai/judge` | POST | AI 翻译判断 |

> 后端项目地址：[JustWord-backend](https://github.com/XuLin8/JustWord-backend)

---

## 📄 许可证

本项目采用 MIT 许可证

---

## 🙏 致谢

- [React](https://reactjs.org/) — 前端框架
- [Vite](https://vitejs.dev/) — 构建工具
- [Zustand](https://zustand-demo.pmnd.rs/) — 状态管理
- [LocalForage](https://localforage.github.io/localForage/) — 本地存储

---

## 📧 联系方式

- 作者: [XuLin8](https://github.com/XuLin8)
- 项目链接: [https://github.com/XuLin8/JustWord-frontend](https://github.com/XuLin8/JustWord-frontend)

---

⭐ 如果这个项目对你有帮助，请给个 Star！
