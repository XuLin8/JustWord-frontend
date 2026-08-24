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
| **React 19** | 前端框架 |
| **TypeScript** | 类型安全 |
| **Vite 8** | 构建工具 |
| **Tailwind CSS v4** | CSS 框架（CSS-first） |
| **shadcn/ui** | UI 组件库主力（Radix + cva） |
| **Zustand** | 状态管理 |
| **LocalForage** | 本地存储 (IndexedDB) |

---

## 📁 目录结构规范（后续开发必须遵守）

> 本规范是项目的**强制性约定**：新增/调整代码时，文件必须落在对应目录并遵守命名与层级规则。
> 目录归类错误、跨层依赖、破坏依赖方向都属于违规，应在 code review 中拦截。

```
justword-frontend/
├── public/                     # 静态资源（favicon、icons），构建时原样拷贝
├── src/
│   ├── api/                    # API 请求层
│   │   ├── client.ts           #   HTTP 客户端封装（基地址、拦截器、错误处理）
│   │   ├── paths.ts            #   全部 API 路径常量（单一来源）
│   │   ├── endpoints/          #   按后端模块拆分的端点封装，如 auth.api.ts / words.api.ts
│   │   └── index.ts            #   统一出口，汇聚并重新导出各 endpoint
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 组件（主力 UI 库，原样维护，勿手改核心逻辑）
│   │   ├── atoms/              # 原子组件：Button、Input、Spinner 等单一职责小组件
│   │   ├── molecules/          # 分子组件：由原子组合而成，如 WordCard / AuthForm
│   │   ├── organisms/          # 组织组件：相对完整的功能块，如 AuthModal / WordForm / LearnMode
│   │   └── templates/          # 布局模板：页面级骨架，如 Layout
│   ├── config/                 # 运行时配置（业务/常量配置，非路由）
│   ├── constants/              # 纯业务常量（如 app 级常量、tab 定义）
│   ├── context/                # React Context 提供者（如 AuthContext）
│   ├── hooks/                  # 自定义 Hooks（useLearning / useWordValidation 等）
│   ├── lib/                    # 与具体业务无关的通用工具（如 cn = twMerge + clsx）
│   ├── pages/                  # 页面级组件（每个页面一个目录：index.tsx + 页面专属 CSS）
│   ├── store/                  # Zustand 状态管理（每个 store 一个文件）
│   ├── styles/                 # 全局样式：globals.css（shadcn 主题）、variables.css（设计令牌）、reset.css
│   ├── types/                  # 全局类型定义，按域拆分（auth.types / learning.types）
│   ├── utils/                  # 业务工具函数（csv-parser / validation 等）
│   ├── App.tsx                 # 应用根组件（页面路由切换）
│   ├── App.css                 # 应用级样式
│   ├── index.css               # 全局样式入口（统一 @import 各全局样式）
│   └── main.tsx                # 应用入口文件（挂载 root）
├── components.json             # shadcn/ui 配置文件
├── vite.config.ts              # Vite + Tailwind + 路径别名配置
├── tsconfig*.json              # TypeScript 配置
└── index.html                  # HTML 模板
```

### 分层依赖方向（自上而下，严禁反向）

```
pages ─────► 允许引用：templates、organisms、molecules、atoms、ui、hooks、store、api、types、utils
templates ──► 允许引用：organisms、molecules、atoms、ui、hooks、store、api、types、utils
organisms ──► 允许引用：molecules、atoms、ui、hooks、store、api、types、utils
molecules ──► 允许引用：atoms、ui、store、api、types、utils
atoms ──────► 允许引用：ui、lib、utils、types
ui（shadcn）► 独立基础层，被任意上层引用，但自身不依赖业务层
```

> 规则：`pages` 不得依赖 `organisms` 之外的实现细节；任何层不得反向依赖下层更上层的组件；`ui/` 是叶子层，业务组件不可反向依赖它之上的层。

### 命名与文件约定

| 项 | 规则 |
|----|------|
| **组件文件命名** | PascalCase，如 `ConfirmDialog.tsx` |
| **普通模块命名** | camelCase，如 `csv-parser.ts`（多词用 `-` 连字符） |
| **目录命名** | 与组件同名、PascalCase（如 `WordForm/`），内含 `index.tsx` + 可选同名 `.css` / 子文件 |
| **组件默认导出** | 统一用 **命名导出**（`export const X`），避免默认导出混用 |
| **状态目录** | 一个 store 一个文件，命名 `xxxStore.ts`（如 `wordStore.ts`） |
| **API 封装** | 每域一个文件，命名 `xxx.api.ts`，路径统一在 `paths.ts` 维护 |
| **类型文件** | 按域拆分，命名 `xxx.types.ts`，在 `types/index.ts` 汇聚 |
| **页面** | 每页一目录（PascalCase），内部 `index.tsx` + 专属 CSS |
| **样式** | Atoms/Molecules/Organisms 用组件同名 CSS 文件；全局/主题/令牌放 `styles/` |
| **路径别名** | 一律使用 `@/`（`@/components/...`、`@/lib/utils`），禁止深层相对路径 |

### shadcn/ui 使用约定

1. `src/components/ui/` 中的文件来自 shadcn/ui，**保持其官方实现**，不手改其核心 cva/逻辑。
2. UI 定制通过**包装组件**实现（如 `atoms/Button`、`atoms/Input` 包装对应 `ui/button`、`ui/input`），对外暴露业务友好的 `variant`/`size`/`loading`/`error` 等 API。
3. 需要新组件时，首选使用 `ui/` 已有组件组合；缺失时从 shadcn/ui 官方源复制到 `ui/` 并登记。
4. 设计令牌统一在 `styles/variables.css` 与 `styles/globals.css` 中定义，**组件内禁止硬编码颜色/圆角/阴影数字**。
5. Tailwind 工具类仅在组件内使用；鉴于是 CSS-first，全局主题在 `globals.css` 用 `@theme` 扩展。

### 编码约定（简版）

- 组件内不产生随机/不纯调用（`Date.now()`、`Math.random()` 等）放在 `useMemo` 或事件处理器中。
- 禁止在渲染阶段调用会产生副作用/不纯结果的函数。
- 所有接收网络数据处应有类型而非裸 `any`；确需时局部收敛并注释理由。
- Git 提交按模块一致性分段，不在一提交中混入无关文件。

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
