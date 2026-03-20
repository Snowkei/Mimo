# 📝 个人博客

基于 **Astro 5** + **Tailwind CSS** + **Cloudflare Pages** 构建的个人博客，支持可配置图床（R2 / S3 / WebDAV）。

## ✨ 功能

### 博客核心
- 📝 Markdown 写作，支持代码高亮（Shiki）
- 🏷️ 分类 & 标签系统
- 📅 时间线归档
- 📌 文章置顶
- 🌙 深色 / 浅色模式切换
- 📱 完全响应式设计
- 🔍 RSS 订阅 & Sitemap
- 🎨 SEO 优化（Open Graph、Twitter Cards）
- 💻 相关文章推荐

### 图床系统
- ☁️ **Cloudflare R2** — 零出站流量费
- 🪣 **S3 兼容** — 支持 AWS S3、MinIO、Backblaze B2 等
- 📂 **WebDAV** — 支持坚果云、NextCloud、ownCloud 等
- 🔒 配置保存在本地浏览器（localStorage）
- 📤 拖拽上传，支持多文件
- 📋 一键复制 Markdown 链接

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 pnpm
- Cloudflare 账号（部署用）

### 安装

```bash
cd blog
npm install
```

### 本地开发

```bash
npm run dev
```

访问 `http://localhost:4321`

### 构建

```bash
npm run build
```

## 📁 项目结构

```
blog/
├── public/                 # 静态资源
│   └── favicon.svg
├── src/
│   ├── components/         # 组件
│   │   ├── Header.astro    # 导航栏
│   │   └── Footer.astro    # 页脚
│   ├── content/
│   │   ├── config.ts       # 内容集合 schema
│   │   └── blog/           # 博客文章（Markdown）
│   │       ├── first-post.md
│   │       └── r2-image-host-setup.md
│   ├── layouts/
│   │   └── BaseLayout.astro # 基础布局
│   ├── pages/
│   │   ├── index.astro     # 首页
│   │   ├── blog/
│   │   │   ├── index.astro        # 文章列表
│   │   │   └── [...slug].astro    # 文章详情
│   │   ├── categories/
│   │   │   ├── index.astro        # 分类列表
│   │   │   └── [category].astro   # 分类详情
│   │   ├── tags/
│   │   │   ├── index.astro        # 标签云
│   │   │   └── [tag].astro        # 标签详情
│   │   ├── archive.astro   # 归档（时间线）
│   │   ├── about.astro     # 关于页
│   │   ├── image-host.astro # 图床配置 & 上传
│   │   ├── rss.xml.ts      # RSS 订阅
│   │   └── api/
│   │       └── upload.ts   # 图片上传 API
│   └── styles/
│       └── global.css      # 全局样式
├── astro.config.mjs        # Astro 配置
├── tailwind.config.js      # Tailwind 配置
├── wrangler.toml           # Cloudflare 配置
├── tsconfig.json
└── package.json
```

## ✍️ 写文章

在 `src/content/blog/` 下创建 `.md` 文件：

```markdown
---
title: "文章标题"
description: "文章描述，用于 SEO"
pubDate: 2026-03-20
category: "分类名"
tags: ["标签1", "标签2"]
heroImage: "/path/to/image.jpg"  # 可选
draft: false                      # 设为 true 为草稿
pinned: false                     # 设为 true 为置顶
---

这里是正文，支持完整的 Markdown 语法。
```

## 📤 配置图床

1. 访问 `/image-host` 页面
2. 选择图床后端（R2 / S3 / WebDAV）
3. 填入配置信息
4. 点击「保存配置」
5. 拖拽图片上传

配置会保存在浏览器 localStorage 中，不会上传到服务器。

### R2 配置示例

| 字段 | 说明 |
|------|------|
| Account ID | Cloudflare Dashboard 右侧的 Account ID |
| Access Key ID | R2 API Token 的 Access Key |
| Secret Access Key | R2 API Token 的 Secret Key |
| Bucket | R2 Bucket 名称 |
| 自定义域名 | 可选，R2 绑定的自定义域名 |

### S3 配置示例

| 字段 | 说明 |
|------|------|
| Endpoint | S3 兼容服务的地址 |
| Region | 区域，如 `us-east-1` |
| Access Key ID | S3 Access Key |
| Secret Access Key | S3 Secret Key |
| Bucket | Bucket 名称 |
| Path-style | MinIO 等需要勾选 |

### WebDAV 配置示例

| 字段 | 说明 |
|------|------|
| 服务器地址 | WebDAV 服务地址 |
| 用户名 | 登录用户名 |
| 密码 | 密码或应用专用密码 |
| 上传目录 | 远程目录路径 |

## 🚢 部署到 Cloudflare Pages

### 方式一：命令行部署

```bash
# 安装 wrangler
npm install -g wrangler

# 登录
wrangler login

# 部署
npm run deploy
```

### 方式二：Git 集成

1. 将代码推送到 GitHub/GitLab
2. 在 Cloudflare Dashboard → Pages 中创建项目
3. 连接你的 Git 仓库
4. 设置：
   - Build command: `npm run build`
   - Build output directory: `dist`

### 绑定自定义域名

1. Cloudflare Dashboard → Pages → 你的项目
2. 进入 **Custom domains**
3. 点击 **Set up a custom domain**
4. 输入你的域名（如 `blog.your-domain.com`）

如果域名已托管在 Cloudflare，会自动配置 DNS。

## 🎨 自定义

### 修改站点信息

1. `astro.config.mjs` — 修改 `site` 为你的域名
2. `src/components/Header.astro` — 修改博客名称
3. `src/pages/about.astro` — 修改关于页内容
4. `src/pages/index.astro` — 修改首页标题和描述

### 添加新页面

在 `src/pages/` 下创建新的 `.astro` 文件即可。

### 修改主题颜色

编辑 `tailwind.config.js` 中的 `colors.primary` 部分。

## 📄 License

MIT
