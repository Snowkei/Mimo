/**
 * 服务端配置读取器
 * 优先从环境变量读取，用于 Cloudflare Pages 部署场景
 * 
 * 环境变量命名规则:
 *   GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, GITHUB_CONTENT_DIR
 *   IMAGE_HOST_TYPE
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_DOMAIN, R2_PREFIX
 *   S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET, S3_DOMAIN, S3_PREFIX, S3_PATH_STYLE
 *   WEBDAV_URL, WEBDAV_USERNAME, WEBDAV_PASSWORD, WEBDAV_DIRECTORY, WEBDAV_DOMAIN
 */

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  contentDir: string;
}

export interface ImageHostConfig {
  type: 'r2' | 's3' | 'webdav';
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
  domain?: string;
  prefix?: string;
  endpoint?: string;
  region?: string;
  pathStyle?: boolean;
  url?: string;
  username?: string;
  password?: string;
  directory?: string;
}

export interface AppConfig {
  github: GitHubConfig;
  imageHost: ImageHostConfig;
}

/**
 * 从环境变量读取配置（Cloudflare Pages 部署时使用）
 */
export function getConfigFromEnv(env: Record<string, any>): AppConfig | null {
  const ghToken = env.GITHUB_TOKEN;
  const ihType = env.IMAGE_HOST_TYPE;

  if (!ghToken && !ihType) return null;

  const github: GitHubConfig = {
    token: ghToken || '',
    owner: env.GITHUB_OWNER || 'Snowkei',
    repo: env.GITHUB_REPO || 'Mimo',
    branch: env.GITHUB_BRANCH || 'main',
    contentDir: env.GITHUB_CONTENT_DIR || 'src/content/blog/',
  };

  let imageHost: ImageHostConfig;
  if (ihType === 'r2') {
    imageHost = {
      type: 'r2',
      accountId: env.R2_ACCOUNT_ID || '',
      accessKeyId: env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
      bucket: env.R2_BUCKET || '',
      domain: env.R2_DOMAIN || '',
      prefix: env.R2_PREFIX || 'blog/',
    };
  } else if (ihType === 's3') {
    imageHost = {
      type: 's3',
      endpoint: env.S3_ENDPOINT || '',
      region: env.S3_REGION || 'us-east-1',
      accessKeyId: env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: env.S3_SECRET_ACCESS_KEY || '',
      bucket: env.S3_BUCKET || '',
      domain: env.S3_DOMAIN || '',
      prefix: env.S3_PREFIX || 'images/',
      pathStyle: env.S3_PATH_STYLE === 'true',
    };
  } else if (ihType === 'webdav') {
    imageHost = {
      type: 'webdav',
      url: env.WEBDAV_URL || '',
      username: env.WEBDAV_USERNAME || '',
      password: env.WEBDAV_PASSWORD || '',
      directory: env.WEBDAV_DIRECTORY || 'blog-images/',
      domain: env.WEBDAV_DOMAIN || '',
    };
  } else {
    imageHost = { type: 'r2' };
  }

  return { github, imageHost };
}

/**
 * 合并配置：环境变量 > 文件配置 > localStorage（前端）
 */
export function mergeConfig(
  envConfig: AppConfig | null,
  fileConfig: Partial<AppConfig> | null,
): AppConfig | null {
  if (!envConfig && !fileConfig) return null;
  if (!envConfig) return fileConfig as AppConfig;
  if (!fileConfig) return envConfig;

  return {
    github: { ...fileConfig.github, ...envConfig.github },
    imageHost: { ...fileConfig.imageHost, ...envConfig.imageHost } as ImageHostConfig,
  };
}

/**
 * 从 ImageHostConfig 提取上传 API 所需的 config 对象
 */
export function toUploadConfig(imageHost: ImageHostConfig): Record<string, any> {
  if (imageHost.type === 'r2') {
    return {
      type: 'r2',
      accountId: imageHost.accountId,
      accessKeyId: imageHost.accessKeyId,
      secretAccessKey: imageHost.secretAccessKey,
      bucket: imageHost.bucket,
      domain: imageHost.domain,
      prefix: imageHost.prefix,
    };
  }
  if (imageHost.type === 's3') {
    return {
      type: 's3',
      endpoint: imageHost.endpoint,
      region: imageHost.region,
      accessKeyId: imageHost.accessKeyId,
      secretAccessKey: imageHost.secretAccessKey,
      bucket: imageHost.bucket,
      domain: imageHost.domain,
      prefix: imageHost.prefix,
      pathStyle: imageHost.pathStyle,
    };
  }
  if (imageHost.type === 'webdav') {
    return {
      type: 'webdav',
      url: imageHost.url,
      username: imageHost.username,
      password: imageHost.password,
      directory: imageHost.directory,
      domain: imageHost.domain,
    };
  }
  return { type: imageHost.type };
}
