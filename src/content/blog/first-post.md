---
title: "欢迎来到我的博客"
description: "这是第一篇文章，介绍了博客的基本功能和使用方法。"
pubDate: 2026-03-20
category: "随笔"
tags: ["博客", "教程", "开始"]
heroImage: ""
---

## 欢迎

这是使用 Astro + Cloudflare 搭建的个人博客。它支持：

### 基本功能

- 📝 **Markdown 写作** — 用你熟悉的方式创作
- 🏷️ **分类和标签** — 轻松组织内容
- 🌙 **深色模式** — 保护你的眼睛
- 📱 **响应式设计** — 手机电脑都好看
- 🔍 **RSS 订阅** — 让读者不错过更新

### 图床配置

博客支持三种图床后端：

- **Cloudflare R2** — 原生集成，性能最佳
- **S3 兼容** — 支持 AWS S3、MinIO 等
- **WebDAV** — 支持坚果云、NextCloud 等

前往 `/image-host` 页面配置你的图床。

### 代码高亮

```typescript
interface BlogConfig {
  title: string;
  theme: 'light' | 'dark' | 'auto';
  imageHost: 'r2' | 's3' | 'webdav';
}

const config: BlogConfig = {
  title: '我的博客',
  theme: 'auto',
  imageHost: 'r2',
};
```

---

开始写作吧！
