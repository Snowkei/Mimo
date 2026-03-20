---
title: "如何配置 Cloudflare R2 图床"
description: "手把手教你使用 Cloudflare R2 作为博客图床，实现低成本的图片托管。"
pubDate: 2026-03-19
category: "教程"
tags: ["Cloudflare", "R2", "图床", "教程"]
---

## 为什么选择 R2？

Cloudflare R2 是一个 S3 兼容的对象存储服务，有几个核心优势：

- **零出站流量费** — Cloudflare 不收取出站带宽费用
- **慷慨的免费额度** — 每月 10GB 存储 + 1000 万次 A 类操作免费
- **S3 兼容** — 可以使用现有的 S3 工具和 SDK

## 配置步骤

### 1. 创建 R2 Bucket

登录 Cloudflare Dashboard，进入 R2 Object Storage：

1. 点击 **Create bucket**
2. 输入 bucket 名称，如 `blog-images`
3. 选择离你最近的位置

### 2. 获取 API 凭证

进入 R2 → Manage R2 API Tokens：

1. 点击 **Create API token**
2. 权限选择 **Object Read & Write**
3. 记录 **Access Key ID** 和 **Secret Access Key**

### 3. 在博客中配置

打开博客的 `/image-host` 页面：

1. 选择 **Cloudflare R2** 标签
2. 填入 Account ID（在 Cloudflare Dashboard 右侧栏）
3. 填入 Access Key ID 和 Secret Access Key
4. 填入 Bucket 名称
5. 点击保存配置

### 4. 配置自定义域名（可选但推荐）

在 R2 Bucket 的设置中绑定自定义域名，这样图片 URL 更简洁：

```
# 没有自定义域名
https://pub-xxx.r2.dev/blog/1234-image.jpg

# 有自定义域名
https://img.your-domain.com/blog/1234-image.jpg
```

## 小贴士

- 图片会自动以时间戳+随机串命名，避免文件名冲突
- 路径前缀可以按时间或分类组织，如 `blog/2026/03/`
- 上传后可以直接复制 Markdown 格式的链接
