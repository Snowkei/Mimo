import type { APIRoute } from 'astro';
import { getConfigFromEnv, toUploadConfig } from '../../utils/config';

export const prerender = false;

// 生成唯一文件名
function generateFilename(originalName: string): string {
  // 只保留安全的扩展名
  const rawExt = originalName.split('.').pop()?.toLowerCase() || 'png';
  const ext = /^[a-z0-9]+$/.test(rawExt) ? rawExt : 'png';
  const timestamp = Date.now();
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `${timestamp}-${random}.${ext}`;
}

// 获取 MIME 类型
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    avif: 'image/avif',
    ico: 'image/x-icon',
  };
  return mimeMap[ext || ''] || 'application/octet-stream';
}

// ============ R2 / S3 上传（AWS Signature V4）============
async function uploadToS3(file: File, config: any): Promise<{ url: string }> {
  const filename = generateFilename(file.name);
  const key = `${config.prefix || ''}${filename}`.replace(/^\/+/, '');
  const contentType = file.type || getMimeType(file.name);
  const fileBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(fileBuffer);

  // 确定 endpoint
  let endpoint: string;
  if (config.type === 'r2') {
    endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
  } else {
    endpoint = config.endpoint.replace(/\/$/, '');
  }

  const region = config.region || 'auto';
  const bucket = config.bucket;
  const url = `${endpoint}/${bucket}/${key}`;

  // AWS Signature V4 签名
  const now = new Date();
  const dateStamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '').substring(0, 8);
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').substring(0, 15) + 'Z';
  const service = 's3';

  // Canonical request
  const canonicalUri = `/${bucket}/${key}`;
  const canonicalQueryString = '';
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const payloadHash = await sha256Hex(fileBytes);

  const parsedUrl = new URL(url);
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${parsedUrl.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join('\n') + '\n';

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  // String to sign
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(new TextEncoder().encode(canonicalRequest)),
  ].join('\n');

  // Signing key
  const signingKey = await getSignatureKey(config.secretAccessKey, dateStamp, region, service);
  const signature = await hmacHex(signingKey, new TextEncoder().encode(stringToSign));

  const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  // 发送请求
  const resp = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Host': parsedUrl.host,
      'X-Amz-Content-Sha256': payloadHash,
      'X-Amz-Date': amzDate,
      'Authorization': authorization,
    },
    body: fileBytes,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`S3/R2 上传失败 (${resp.status}): ${text}`);
  }

  // 返回 URL
  if (config.domain) {
    const domain = config.domain.replace(/\/$/, '');
    return { url: `${domain}/${key}` };
  }

  // R2 公开 URL（通过 dev endpoint）
  if (config.type === 'r2') {
    return { url: `https://pub-${config.accountId}.r2.dev/${key}` };
  }

  return { url };
}

// ============ WebDAV 上传 ============
async function uploadToWebDAV(file: File, config: any): Promise<{ url: string }> {
  const filename = generateFilename(file.name);
  const dir = (config.directory || '').replace(/^\/+|\/+$/g, '');
  const key = dir ? `${dir}/${filename}` : filename;
  const contentType = file.type || getMimeType(file.name);
  const fileBuffer = await file.arrayBuffer();

  const baseUrl = config.url.replace(/\/$/, '');
  const uploadUrl = `${baseUrl}/${key}`;

  // Basic Auth
  const auth = btoa(`${config.username}:${config.password}`);

  // 先确保目录存在（MKCOL）
  if (dir) {
    const dirUrl = `${baseUrl}/${dir}`;
    await fetch(dirUrl, {
      method: 'MKCOL',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    }).catch(() => {}); // 忽略已存在的错误
  }

  // PUT 上传文件
  const resp = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': contentType,
    },
    body: fileBuffer,
  });

  if (!resp.ok && resp.status !== 201 && resp.status !== 204) {
    const text = await resp.text().catch(() => '');
    throw new Error(`WebDAV 上传失败 (${resp.status}): ${text}`);
  }

  // 返回 URL
  if (config.domain) {
    const domain = config.domain.replace(/\/$/, '');
    return { url: `${domain}/${key}` };
  }

  return { url: uploadUrl };
}

// ============ Crypto 工具函数 ============
async function sha256Hex(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(key: Uint8Array | string, data: Uint8Array): Promise<Uint8Array> {
  const keyData = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, data);
  return new Uint8Array(sig);
}

async function hmacHex(key: Uint8Array | string, data: Uint8Array): Promise<string> {
  const sig = await hmacSha256(key, data);
  return Array.from(sig).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getSignatureKey(secretKey: string, dateStamp: string, region: string, service: string): Promise<Uint8Array> {
  const kDate = await hmacSha256(`AWS4${secretKey}`, new TextEncoder().encode(dateStamp));
  const kRegion = await hmacSha256(kDate, new TextEncoder().encode(region));
  const kService = await hmacSha256(kRegion, new TextEncoder().encode(service));
  const kSigning = await hmacSha256(kService, new TextEncoder().encode('aws4_request'));
  return kSigning;
}

// ============ 配置校验 ============
function validateConfig(config: Record<string, any>): string | null {
  if (config.type === 'r2') {
    for (const key of ['accountId', 'accessKeyId', 'secretAccessKey', 'bucket']) {
      if (!config[key]) return key;
    }
  } else if (config.type === 's3') {
    for (const key of ['endpoint', 'accessKeyId', 'secretAccessKey', 'bucket']) {
      if (!config[key]) return key;
    }
  } else if (config.type === 'webdav') {
    for (const key of ['url', 'username', 'password']) {
      if (!config[key]) return key;
    }
  }
  return null;
}

// ============ API Handler ============
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const configStr = formData.get('config') as string | null;

    if (!file) {
      return new Response(JSON.stringify({ error: '没有上传文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 优先从环境变量读取图床配置（Cloudflare Pages 部署）
    let config: Record<string, any> | null = null;
    const runtimeEnv = (locals as any)?.runtime?.env;
    if (runtimeEnv) {
      const envConfig = getConfigFromEnv(runtimeEnv);
      if (envConfig?.imageHost?.type) {
        config = toUploadConfig(envConfig.imageHost);
      }
    }

    // 兜底：从请求参数读取（localStorage 方式）
    if (!config && configStr) {
      try {
        config = JSON.parse(configStr);
      } catch {
        return new Response(JSON.stringify({ error: '配置格式错误' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (!config) {
      return new Response(JSON.stringify({ error: '缺少图床配置：请在服务器设置环境变量或在页面中配置' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 文件大小限制：10MB
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: '文件大小不能超过 10MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 仅允许图片
    if (!file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: '只允许上传图片文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 验证配置类型
    if (!['r2', 's3', 'webdav'].includes(config.type)) {
      return new Response(JSON.stringify({ error: '不支持的图床类型' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 验证必填字段
    const missing = validateConfig(config);
    if (missing) {
      return new Response(JSON.stringify({ error: `配置缺少: ${missing}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let result: { url: string };

    if (config.type === 'r2' || config.type === 's3') {
      result = await uploadToS3(file, config);
    } else {
      result = await uploadToWebDAV(file, config);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return new Response(JSON.stringify({ error: err.message || '上传失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
