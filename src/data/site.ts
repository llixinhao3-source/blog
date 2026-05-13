export const SITE_CONFIG = {
  title: 'Sevik\'s Blog',
  description: '专注 OpenClaw 应用落地与 AI Agent 全链路开发',
  author: '李心皓',
  url: 'https://sevik.me',
  startDate: new Date('2026-05-13'),
  socialLinks: {
    github: 'https://github.com/dashboard',
    email: 'mailto:sevik@example.com',
  },
};

export const NAV_ITEMS = [
  { label: '首页', href: '/' },
  { label: '文章', href: '/posts' },
  { label: '项目', href: '/projects' },
  { label: '关于', href: '/about' },
];

export const CATEGORY_COLORS: Record<string, string> = {
  hardware: 'text-accent-warm border-accent-warm/30 bg-accent-warm/10',
  ai: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  cuda: 'text-green-400 border-green-400/30 bg-green-400/10',
  guide: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
};