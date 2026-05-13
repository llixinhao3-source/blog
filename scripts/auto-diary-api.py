#!/usr/bin/env python3
"""
OpenClaw MCP 工具 — 通过 GitHub API 直接创建文件

如果 OpenClaw 没有本地文件系统权限，可以用这个脚本通过
GitHub REST API 直接将日记内容写入仓库。

环境变量：
  GITHUB_TOKEN=ghp_xxx
  GITHUB_REPO=llixinhao3-source/claw-ga
"""

import os
import sys
import base64
import json
import urllib.request
import urllib.error
from datetime import datetime

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
GITHUB_REPO = os.environ.get("GITHUB_REPO", "llixinhao3-source/claw-ga")
BRANCH = "main"
BASE_URL = f"https://api.github.com/repos/{GITHUB_REPO}"

if not GITHUB_TOKEN:
    print("❌ 请设置环境变量 GITHUB_TOKEN", file=sys.stderr)
    sys.exit(1)


def github_request(method: str, path: str, body: dict | None = None) -> dict:
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"Bearer {GITHUB_TOKEN}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "OpenClaw-Diary")

    if body:
        data = json.dumps(body).encode("utf-8")
        req.add_header("Content-Type", "application/json")
        req.add_header("Content-Length", str(len(data)))
    else:
        data = None

    try:
        with urllib.request.urlopen(req, data=data) as res:
            return json.loads(res.read())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"❌ GitHub API 错误 {e.code}: {error_body}", file=sys.stderr)
        sys.exit(1)


def push_diary(content: str, diary_date: str):
    """通过 GitHub API 创建/更新日记文件"""

    file_path = f"src/content/posts/daily-{diary_date}.mdx"

    # 生成 frontmatter
    dt = datetime.strptime(diary_date, "%Y-%m-%d")
    title = f"每日学习 {dt.year}年{dt.month}月{dt.day}日"
    first_line = next((l for l in content.strip().split("\n")
                       if l.strip() and not l.strip().startswith("#") and not l.strip().startswith("-")),
                      f"{diary_date} 技术日记")
    description = first_line[:80]

    fm = f"""---
title: "{title}"
description: "{description}"
date: {diary_date}
category: guide
tags: ["日常记录", "学习总结", "技术"]
draft: false
---
"""
    file_content = fm + content.strip() + "\n"
    encoded = base64.b64encode(file_content.encode("utf-8")).decode("ascii")

    # 检查文件是否已存在
    try:
        existing = github_request("GET", f"/contents/{file_path}?ref={BRANCH}")
        sha = existing.get("sha")
        print(f"📝 更新已存在的文件: {file_path} (sha: {sha})")
    except SystemExit:
        sha = None
        print(f"📝 创建新文件: {file_path}")

    body = {
        "message": f"📝 自动日记: {diary_date}",
        "content": encoded,
        "branch": BRANCH,
    }
    if sha:
        body["sha"] = sha

    result = github_request("PUT", f"/contents/{file_path}", body)
    print(f"✅ 文件已创建/更新: {result['content']['html_url']}")
    print("🎉 GitHub Actions 将自动触发构建部署。")
    return result


def main():
    content = sys.stdin.read()
    if not content.strip():
        print("❌ 日记内容为空，退出", file=sys.stderr)
        sys.exit(1)

    diary_date = os.environ.get("DIARY_DATE") or datetime.now().strftime("%Y-%m-%d")
    push_diary(content.strip(), diary_date)


if __name__ == "__main__":
    main()
