# Sevik's Blog — 项目总结

> 极简工业风个人技术博客 | Astro v6 + React 19 + Tailwind CSS v4 + Framer Motion

---

## 一、项目概览

| 维度 | 详情 |
|------|------|
| **定位** | 个人技术品牌博客，记录从嵌入式硬件到工业级 AI 算法部署的成长路径 |
| **风格** | StormZhang 极简工业风，深色主题 + 电光绿强调色 |
| **生成** | 75 个静态页面，构建耗时 ~3.7s |
| **源码** | ~2100 行 TypeScript/Astro/CSS |
| **部署** | 支持 GitHub Pages / Vercel 一键部署 |

---

## 二、技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | Astro | 6.3.1 | 静态站点生成，群岛架构 |
| UI 库 | React | 19.1.0 | 交互岛屿组件 |
| 动画 | Framer Motion | 12.7.4 | 入场动画、数字滚动、标签云 |
| 样式 | Tailwind CSS | 4.1.3 | 原子化 CSS，深色主题定制 |
| 排版 | @tailwindcss/typography | 0.5.16 | 文章排版增强 |
| 内容 | @astrojs/mdx | 5.0.4 | Markdown 内容集合 |
| 代码高亮 | Shiki | Astro 内置 | github-dark 主题 |
| 图标 | lucide-react | 0.488.0 | 线性图标（已引入，按需使用） |
| SEO | @astrojs/sitemap + RSS | 3.7.2 / 4.0.11 | 站点地图 + RSS 订阅 |
| 部署 | GitHub Pages / Vercel | — | 静态站点托管 |

### 关键架构决策

- **Tailwind 集成**：绕过 `@astrojs/tailwind` 兼容性问题，改用 `@tailwindcss/postcss`（PostCSS 插件方式）
- **MDX**：使用 `astro:content` 的 `render()` 函数预渲染，避免 `post.render is not a function` 问题
- **水合策略**：交互组件使用 `client:visible` / `client:load`，其余纯静态输出（零 JS 默认）

---

## 三、页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | Hero 粒子文字 + 统计面板 + 运行时长 + 文章列表 |
| `/posts` | 文章列表 | 全部文章网格展示 |
| `/posts/[slug]` | 文章详情 | MDX 渲染 + 目录导航 + 上一篇/下一篇 |
| `/projects` | 项目展示 | 硬件专区 + AI 实验室，4 个项目卡片 |
| `/about` | 关于我 | 个人简介 + 技能图谱 + 时间线 + 自我评价 |
| `/tags` | 标签/分类页 | 分类列表 + 标签云 |
| `/tags/[tag]` | 标签筛选 | 按标签筛选的文章列表 |
| `/rss.xml` | RSS Feed | 自动生成 |

---

## 四、组件架构

```
src/
├── components/
│   ├── layout/        # 全局布局
│   │   ├── Header.astro       固定顶部导航，滚动模糊+汉堡菜单
│   │   └── Footer.astro       底部版权+社交链接
│   ├── home/          # 首页模块
│   │   ├── HeroSection.astro  Hero 区域容器
│   │   ├── HeroParticles.tsx  Canvas 粒子文字（React 岛屿）
│   │   ├── ArticleCard.astro  文章卡片（纯静态）
│   │   ├── StatsPanel.tsx     统计数字动画（client:visible）
│   │   └── UptimeCounter.tsx  运行时长实时计时器（client:load）
│   ├── post/          # 文章详情
│   │   ├── TableOfContents.tsx     悬浮目录导航（client:visible）
│   │   └── PostNavigation.astro    上一篇/下一篇导航
│   ├── projects/      # 项目卡片
│   │   └── ProjectCard.astro       项目展示卡片
│   ├── about/         # 关于页
│   │   ├── SkillCard.astro         技能卡片
│   │   ├── Timeline.astro          项目时间线
│   │   └── SocialLinks.astro       社交链接
│   ├── tags/          # 标签云
│   │   └── TagCloud.tsx            Framer Motion 标签云（client:visible）
│   ├── ui/            # 通用 UI
│   │   ├── Badge.astro             标签徽章
│   │   ├── AnimatedCounter.tsx     数字滚动动画
│   │   └── ScrollReveal.tsx        滚动渐入效果
│   └── Particles.astro             全局粒子背景特效
├── content/posts/     # 14 篇 MDX 博文
├── data/              # 静态数据（站点配置、项目数据）
├── layouts/
│   └── BaseLayout.astro   全局布局模板（SEO meta + Header + Footer + Particles）
├── pages/             # 页面路由
├── styles/
│   └── global.css         主题变量 + 排版样式 + 导航动效
├── types/             # TypeScript 类型定义
└── utils/             # 工具函数（日期格式化、字数统计）
```

### 交互岛屿表

| 组件 | 客户端指令 | 原因 |
|------|-----------|------|
| `HeroParticles` | `client:load` | Canvas 特效需要立即启动 |
| `StatsPanel` | `client:visible` | 进入视口时播放数字动画 |
| `UptimeCounter` | `client:load` | 需要实时更新天数 |
| `TableOfContents` | `client:visible` | 进入视口时加载 |
| `TagCloud` | `client:visible` | 进入视口时播放入场动画 |

---

## 五、内容体系

### 14 篇博文分布

| 分类 | 篇数 | 文章 |
|------|------|------|
| 🔌 底层硬件 | 4 | ESP32-S3 入门、WiFi/MQTT 通信、双麦克风阵列 I2S 调优、CH341 串口通信 |
| 🧠 AI 算法 | 3 | MCP 协议与硬件接入、PyTorch/ONNX 模型部署、夏柔 AI SOP |
| 💻 CUDA 学习 | 3 | CUDA 编程入门、内存优化与 Bank Conflict、Stream 流并发 |
| 📖 博客指南 | 4 | Hexo→Astro 迁移、群岛架构详解、Tailwind v4 深色主题、Framer Motion 实战 |

### 4 个展示项目

| 专区 | 项目 |
|------|------|
| 硬件专区 | ESP32-S3 智能硬件开发平台、Openclaw 硬件集成与 AI 框架接入 |
| AI 实验室 | 工业级检测数据自动化处理、夏柔 AI 框架 SOP 总结与部署实践 |

---

## 六、设计系统

| 令牌 | 值 | 用途 |
|------|-----|------|
| `--color-bg-primary` | `#0a0a0a` | 主背景 |
| `--color-bg-secondary` | `#111111` | 次级背景 |
| `--color-bg-card` | `#161616` | 卡片背景 |
| `--color-accent` | `#00ff41` | 电光绿强调色 |
| `--color-accent-warm` | `#ffb347` | 暖琥珀辅助色 |
| `--color-text-primary` | `#e4e4e7` | 主文字 |
| `--color-text-secondary` | `#a1a1aa` | 次级文字 |
| `--color-text-muted` | `#71717a` | 辅助文字 |

- **标题字体**：JetBrains Mono（等宽，开发者气质）
- **正文字体**：Noto Sans SC（中英文混排优化）
- **最大内容宽度**：720px（详情页）/ 800px（列表页）
- **布局**：桌面端双列文章网格，移动端单列

---

## 七、特效系统

### 1. 全局粒子背景 (`Particles.astro`)
- 80 个电光绿粒子在背景运动，碰撞边界反弹
- 粒子间距 <120px 时绘制半透明连线
- 鼠标移近时粒子被排斥推开
- `position: fixed` + `z-index: -1`，始终在内容层下方

### 2. Hero 粒子文字 (`HeroParticles.tsx`)
- Canvas 采样 "从硬件到底层 / 构建技术深度" 的文字像素
- 数百个绿色粒子组成文字形状
- 鼠标划过时粒子被推开形成"真空"区域
- 鼠标离开后弹性回归原位
- 支持 Retina 高分屏

### 3. 数字滚动动画 (`AnimatedCounter.tsx`)
- 统计数据（文章数、标签数、总字数）使用三次缓入动画
- 触发时机：进入视口 (`useInView`)

### 4. 标签云 (`TagCloud.tsx`)
- 标签字号按文章数量等比缩放
- Framer Motion 交错渐入动画
- hover 时颜色过渡到电光绿

---

## 八、性能指标

| 指标 | 数值 |
|------|------|
| 构建页面数 | 75 |
| 构建时间 | ~3.7s |
| 首页默认 JS | 0 KB（除交互岛屿） |
| 交互岛屿总 JS | ~30 KB（按需加载） |
| Lighthouse 性能 | 预期 ≥ 95 |
| SEO | sitemap.xml + RSS + OG Meta |

---

## 九、目录结构总览

```
blog/
├── astro.config.mjs          # Astro 配置（集成、Shiki、站点 URL）
├── package.json               # 依赖与脚本
├── postcss.config.js          # Tailwind PostCSS 插件配置
├── tsconfig.json              # TypeScript 严格模式
├── public/
│   └── favicon.svg            # 自定义 SVG 图标
├── src/
│   ├── components/            # 18 个组件（9 Astro + 6 TSX + 3 等待中）
│   ├── content/
│   │   ├── config.ts          # Content Collections 定义
│   │   └── posts/             # 14 篇 MDX 博文
│   ├── data/                  # 站点配置、项目数据
│   ├── layouts/
│   │   └── BaseLayout.astro   # 全局布局
│   ├── pages/                 # 7 个页面路由
│   ├── styles/
│   │   └── global.css         # Tailwind 入口 + 自定义主题
│   ├── types/                 # TypeScript 类型
│   └── utils/                 # 工具函数
├── dist/                      # 构建输出（gitignore）
├── .trae/documents/            # PRD & 技术架构文档
└── PROJECT_SUMMARY.md          # 本文档
```

---

## 十、本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev          # → http://localhost:4321

# 生产构建
npm run build        # → dist/

# 预览生产构建
npm run preview
```

环境变量：`ASTRO_TELEMETRY_DISABLED=1` 可禁用遥测上报。

---

## 十一、后续可扩展项

- [ ] 搜索功能
- [ ] 评论系统（Giscus / Waline）
- [ ] 图片懒加载集成
- [ ] 文章分页
- [ ] 暗色/亮色主题切换
- [ ] PWA 支持
