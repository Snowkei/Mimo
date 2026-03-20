/** 估算阅读时间（中文 ~400字/分钟，英文 ~200词/分钟） */
export function getReadingTime(content: string): string {
  // 移除代码块和 HTML 标签
  const clean = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();

  // 统计中文字符
  const chineseChars = (clean.match(/[\u4e00-\u9fff]/g) || []).length;
  // 统计英文单词
  const englishWords = clean
    .replace(/[\u4e00-\u9fff]/g, '')
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.ceil(chineseChars / 400 + englishWords / 200);
  return `${Math.max(1, minutes)} 分钟阅读`;
}

/** 格式化日期 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** 截断文本 */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}
