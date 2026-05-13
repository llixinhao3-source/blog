#!/usr/bin/env node
/**
 * OpenClaw 自动日记发布 — Node.js 版
 *
 * 用法：
 *   node scripts/auto-diary.mjs                        # 从 stdin 读取
 *   node scripts/auto-diary.mjs "## 今日概要..."       # 命令行传入
 *
 * 环境变量：
 *   DIARY_DATE=2026-05-14  node scripts/auto-diary.mjs
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_DIR = join(__dirname, '..');
const POSTS_DIR = join(REPO_DIR, 'src', 'content', 'posts');

const CATEGORIES = ['hardware', 'ai', 'cuda', 'guide'];
const TODAY = new Date().toISOString().slice(0, 10);
const DIARY_DATE = process.env.DIARY_DATE || TODAY;

// ─── 读取内容 ────────────────────────────────────────

let content = process.argv[2];
if (!content) {
  const chunks = [];
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) chunks.push(chunk);
  content = chunks.join('');
}

if (!content?.trim()) {
  console.error('❌ 请传入日记内容（命令行参数或 stdin）');
  process.exit(1);
}

// ─── 生成 Frontmatter ────────────────────────────────

const [dYear, dMonth, dDay] = DIARY_DATE.split('-');
const title = `"每日学习 ${+dYear}年${+dMonth}月${+dDay}日"`;

const firstLine = content.trim().split('\n').find(l =>
  l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('-')
) || `${DIARY_DATE} 技术日记`;
const description = `"${firstLine.slice(0, 80)}"`;

const tags = ['日常记录', '学习总结', '技术'];

const fm = `---
title: ${title}
description: ${description}
date: ${DIARY_DATE}
category: guide
tags: [${tags.map(t => `"${t}"`).join(', ')}]
draft: false
---
`;

const filename = `daily-${DIARY_DATE}.mdx`;
const filepath = join(POSTS_DIR, filename);

if (!existsSync(POSTS_DIR)) mkdirSync(POSTS_DIR, { recursive: true });
writeFileSync(filepath, fm + content.trim() + '\n', 'utf8');
console.log(`✅ 日记已写入: ${filepath}`);

// ─── Git Push ─────────────────────────────────────────

try {
  const status = execSync(`git status --porcelain "${filepath}"`, { cwd: REPO_DIR, encoding: 'utf8' }).trim();
  if (!status) {
    console.log('ℹ 文件无变更，跳过 push');
    process.exit(0);
  }
} catch { /* 未跟踪文件也继续 */ }

execSync(`git add "${filepath}"`, { cwd: REPO_DIR, stdio: 'inherit' });
execSync(`git commit -m "📝 自动日记: ${DIARY_DATE}"`, { cwd: REPO_DIR, stdio: 'inherit' });
execSync('git push origin main', { cwd: REPO_DIR, stdio: 'inherit' });

console.log('🎉 完成！GitHub Actions 将自动构建并部署博客。');
