import type { APIRoute } from 'astro';

export const prerender = false;

let _cachedConfig: any = undefined;

export const GET: APIRoute = async () => {
  // 通过 import.meta.glob 读取（dev 环境可用）
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    _cachedConfig = body;
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
