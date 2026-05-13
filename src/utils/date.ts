export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateFull(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getDaysSince(startDate: Date): number {
  const diff = Date.now() - startDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    hardware: '底层硬件',
    ai: 'AI 算法',
    cuda: 'CUDA 学习',
    guide: '博客指南',
  };
  return labels[category] || category;
}