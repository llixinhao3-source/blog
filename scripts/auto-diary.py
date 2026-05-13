#!/usr/bin/env python3
"""
OpenClaw 自动日记发布脚本

功能：
  1. 接收 OpenClaw 生成的日记 Markdown 字符串
  2. 按照 Astro Content Collection 规范写入 .mdx 文件
  3. 执行 Git add/commit/push 推送到 GitHub
  4. GitHub Actions 自动构建部署

用法：
  python3 scripts/auto-diary.py \
    --content "## 今日概要\n..." \
    --date "2026-05-14" \
    --title "每日学习 2026年5月14日"

  或者从 stdin 读取:
  cat diary.md | python3 scripts/auto-diary.py --date "2026-05-14"
"""

import argparse
import subprocess
import sys
import os
from datetime import date, datetime
from pathlib import Path

# ─── 配置 ───────────────────────────────────────────
REPO_DIR = Path(__file__).resolve().parent.parent       # 博客仓库根目录
POSTS_DIR = REPO_DIR / "src" / "content" / "posts"       # 文章目录
GIT_REMOTE = "origin"
GIT_BRANCH = "main"

CATEGORIES = {"hardware", "ai", "cuda", "guide"}

# ─── Frontmatter 生成 ────────────────────────────────

def make_frontmatter(
    title: str,
    description: str,
    diary_date: str,
    category: str = "guide",
    tags: list[str] | None = None,
    draft: bool = False,
) -> str:
    """生成 Astro Content Collection 兼容的 YAML Frontmatter"""
    if category not in CATEGORIES:
        print(f"⚠ category '{category}' 不在允许列表中，使用 'guide'")
        category = "guide"

    tags = tags or ["日常记录", "学习总结", "技术"]
    tags_yaml = ", ".join(f'"{t}"' for t in tags)

    return f"""---
title: "{title}"
description: "{description}"
date: {diary_date}
category: {category}
tags: [{tags_yaml}]
draft: {str(draft).lower()}
---
"""


# ─── 文件写入 ─────────────────────────────────────────

def write_diary(
    raw_content: str,
    diary_date: str,
    title: str | None = None,
    description: str | None = None,
    category: str = "guide",
    tags: list[str] | None = None,
) -> Path:
    """
    将日记内容写入 .mdx 文件。

    raw_content: 日记正文 Markdown（OpenClaw 生成的内容）
    返回写入的文件路径
    """
    # 自动生成标题
    if title is None:
        dt = datetime.strptime(diary_date, "%Y-%m-%d")
        title = f"每日学习 {dt.year}年{dt.month}月{dt.day}日"
        print(f"📝 自动生成标题: {title}")

    # 自动生成描述（取正文第一段有效文字）
    if description is None:
        desc_lines = [l for l in raw_content.strip().split("\n")
                      if l.strip() and not l.strip().startswith("#")]
        description = desc_lines[0][:80] if desc_lines else f"{diary_date} 技术日记"
        print(f"📝 自动生成描述: {description}")

    # 生成文件名：daily-YYYY-MM-DD.mdx
    filename = f"daily-{diary_date}.mdx"
    filepath = POSTS_DIR / filename

    # 确保目录存在
    POSTS_DIR.mkdir(parents=True, exist_ok=True)

    # 写入文件
    fm = make_frontmatter(title, description, diary_date, category, tags)
    full_content = fm + raw_content.strip() + "\n"

    filepath.write_text(full_content, encoding="utf-8")
    print(f"✅ 日记已写入: {filepath}")
    return filepath


# ─── Git 操作 ─────────────────────────────────────────

def git_push(filename: Path, diary_date: str):
    """将文件 add → commit → push 到 GitHub"""
    os.chdir(REPO_DIR)

    def run(cmd: list[str]):
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"❌ Git 错误: {' '.join(cmd)}")
            print(result.stderr)
            sys.exit(1)
        return result.stdout.strip()

    # 检查工作区状态
    status = run(["git", "status", "--porcelain", str(filename)])

    if not status:
        print("ℹ 文件无变更，跳过 push")
        return

    # Add
    run(["git", "add", str(filename)])
    print(f"📦 已暂存: {filename.name}")

    # Commit
    commit_msg = f"📝 自动日记: {diary_date}"
    run(["git", "commit", "-m", commit_msg])
    print(f"💾 已提交: {commit_msg}")

    # Push
    run(["git", "push", GIT_REMOTE, GIT_BRANCH])
    print(f"🚀 已推送至 {GIT_REMOTE}/{GIT_BRANCH}")


# ─── 主入口 ───────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="OpenClaw 自动日记发布 — 写入 MDX 并推送到 GitHub"
    )
    parser.add_argument(
        "--content", type=str, default=None,
        help="日记 Markdown 内容（也可通过 stdin 传入）"
    )
    parser.add_argument(
        "--date", type=str, required=True,
        help="日记日期，格式 YYYY-MM-DD（如 2026-05-14）"
    )
    parser.add_argument(
        "--title", type=str, default=None,
        help="文章标题（不提供则自动生成）"
    )
    parser.add_argument(
        "--description", type=str, default=None,
        help="文章摘要（不提供则自动提取正文首段）"
    )
    parser.add_argument(
        "--category", type=str, default="guide",
        choices=["hardware", "ai", "cuda", "guide"],
        help="文章分类"
    )
    parser.add_argument(
        "--tags", type=str, default=None,
        help="标签，逗号分隔（如 'AI,Agent,自动化'）"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="只生成文件，不执行 Git 操作"
    )
    parser.add_argument(
        "--no-push", action="store_true",
        help="生成文件并 commit，但不 push"
    )

    args = parser.parse_args()

    # 获取内容：--content 优先，否则从 stdin 读取
    content = args.content
    if content is None:
        if sys.stdin.isatty():
            print("❌ 请通过 --content 传入日记内容，或通过管道输入")
            print("   用法: cat diary.md | python3 auto-diary.py --date 2026-05-14")
            sys.exit(1)
        content = sys.stdin.read()

    if not content.strip():
        print("❌ 日记内容为空，退出")
        sys.exit(1)

    # 解析日期
    try:
        datetime.strptime(args.date, "%Y-%m-%d")
    except ValueError:
        print(f"❌ 日期格式错误: {args.date}，应为 YYYY-MM-DD")
        sys.exit(1)

    tags = None
    if args.tags:
        tags = [t.strip() for t in args.tags.split(",") if t.strip()]

    # 写入 .mdx
    filepath = write_diary(
        content, args.date,
        title=args.title,
        description=args.description,
        category=args.category,
        tags=tags,
    )

    if args.dry_run:
        print("🏁 --dry-run 模式，跳过 Git 操作")
        return

    # Git push
    git_push(filepath, args.date)

    # GitHub Actions 会在 push 后自动触发部署
    print("🎉 完成！GitHub Actions 将自动构建并部署博客。")


if __name__ == "__main__":
    main()
