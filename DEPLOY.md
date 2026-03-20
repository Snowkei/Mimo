# 部署指南

## 快速部署

### 1. 安装依赖

```bash
npm install -g wrangler
wrangler login
```

### 2. 创建本地配置文件

```bash
cp config.example.json config.local.json
```

编辑 `config.local.json`，填写你的配置：

```json
{
  "site": {
    "url": "https://your-blog.pages.dev"
  },
  "github": {
    "token": "你的 GitHub PAT",
    "owner": "Snowkei",
    "repo": "Mimo",
    "branch": "main",
    "contentDir": "src/content/blog/"
  },
  "imageHost": {
    "type": "r2",
    "r2": {
      "accountId": "你的 Cloudflare Account ID",
      "accessKeyId": "R2 API Token 的 Access Key ID",
      "secretAccessKey": "R2 API Token 的 Secret Access Key",
      "bucket": "你的 R2 Bucket 名称",
      "domain": "https://img.your-domain.com",
      "prefix": "blog/"
    }
  }
}
```

> ⚠️ `config.local.json` 已在 `.gitignore` 中，不会被提交到仓库。

### 3. 部署

```bash
# 一键部署（自动构建 + 设置环境变量 + 发布）
./deploy.sh

# 仅查看会设置的变量（不实际部署）
./deploy.sh --dry-run

# 指定 Cloudflare Pages 项目名
./deploy.sh --project my-blog
```

## 配置说明

### 文件结构

| 文件 | 是否提交 | 说明 |
|------|---------|------|
| `config.example.json` | ✅ 提交 | 配置模板，不含真实密钥 |
| `config.local.json` | ❌ 不提交 | 本地配置，含真实密钥 |
| `.env.example` | ✅ 提交 | 本地开发环境变量模板 |
| `wrangler.toml` | ✅ 提交 | Wrangler 配置（非敏感变量） |

### 图床类型

项目支持三种图床后端：

**Cloudflare R2（推荐）**
- 与 Cloudflare Pages 完美集成
- 需要：Account ID、R2 API Token、Bucket 名称
- 自定义域名需在 R2 Bucket 设置中绑定

**S3 兼容存储**
- 支持 AWS S3、MinIO、Backblaze B2 等
- 需要：Endpoint、Access Key、Secret Key、Bucket

**WebDAV**
- 支持坚果云、NextCloud 等
- 需要：服务器地址、用户名、密码/应用密码

### 环境变量优先级

上传 API 读取配置的顺序：
1. **环境变量**（Cloudflare Pages 运行时）— 生产部署使用
2. **请求参数**（localStorage 配置）— 浏览器端备选

部署脚本 `deploy.sh` 会自动将 `config.local.json` 中的值设置为 Cloudflare Pages 的 Secret 环境变量。

## 本地开发

```bash
# 复制环境变量模板
cp .env.example .dev.vars

# 编辑 .dev.vars 填入真实配置
# Wrangler dev 自动读取 .dev.vars

npm run dev
# 或
wrangler pages dev
```

## 手动部署（不使用脚本）

如果不想用 `deploy.sh`，可以手动操作：

1. 在 Cloudflare Dashboard → Pages → 你的项目 → Settings → Environment variables 中添加以下变量：

```
SITE_URL, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH,
GITHUB_CONTENT_DIR, IMAGE_HOST_TYPE, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_DOMAIN, R2_PREFIX
```

2. 连接 GitHub 仓库，Cloudflare Pages 会自动构建和部署。

## 故障排除

**上传失败：`缺少图床配置`**
- 检查 `IMAGE_HOST_TYPE` 是否设置
- 检查对应的图床变量是否完整

**上传失败：`S3/R2 上传失败 (403)`**
- 检查 Access Key / Secret Key 是否正确
- 检查 Bucket 名称和权限

**部署后环境变量不生效**
- 环境变量变更后需要重新部署
- 在 Cloudflare Dashboard 中触发 "Retry deployment"
