---
title: "博客部署完全指南：从零搭建到 Cloudflare Pages"
description: "手把手教你将 Astro 博客部署到 Cloudflare Pages，涵盖 GitHub 仓库、自动部署、自定义域名、图床配置、在线写文章等全部流程。"
pubDate: 2026-03-20
category: "教程"
tags: ["Cloudflare", "部署", "Astro", "教程", "Pages"]
pinned: true
---

## 准备工作

开始之前，确保你已经拥有以下账号：

- **GitHub 账号** — [注册地址](https://github.com/signup)，用于托管博客源码
- **Cloudflare 账号** — [注册地址](https://dash.cloudflare.com/sign-up)，用于部署博客和图床

不需要服务器，不需要域名（可选），全程免费。

## 第一步：获取博客源码

### 方式一：Fork 仓库（推荐）

1. 打开博客的 GitHub 仓库页面
2. 点击右上角的 **Fork** 按钮
3. 选择你的 GitHub 账号作为 Owner
4. 仓库名可以保持默认，也可以改成你喜欢的（比如 `my-blog`）
5. 点击 **Create fork**

Fork 完成后，你就有了一份属于自己的博客源码副本。

### 方式二：本地克隆开发

如果你想在本地修改代码：

```bash
# 克隆你 fork 后的仓库
git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:4321` 即可看到博客。修改代码后浏览器会自动刷新。

## 第二步：部署到 Cloudflare Pages

### 2.1 创建 Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单找到 **Workers & Pages**
3. 点击 **Create application**
4. 选择 **Pages** 标签页
5. 点击 **Connect to Git**

### 2.2 授权 GitHub 仓库

1. 点击 **Connect GitHub**（首次使用需要授权）
2. 在弹出的 GitHub 页面中，选择授权范围：
   - **All repositories** — 或者只选你 fork 的那个仓库
3. 点击 **Install & Authorize**
4. 回到 Cloudflare 页面，从列表中选择你的博客仓库，点击 **Begin setup**

### 2.3 配置构建参数

在项目设置页面填写：

| 字段 | 值 |
|------|------|
| **Project name** | 随意，如 `my-blog`（会成为默认域名 `my-blog.pages.dev`） |
| **Production branch** | `main` |
| **Framework preset** | `Astro`（选了会自动填充下面的值） |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

> 如果 Framework preset 选了 Astro 但没有自动填充，就手动填入上面的值。

点击 **Save and Deploy**，等待 1-2 分钟完成首次构建。

### 2.4 验证部署

部署完成后，Cloudflare 会给你一个默认域名，格式是：

```
https://项目名.pages.dev
```

点击这个链接，如果看到博客首页就说明部署成功了。

## 第三步：绑定自定义域名（可选）

如果你有自己的域名，可以绑定到 Cloudflare Pages：

### 3.1 域名托管到 Cloudflare

如果你的域名已经在 Cloudflare 管理，跳过这步。如果不在：

1. Cloudflare Dashboard → **Add a site**
2. 输入你的域名，如 `example.com`
3. 选择免费计划
4. Cloudflare 会给你两个 Nameserver 地址
5. 去你的域名注册商（如阿里云、腾讯云、Namecheap），把 DNS 的 Nameserver 改成 Cloudflare 提供的
6. 等待生效（通常几分钟到几小时）

### 3.2 绑定到 Pages

1. 进入你的 Pages 项目 → **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你想用的域名，如 `blog.example.com`
4. Cloudflare 会自动添加 CNAME 记录

绑定后访问 `https://blog.example.com` 就能看到你的博客了。

## 第四步：配置 GitHub Token（写文章功能）

博客支持在线写文章功能，通过 GitHub API 直接提交 Markdown 文件到仓库。需要配置一个 Personal Access Token。

### 4.1 创建 Fine-grained Token

1. 打开 [GitHub Token 设置页面](https://github.com/settings/tokens?type=beta)
2. 点击 **Generate new token**
3. 填写配置：

| 字段 | 值 |
|------|------|
| **Token name** | 随意，如 `blog-editor` |
| **Expiration** | 建议选 90 天，到期后重新生成 |
| **Repository access** | 选择 **Only select repositories** |
| **Select repositories** | 勾选你 fork 的博客仓库 |

4. 展开 **Repository permissions**，找到 **Contents**：
   - 将权限改为 **Read and write**
5. 点击 **Generate token**

### 4.2 复制并保存 Token

生成后页面会显示 Token（格式如 `github_pat_xxxxx`），**只显示一次**，立刻复制保存。

> ⚠️ 不要把 Token 提交到代码里或分享给任何人。

### 4.3 在博客中配置

1. 访问你的博客 → 点击导航栏齿轮图标 → **设置**
2. 切换到 **GitHub** 标签页
3. 填入：

| 字段 | 填什么 | 怎么找 |
|------|--------|--------|
| **Personal Access Token** | 刚才复制的 `github_pat_xxx` | 上一步生成的 |
| **仓库所有者** | 你的 GitHub 用户名 | 仓库 URL 中 `github.com/` 后面的部分 |
| **仓库名** | fork 后的仓库名 | 仓库 URL 中用户名 `/` 后面的部分 |
| **部署分支** | `main` | 通常不用改 |
| **文章目录** | `src/content/blog/` | 通常不用改 |

4. 点击 **保存 GitHub 配置**

配置完成后，点击导航栏齿轮图标 → **写文章**，就可以在线编辑和发布文章了。

## 第五步：配置图床

博客自带图床功能，支持三种后端。推荐使用 Cloudflare R2。

### 5.1 创建 R2 Bucket

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 → **R2 Object Storage**
3. 如果是第一次使用，需要点击 **Purchase R2 Plan**（免费额度够用）
4. 点击 **Create bucket**：
   - **Bucket name**：如 `blog-images`（全小写，不含空格）
   - **Location**：选离你最近的区域
5. 点击 **Create bucket**

### 5.2 创建 R2 API Token

1. R2 页面左侧 → **Manage R2 API Tokens**
2. 点击 **Create API token**
3. 配置：

| 字段 | 值 |
|------|------|
| **Token name** | 如 `blog-upload` |
| **Permissions** | 选择 **Object Read & Write** |
| **Specify bucket** | 选择刚才创建的 bucket（如 `blog-images`） |

4. 点击 **Create API token**
5. 页面会显示 **Access Key ID** 和 **Secret Access Key**，**立刻复制保存**

### 5.3 获取 Account ID

在 Cloudflare Dashboard 的**右侧边栏**可以看到 Account ID（一串字母数字），或者：

1. 打开 R2 页面
2. 右侧 **Overview** 区域有 R2 Endpoint，格式如 `https://<Account ID>.r2.cloudflarestorage.com`
3. 中间那段就是你的 Account ID

### 5.4 在博客中配置

1. 博客 → 设置 → **图床** 标签页
2. 确保选中 **Cloudflare R2** 子标签
3. 填入：

| 字段 | 填什么 | 怎么找 |
|------|--------|--------|
| **Account ID** | 32 位字母数字串 | Cloudflare Dashboard 右侧栏 |
| **Access Key ID** | R2 API Token 的 Access Key | 5.2 步骤中复制的 |
| **Secret Access Key** | R2 API Token 的 Secret | 5.2 步骤中复制的 |
| **Bucket 名称** | 创建的 bucket 名 | 如 `blog-images` |
| **自定义域名** | 可选，图片的访问域名 | 见下方说明 |
| **路径前缀** | `blog/` | 图片在桶内的目录 |

4. 点击 **保存图床配置**

### 5.5 配置自定义域名（推荐）

没有自定义域名时，图片 URL 会很长且不太美观：

```
# 默认 URL
https://pub-a1b2c3.r2.dev/blog/1234-image.jpg

# 自定义域名后
https://img.example.com/blog/1234-image.jpg
```

配置步骤：

1. R2 Bucket → **Settings** → **Public access**
2. 点击 **Connect domain**
3. 输入你想用的域名，如 `img.example.com`
4. Cloudflare 会自动配置 DNS（域名需托管在 Cloudflare）
5. 配置好后，在博客图床设置中填入 `https://img.example.com`

## 第六步：自定义博客

### 修改站点信息

1. **博客名称**：编辑 `src/components/Header.astro`，找到 `📝 博客` 改成你喜欢的
2. **首页标题**：编辑 `src/pages/index.astro`，修改 Hero 区域的标题和描述
3. **关于页面**：编辑 `src/pages/about.astro`，写上你的个人介绍
4. **站点域名**：编辑 `astro.config.mjs`，把 `site` 改成你的实际域名

```javascript
// astro.config.mjs
export default defineConfig({
  site: 'https://blog.example.com', // 改成你的域名
  // ...
});
```

### 修改主题色

编辑 `tailwind.config.js`，修改 `colors.primary`：

```javascript
// tailwind.config.js
colors: {
  primary: {
    50: '#eff6ff',   // 浅色背景
    100: '#dbeafe',
    400: '#60a5fa',  // 浅色模式强调色
    500: '#3b82f6',  // 主色
    600: '#2563eb',  // 深色强调色
    700: '#1d4ed8',
    900: '#1e3a8a',  // 深色背景
  },
},
```

## 写文章

配置好 GitHub Token 后，就可以在线写文章了：

1. 博客 → 齿轮图标 → **写文章**
2. 填写标题、分类、标签等信息
3. 在 Markdown 编辑器中编写正文
4. 点击 **发布文章**

文章会通过 GitHub API 提交到仓库，Cloudflare Pages 自动检测到变更后会重新部署，通常 1-2 分钟后就能在博客上看到新文章。

### 文章格式

每篇文章的开头需要一段 Frontmatter（元数据）：

```yaml
---
title: "文章标题"
description: "文章描述，用于 SEO 和社交分享"
pubDate: 2026-03-20
category: "教程"
tags: ["标签1", "标签2"]
heroImage: "https://img.example.com/cover.jpg"  # 可选封面图
draft: false    # true 表示草稿，不会显示
pinned: false   # true 表示置顶
---
```

在线编辑器会自动帮你生成这些，不需要手动填写。

## 常见问题

### 部署失败怎么办？

1. Cloudflare Pages → 你的项目 → **Deployments**
2. 点击失败的那次部署，查看日志
3. 常见原因：Node.js 版本不对（Pages 默认用 18，本项目兼容）

### 修改后没有生效？

Cloudflare Pages 是自动部署的，推送到 GitHub 后等 1-2 分钟。可以在 Deployments 页面看到构建状态。

### Token 过期了？

Fine-grained Token 有过期时间，过期后重新创建一个，在设置页面更新即可。旧 Token 会自动失效。

### 图床上传失败？

检查 R2 配置是否正确，特别是：
- Account ID 是否正确
- API Token 是否有 **Object Read & Write** 权限
- Bucket 名称是否拼写正确
- Token 是否过期
