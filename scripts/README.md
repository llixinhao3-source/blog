# OpenClaw 自动日记 → Astro 博客发布方案

> 🆕 **MCP Server 升级版已发布！**  推荐使用 `mcp_server.py`，支持对话式调用、智能分类、标签推荐和首页状态联动。详见 [OPENCLAW_CONFIG.md](./OPENCLAW_CONFIG.md)

## 架构概览

### 方案 C：MCP Server（推荐 ★）

```
┌──────────────┐   自然语言对话   ┌──────────────┐   JSON-RPC  ┌──────────────┐
│  OpenClaw    │ ──  "帮我发布 ──→ │  LLM 生成    │ ──调用──→  │  mcp_server  │
│  对话界面    │      今天的日记"   │  Markdown    │            │  .py         │
└──────────────┘                  └──────────────┘            └──────┬───────┘
                                                                     │
                                                     · 智能分类       │ git push
                                                     · 标签推荐       │
                                                     · 状态联动       │
                                                            ┌────────▼─────────┐
                                                            │  GitHub Actions  │
                                                            │  · astro build   │
                                                            │  · deploy        │
                                                            └────────┬─────────┘
                                                                     │
                                                            ┌────────▼─────────┐
                                                            │   sevik.me       │
                                                            └──────────────────┘
```

### 方案 A / B（传统命令行）

```
┌──────────────┐     System Prompt     ┌──────────────┐
│  OpenClaw    │ ── 每日自动触发 ──→   │  LLM 生成    │
│  Cron 任务   │                       │  Markdown    │
└──────────────┘                       └──────┬───────┘
                                              │ 管道传入
                                    ┌─────────▼────────┐
                                    │  auto-diary.py   │
                                    │  · 生成frontmatter│
                                    │  · 写入 .mdx      │
                                    │  · git push       │
                                    └────────┬─────────┘
                                             │ push to main
                                    ┌────────▼─────────┐
                                    │  GitHub Actions  │
                                    │  · astro build    │
                                    │  · deploy gh-pages│
                                    └────────┬─────────┘
                                             │
                                    ┌────────▼─────────┐
                                    │   sevik.me       │
                                    │   (GitHub Pages) │
                                    └──────────────────┘
```

## 文件清单

```
scripts/
├── mcp_server.py              # ⭐ MCP Server（对话式发布，含智能分类+标签推荐）
├── auto-diary.py              # Python 命令行版
├── auto-diary.mjs             # Node.js 命令行版
├── auto-diary-api.py          # GitHub API 版（无需本地 Git）
├── openclaw-system-prompt.md  # OpenClaw System Prompt
├── OPENCLAW_CONFIG.md         # ⭐ MCP Server 详细配置文档
└── README.md                  # 本文件

.github/workflows/
└── deploy.yml                 # Astro 构建 + GitHub Pages 部署

.env.template                  # 环境变量模板
```

---

## 方案 A：本地 Git Push（推荐用于 OpenClaw 本地部署）

### 1. 确保本地仓库可 push

```bash
cd ~/blog
git remote -v   # 确认 origin 指向你的 GitHub 仓库
```

### 2. 验证脚本

```bash
# dry-run 测试：只生成文件，不 push
echo "## 今日概要\n- 测试\n\n## 工作记录\n1. 测试条目" | \
  python3 scripts/auto-diary.py --date 2026-05-14 --dry-run

# 正式执行
python3 scripts/auto-diary.py --date 2026-05-14 --content "## 今日概要..."
```

### 3. 在 OpenClaw 中调用

让 OpenClaw 执行 Shell 命令：

```bash
# OpenClaw 先生成日记内容，保存到临时文件，再调用脚本
python3 /path/to/blog/scripts/auto-diary.py --date "$(date +%Y-%m-%d)" --category guide < /tmp/diary.md
```

### Python 脚本参数说明

| 参数 | 必填 | 说明 |
|------|------|------|
| `--date` | ✅ | 日期 `YYYY-MM-DD` |
| `--content` | 否 | 日记内容（也可通过 stdin 管道传入） |
| `--title` | 否 | 标题（不填自动生成 `每日学习 2026年X月X日`） |
| `--description` | 否 | 摘要（不填自动提取正文前 80 字） |
| `--category` | 否 | 分类，默认 `guide` |
| `--tags` | 否 | 标签，逗号分隔，如 `AI,Agent,自动化` |
| `--dry-run` | 否 | 只生成文件，不执行 Git |
| `--no-push` | 否 | 生成并 commit，但不 push |

---

## 方案 B：GitHub API 直推（推荐用于 OpenClaw 云端部署）

当 OpenClaw 没有本地文件系统和 Git 权限时，使用 `auto-diary-api.py`。

### 1. 配置 GitHub Personal Access Token

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
export GITHUB_REPO=llixinhao3-source/claw-ga   # 你的仓库
```

### 2. 调用

```bash
echo "## 今日概要..." | DIARY_DATE=2026-05-14 python3 scripts/auto-diary-api.py
```

脚本通过 `PUT /repos/{owner}/{repo}/contents/{path}` 直接写入文件，推送后自动触发 Actions。

---

## GitHub Actions 部署配置

`.github/workflows/deploy.yml` 已配置好：

- **监听路径**：`src/content/posts/**` 等核心文件变更时触发
- **手动触发**：支持 `workflow_dispatch`
- **部署方式**：`peaceiris/actions-gh-pages@v4` 发布到 `gh-pages` 分支
- **自定义域名**：`sevik.me`（在 Actions 中配置 CNAME）

### 首次配置

1. 在 GitHub 仓库 → Settings → Pages → Source 选择 `Deploy from a branch`
2. Branch 选择 `gh-pages` `/ (root)`
3. Custom domain 填写 `sevik.me`
4. 推送 `.github/workflows/deploy.yml` 到 `main` 分支即可

---

## OpenClaw System Prompt 配置

将 `scripts/openclaw-system-prompt.md` 的内容配置为 OpenClaw 的 System Prompt。关键要点：

### 输出结构（5 个固定章节）

```
## 今日概要
## 工作记录
## 技术笔记
## 明日关注
## 今日金句
```

### 内容质量要求

| 要求 | 说明 |
|------|------|
| **有代码块** | 技术笔记至少 2 个代码块 |
| **前 80 字精炼** | 卡片摘要取正文前 80 字，开头必须写最有价值内容 |
| **具体可查** | 文件路径、命令参数、错误信息都要写出来 |
| **3-8 条工作记录** | 每条 1-3 句 |
| **标签建议** | 默认 `#日常记录 #学习总结 #技术`，可添加当天的关键标签 |

### Frontmatter 自动生成

OpenClaw **不需要**生成 frontmatter，脚本会自动添加：

```yaml
---
title: "每日学习 2026年1月1日"     # 自动生成
description: "正文首段前80字"        # 自动提取
date: 2026-01-01                    # --date 参数
category: guide                     # --category 参数
tags: ["日常记录", "学习总结", "技术"]  # --tags 参数
draft: false                        # 始终 false
---
```

### UI 卡片适配

你的 [ArticleCard.astro](file:///Users/sevik/Desktop/blog/src/components/home/ArticleCard.astro) 卡片显示：

```
┌─────────────────────────────────────┐
│ 2026/05/13          博客指南        │  ← date + category badge
│                                     │
│ 每日学习 2026年5月13日              │  ← title (h3)
│                                     │
│ 记录每天的工作、解决的技术问题...    │  ← description (line-clamp-2, 前80字)
│                                     │
│ #日常记录 #学习总结 #技术 #自动化    │  ← tags (最多4个)
└─────────────────────────────────────┘
```

因此生成的日记：
- **title** 不要太长（20 字以内）
- **description** 前 80 字必须包含文章核心信息
- **tags** 控制在 4-6 个，前 4 个展示在卡片上

---

## Cron 定时触发

在 OpenClaw 中设置定时任务，每天 23:00（北京时间）自动生成并发布日记：

```bash
# crontab 或 OpenClaw Schedule
0 23 * * * cd ~/blog && openclaw generate-diary | python3 scripts/auto-diary.py --date "$(date +%Y-%m-%d)"
```

也可以分步执行：

```bash
# 步骤1：OpenClaw 生成日记内容到文件
openclaw run "generate today's diary" > /tmp/diary-$(date +%Y-%m-%d).md

# 步骤2：脚本写入并 push
python3 scripts/auto-diary.py \
  --date "$(date +%Y-%m-%d)" \
  --category guide \
  --tags "技术,OpenClaw,AI Agent,自动化" \
  < /tmp/diary-$(date +%Y-%m-%d).md
```

---

## 完整调用示例

```bash
# OpenClaw 生成内容 → 管道传入脚本

openclaw run --system-prompt scripts/openclaw-system-prompt.md \
  "汇总我今天的工作：重构了博客遮罩组件，写了 auto-diary.py 脚本" \
  | python3 scripts/auto-diary.py \
    --date 2026-05-14 \
    --category guide \
    --tags "博客开发,OpenClaw,自动化,UI" \
    --description "重构遮罩标题组件并实现自动日记发布流水线"
```
