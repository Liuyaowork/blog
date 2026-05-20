# YYsuni Blog — 二次开发版

> **原项目作者**: [YYsuni](https://github.com/yysuni)  
> **原项目地址**: [2025-blog](https://github.com/yysuni/2025-blog)  
> **本项目说明**: 本项目基于 YYsuni 的博客项目进行二次开发，在原项目基础上进行了全栈架构改造，感谢原作者的出色工作。

---

## 📖 项目简介

YYsuni Blog 是一个基于 **Next.js** 构建的现代化个人博客系统，支持文章展示、Markdown 渲染、标签分类等功能。

### 原项目架构

原项目为纯前端静态博客，依赖 **GitHub API** 进行数据管理：
- 博客文章存储在 GitHub 仓库的 `public/blogs/` 目录
- 站点配置存储在 `src/config/` 下的 JSON 文件
- 点赞功能依赖外部 Cloudflare Workers API
- 管理后台认证依赖 GitHub App OAuth
- 部署平台为 Vercel / Cloudflare Pages

### 二次开发新增功能

本次二次开发对项目进行了全面重构，新增以下功能：

#### 🐳 Docker 一键部署
- 新增 `Dockerfile`（多阶段构建，缩小镜像体积）
- 新增 `docker-compose.yml`（单容器运行，数据持久化）
- 新增 `.dockerignore`
- 新增容器启动初始化脚本 `scripts/docker-entrypoint.cjs`

#### 🗄️ 本地数据存储（取代 GitHub API）
- 移除所有 GitHub API 依赖（`github-client.ts`、GitHub OAuth 认证）
- 所有运行数据存储在本地 `data/` 目录：
  ```text
  data/
  ├── blog.db          ← SQLite 数据库
  ├── blogs/           ← 博客文章文件
  │   ├── index.json
  │   └── {slug}/
  │       ├── index.md
  │       └── config.json
  ├── images/          ← 上传的图片
  │   ├── art/
  │   ├── blogs/
  │   └── avatar.png
  └── config/          ← 站点配置
      ├── site-content.json
      └── card-styles.json
  ```

#### 🛢️ SQLite 数据库
- 使用 **better-sqlite3** 作为嵌入式数据库
- 数据库文件位于 `data/blog.db`
- 包含 4 张表：
  - `users` — 管理员用户
  - `blogs` — 博客文章元数据
  - `likes` — 点赞记录（含 24 小时频率限制）
  - `sessions` — 登录会话

#### 🔐 用户名+密码登录管理后台
- 新增 `/login` 登录页面
- 使用 **bcrypt** 加密密码存储
- 基于 **Session** 的登录态管理（httpOnly Cookie）
- 新增中间件保护 `/write/*` 管理路由

#### 🌐 完整 RESTful API 体系
| 接口 | 说明 |
|------|------|
| `POST /api/auth` | 用户登录 |
| `GET /api/auth` | 验证登录状态 |
| `DELETE /api/auth` | 退出登录 |
| `GET /api/blogs` | 获取博客列表/单篇文章 |
| `POST /api/blogs` | 创建/更新博客 |
| `DELETE /api/blogs` | 删除博客 |
| `GET /api/likes` | 获取点赞数 |
| `POST /api/likes` | 点赞（含频率限制） |
| `GET /api/config` | 获取站点配置 |
| `POST /api/config` | 保存站点配置 |
| `POST /api/upload` | 上传文件 |
| `GET /api/images/[...path]` | 获取图片 |
| `GET /api/setup` | 检查初始化状态 |
| `POST /api/setup` | 初始化管理员账户（创建用户名和密码） |

#### 🔄 前端数据流改造
- 所有前端数据调用从直接读 `public/` 目录改为调用本地 API
- 首页配置从静态导入改为动态 API 加载
- 点赞组件从 Cloudflare Workers 改为本地 API
- 博客写作/编辑/删除全部走本地 API

#### 🛠️ 其他改进
- 修复所有卡片组件（ArtCard、HiCard、NavCard、MusicCard 等）在配置未加载时的空值崩溃问题
- 切换为 webpack 构建（替代 Turbopack）提高开发稳定性

---

## 🚀 快速开始

### 环境要求

- **Node.js**: 22.x 或更高版本
- **pnpm**: 最新版
- **Docker**（可选，用于容器部署）

### 本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 迁移现有数据（首次运行）
node scripts/migrate-data.mjs

# 3. 导入数据到数据库（首次运行）
node scripts/sync-db.cjs

# 4. 启动开发服务器
pnpm dev
```

访问 `http://localhost:2025` 即可查看。

### 首次初始化（设置管理员用户名和密码）

> **首次运行必须设置管理员账户**，之后才能登录管理后台写博客。

#### 方式一：通过命令行设置（推荐）

```bash
# 创建管理员账户（替换为你的用户名和密码）
curl -X POST http://localhost:2025/api/setup \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password-123"}'
# 返回: {"success":true,"message":"管理员账户创建成功"}
```

#### 方式二：通过 API 工具设置

1. 访问 `http://localhost:2025/api/setup` 检查是否已初始化（返回 `{"initialized": false}` 表示未初始化）
2. 发送 POST 请求到 `http://localhost:2025/api/setup`，请求体为 JSON：
   ```json
   {
     "username": "admin",
     "password": "your-password-123"
   }
   ```
3. 收到 `{"success":true}` 即表示创建成功

> ⚠️ **注意**:
> - `username` 为管理员用户名，建议使用 `admin`
> - `password` 至少 6 位字符，请使用强密码
> - 首次设置后不可重复初始化
> - 忘记密码需直接操作 SQLite 数据库文件 `data/blog.db`

### 登录管理后台

1. 访问 `http://localhost:2025/login`（或点击首页的 **"管理员登录"** 按钮）
2. 输入刚设置的用户名和密码
3. 登录后首页按钮会变为 **"退出登录"**
4. 进入 `/write` 页面即可写文章、管理博客

### Docker 部署

```bash
# 1. 构建并启动
docker compose up -d

# 2. 查看日志
docker compose logs -f

# 3. 停止
docker compose down
```

访问 `http://localhost:2025` 即可查看。

> **注意**: Docker 首次启动时会自动从 `public/` 目录迁移数据到 `data/` 持久化卷，无需手动执行迁移脚本。

---

## 📦 项目结构

```
├── Dockerfile                  # Docker 多阶段构建文件
├── docker-compose.yml          # Docker Compose 配置
├── .dockerignore
├── next.config.ts              # Next.js 配置
├── package.json
├── tsconfig.json
├── data/                       # 运行时数据目录
│   ├── blog.db                 # SQLite 数据库
│   ├── blogs/                  # 博客文章
│   ├── images/                 # 图片文件
│   └── config/                 # 配置文件
├── scripts/
│   ├── migrate-data.mjs        # 数据迁移脚本
│   ├── sync-db.cjs             # 数据库同步脚本
│   └── docker-entrypoint.cjs   # Docker 容器入口
├── src/
│   ├── app/
│   │   ├── api/                # RESTful API 路由
│   │   │   ├── auth/           # 认证接口
│   │   │   ├── blogs/          # 博客 CRUD
│   │   │   ├── likes/          # 点赞
│   │   │   ├── config/         # 站点配置
│   │   │   ├── upload/         # 文件上传
│   │   │   ├── images/         # 图片服务
│   │   │   └── setup/          # 初始化
│   │   ├── login/              # 登录页面
│   │   ├── (home)/             # 首页
│   │   ├── blog/               # 博客列表/详情
│   │   ├── write/              # 写博客
│   │   └── ...
│   ├── components/             # UI 组件
│   ├── lib/
│   │   ├── db/                 # 数据库
│   │   │   ├── index.ts        # SQLite 初始化
│   │   │   ├── session.ts      # Session 管理
│   │   │   ├── paths.ts        # 数据路径工具
│   │   │   └── schema.ts       # 数据库 Schema
│   │   └── ...
│   ├── hooks/                  # React Hooks
│   ├── middleware.ts           # 路由中间件
│   └── styles/                 # 样式文件
└── public/                     # 静态资源
```

---

## 📜 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16, React 19 |
| 语言 | TypeScript, JavaScript |
| 样式 | TailwindCSS 4 |
| 数据库 | SQLite (better-sqlite3) |
| 认证 | bcryptjs + Session |
| 构建 | webpack |
| 容器化 | Docker + Docker Compose |

---

## 📄 许可证

本项目基于原项目进行二次开发，遵循原项目的开源许可证。

**原项目**: [https://github.com/yysuni/2025-blog](https://github.com/yysuni/2025-blog)  
**原作者**: [YYsuni](https://github.com/yysuni)