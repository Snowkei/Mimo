#!/bin/bash
# ===========================================
# Mimo 博客 - Cloudflare Pages 部署脚本
# ===========================================
# 用法:
#   ./deploy.sh                    # 使用 config.local.json 部署
#   ./deploy.sh --config my.json   # 指定配置文件
#   ./deploy.sh --dry-run          # 仅显示会设置的变量，不实际部署
#
# 前置条件:
#   1. npm install -g wrangler
#   2. wrangler login               # 登录 Cloudflare
#   3. 创建 config.local.json       # 复制 config.example.json 并填写

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/config.local.json"
DRY_RUN=false
PROJECT_NAME=""

# 解析参数
while [[ $# -gt 0 ]]; do
  case "$1" in
    --config)
      CONFIG_FILE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --project)
      PROJECT_NAME="$2"
      shift 2
      ;;
    *)
      echo "未知参数: $1"
      echo "用法: $0 [--config <file>] [--dry-run] [--project <name>]"
      exit 1
      ;;
  esac
done

# 检查配置文件
if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ 配置文件不存在: $CONFIG_FILE"
  echo "请复制 config.example.json 为 config.local.json 并填写配置"
  exit 1
fi

echo "📋 读取配置: $CONFIG_FILE"

# 用 node 解析 JSON（不需要 jq）
parse_json() {
  node -e "
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
    const key = process.argv[1];
    const parts = key.split('.');
    let val = config;
    for (const p of parts) {
      if (val == null) break;
      val = val[p];
    }
    if (val != null) process.stdout.write(String(val));
    else process.stdout.write('');
  " "$1"
}

# 提取配置值
SITE_URL=$(parse_json "site.url")
GH_TOKEN=$(parse_json "github.token")
GH_OWNER=$(parse_json "github.owner")
GH_REPO=$(parse_json "github.repo")
GH_BRANCH=$(parse_json "github.branch")
GH_CONTENT_DIR=$(parse_json "github.contentDir")
IH_TYPE=$(parse_json "imageHost.type")

# R2 配置
R2_ACCOUNT_ID=$(parse_json "imageHost.r2.accountId")
R2_ACCESS_KEY_ID=$(parse_json "imageHost.r2.accessKeyId")
R2_SECRET_ACCESS_KEY=$(parse_json "imageHost.r2.secretAccessKey")
R2_BUCKET=$(parse_json "imageHost.r2.bucket")
R2_DOMAIN=$(parse_json "imageHost.r2.domain")
R2_PREFIX=$(parse_json "imageHost.r2.prefix")

# S3 配置
S3_ENDPOINT=$(parse_json "imageHost.s3.endpoint")
S3_REGION=$(parse_json "imageHost.s3.region")
S3_ACCESS_KEY_ID=$(parse_json "imageHost.s3.accessKeyId")
S3_SECRET_ACCESS_KEY=$(parse_json "imageHost.s3.secretAccessKey")
S3_BUCKET=$(parse_json "imageHost.s3.bucket")
S3_DOMAIN=$(parse_json "imageHost.s3.domain")
S3_PREFIX=$(parse_json "imageHost.s3.prefix")
S3_PATH_STYLE=$(parse_json "imageHost.s3.pathStyle")

# WebDAV 配置
WEBDAV_URL=$(parse_json "imageHost.webdav.url")
WEBDAV_USERNAME=$(parse_json "imageHost.webdav.username")
WEBDAV_PASSWORD=$(parse_json "imageHost.webdav.password")
WEBDAV_DIRECTORY=$(parse_json "imageHost.webdav.directory")
WEBDAV_DOMAIN=$(parse_json "imageHost.webdav.domain")

# 检查 wrangler 是否安装
if ! command -v wrangler &> /dev/null; then
  echo "❌ wrangler 未安装，请先运行: npm install -g wrangler"
  exit 1
fi

# 构建环境变量列表
VARS=()
VARS+=("SITE_URL=${SITE_URL}")
VARS+=("GITHUB_TOKEN=${GH_TOKEN}")
VARS+=("GITHUB_OWNER=${GH_OWNER}")
VARS+=("GITHUB_REPO=${GH_REPO}")
VARS+=("GITHUB_BRANCH=${GH_BRANCH}")
VARS+=("GITHUB_CONTENT_DIR=${GH_CONTENT_DIR}")
VARS+=("IMAGE_HOST_TYPE=${IH_TYPE}")

# 根据图床类型添加对应变量
case "$IH_TYPE" in
  r2)
    VARS+=("R2_ACCOUNT_ID=${R2_ACCOUNT_ID}")
    VARS+=("R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}")
    VARS+=("R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}")
    VARS+=("R2_BUCKET=${R2_BUCKET}")
    VARS+=("R2_DOMAIN=${R2_DOMAIN}")
    VARS+=("R2_PREFIX=${R2_PREFIX}")
    ;;
  s3)
    VARS+=("S3_ENDPOINT=${S3_ENDPOINT}")
    VARS+=("S3_REGION=${S3_REGION}")
    VARS+=("S3_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID}")
    VARS+=("S3_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY}")
    VARS+=("S3_BUCKET=${S3_BUCKET}")
    VARS+=("S3_DOMAIN=${S3_DOMAIN}")
    VARS+=("S3_PREFIX=${S3_PREFIX}")
    VARS+=("S3_PATH_STYLE=${S3_PATH_STYLE}")
    ;;
  webdav)
    VARS+=("WEBDAV_URL=${WEBDAV_URL}")
    VARS+=("WEBDAV_USERNAME=${WEBDAV_USERNAME}")
    VARS+=("WEBDAV_PASSWORD=${WEBDAV_PASSWORD}")
    VARS+=("WEBDAV_DIRECTORY=${WEBDAV_DIRECTORY}")
    VARS+=("WEBDAV_DOMAIN=${WEBDAV_DOMAIN}")
    ;;
esac

# 构建 wrangler 命令参数
WRANGLER_ARGS=()
for var in "${VARS[@]}"; do
  key="${var%%=*}"
  val="${var#*=}"
  if [ -n "$val" ]; then
    WRANGLER_ARGS+=("--binding" "${key}=${val}")
  fi
done

if [ "$DRY_RUN" = true ]; then
  echo ""
  echo "🔍 Dry run — 将设置以下环境变量:"
  echo "=================================="
  for var in "${VARS[@]}"; do
    key="${var%%=*}"
    val="${var#*=}"
    # 对敏感值脱敏显示
    if [[ "$key" == *TOKEN* || "$key" == *SECRET* || "$key" == *PASSWORD* || "$key" == *KEY* ]]; then
      if [ -n "$val" ]; then
        masked="${val:0:4}****${val: -4}"
        echo "  ${key}=${masked}"
      else
        echo "  ${key}=(未设置)"
      fi
    else
      echo "  ${key}=${val:-"(未设置)"}"
    fi
  done
  echo ""
  echo "✅ Dry run 完成，未实际执行任何操作"
  exit 0
fi

# ===== 部署 =====
echo ""
echo "🚀 开始构建和部署..."
echo "=================================="

# 安装依赖
echo "📦 安装依赖..."
npm ci 2>/dev/null || npm install

# 构建
echo "🔨 构建项目..."
npm run build

# 部署到 Cloudflare Pages
echo "☁️  部署到 Cloudflare Pages..."
DEPLOY_CMD="wrangler pages deploy dist"
if [ -n "$PROJECT_NAME" ]; then
  DEPLOY_CMD="${DEPLOY_CMD} --project-name ${PROJECT_NAME}"
fi

# 通过 wrangler pages deploy 的 --branch 参数传递变量
# Cloudflare Pages 变量通过 Dashboard 或 wrangler secret 设置
# 这里我们先用 wrangler pages secret 批量设置

echo "🔑 同步环境变量到 Cloudflare Pages..."
PROJECT_FLAG=""
if [ -n "$PROJECT_NAME" ]; then
  PROJECT_FLAG="--project-name ${PROJECT_NAME}"
fi

for var in "${VARS[@]}"; do
  key="${var%%=*}"
  val="${var#*=}"
  if [ -n "$val" ]; then
    echo "  设置 ${key}..."
    # 使用 wrangler pages secret 设置（加密存储）
    echo -n "${val}" | wrangler pages secret put "${key}" ${PROJECT_FLAG} 2>/dev/null || \
      wrangler pages secret put "${key}" ${PROJECT_FLAG} <<< "${val}" 2>/dev/null || \
      echo "  ⚠️  ${key} 设置可能失败，请手动在 Cloudflare Dashboard 设置"
  fi
done

# 执行部署
echo ""
eval "${DEPLOY_CMD}"

echo ""
echo "✅ 部署完成！"
echo "=================================="
echo ""
echo "📌 后续步骤："
echo "  1. 检查 Cloudflare Pages Dashboard 确认环境变量已设置"
echo "  2. 如果某些变量设置失败，请手动在 Dashboard → Settings → Environment variables 中添加"
echo "  3. 你的站点地址: ${SITE_URL:-"在 Cloudflare Dashboard 中查看"}"
