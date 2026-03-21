import type { APIRoute } from 'astro';

export const prerender = false;

// 尝试静态导入 config.json（在 dev 环境和有文件的部署中可用）
let _cachedConfig: any = undefined;

/**
 * GET: 读取配置
 * 优先从静态导入的 config.json 读取（dev 环境 / 本地文件存在时）
 * 也支持通过 import.meta.glob 扫描
 */
export const GET: APIRoute = async () => {
  // 方式1: 通过 import.meta.glob 动态导入（Astro/Vite 编译时处理）
  try {
    const modules = import.meta.glob('../../../config.json', { eager: true });
    const key = Object.keys(modules)[0];
    if (key) {
      const mod = modules[key] as any;
      const config = mod.default || mod;
      return new Response(JSON.stringify({ config, exists: true, source: 'file' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {}

  // 方式2: 返回缓存（运行时通过 POST 写入的）
  if (_cachedConfig) {
    return new Response(JSON.stringify({ config: _cachedConfig, exists: true, source: 'cache' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    error: '配置文件不存在。请在项目根目录创建 config.json，或通过下方按钮导入。',
    exists: false,
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * POST: 缓存配置到内存（当环境不支持文件写入时）
 * 前端会同步将配置下载为文件
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    _cachedConfig = {
      github: {
        token: body.github?.token || '',
        owner: body.github?.owner || '',
        repo: body.github?.repo || '',
        branch: body.github?.branch || 'main',
        contentDir: body.github?.contentDir || 'src/content/blog/',
      },
      imageHost: {
        type: body.imageHost?.type || 'r2',
        accountId: body.imageHost?.accountId || '',
        accessKeyId: body.imageHost?.accessKeyId || '',
        secretAccessKey: body.imageHost?.secretAccessKey || '',
        bucket: body.imageHost?.bucket || '',
        domain: body.imageHost?.domain || '',
        prefix: body.imageHost?.prefix || '',
        endpoint: body.imageHost?.endpoint || '',
        region: body.imageHost?.region || '',
        pathStyle: body.imageHost?.pathStyle || false,
        url: body.imageHost?.url || '',
        username: body.imageHost?.username || '',
        password: body.imageHost?.password || '',
        directory: body.imageHost?.directory || '',
      },
    };
    return new Response(JSON.stringify({ success: true, message: '配置已保存' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || '保存失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
