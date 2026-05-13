#!/usr/bin/env python3
"""
Sevik Blog MCP Server —— OpenClaw 智能日记发布引擎

通过 MCP (Model Context Protocol) 协议，将 auto-diary.py 升级为
可被 OpenClaw 直接调用的工具服务器。

协议: JSON-RPC 2.0 over stdio
工具: publish_daily_log
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

# ═══════════════════════════════════════════════════════
# 配置
# ═══════════════════════════════════════════════════════

REPO_DIR = Path(__file__).resolve().parent.parent
POSTS_DIR = REPO_DIR / "src" / "content" / "posts"
SITE_TS = REPO_DIR / "src" / "data" / "site.ts"
HERO_ASTRO = REPO_DIR / "src" / "components" / "home" / "HeroSection.astro"
PERSONAL_INTRO_TSX = REPO_DIR / "src" / "components" / "home" / "PersonalIntro.tsx"

GIT_REMOTE = os.environ.get("GIT_REMOTE", "origin")
GIT_BRANCH = os.environ.get("GIT_BRANCH", "main")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
CNAME_DOMAIN = os.environ.get("CNAME_DOMAIN", "sevik.me")

CATEGORIES = {"hardware", "ai", "cuda", "guide"}

# ═══════════════════════════════════════════════════════
# 智能分类引擎 —— 关键词判定
# ═══════════════════════════════════════════════════════

CATEGORY_PATTERNS: dict[str, list[str]] = {
    "hardware": [
        r"ESP32", r"esp32", r"S3", r"嵌入式", r"单片机", r"GPIO", r"SPI",
        r"I2C", r"UART", r"PWM", r"ADC", r"FreeRTOS", r"Arduino",
        r"电路", r"焊接", r"示波器", r"万用表", r"传感器", r"电机",
        r"PCB", r"硬件", r"引脚", r"寄存器", r"中断", r"DMA",
        r"烧录", r"固件", r"bootloader", r"JTAG", r"SWD",
    ],
    "ai": [
        r"模型", r"训练", r"推理", r"深度学习", r"神经网络", r"transformer",
        r"PyTorch", r"TensorFlow", r"ONNX", r"量化", r"剪枝",
        r"OpenClaw", r"Claude", r"GPT", r"DeepSeek", r"LLM",
        r"大模型", r"Agent", r"agent", r"RAG", r"检索增强",
        r"Prompt", r"prompt", r"智能体", r"MCP", r"工具调用",
        r"微调", r"fine.tune", r"向量数据库", r"embedding",
        r"语义", r"NL[PU]", r"token", r"Token",
    ],
    "cuda": [
        r"CUDA", r"cuda", r"GPU", r"gpu", r"kernel", r"核函数",
        r"显存", r"内存带宽", r"并行", r"线程块", r"warp",
        r"cuBLAS", r"cuDNN", r"TensorRT", r"NVRTC",
        r"流式多处理器", r"共享内存", r"全局内存",
    ],
}

TAG_POOL: dict[str, list[str]] = {
    "hardware": ["嵌入式", "ESP32", "硬件", "驱动开发", "固件", "电子工程", "调试"],
    "ai": ["AI", "OpenClaw", "大模型", "Agent", "自动化", "智能体", "Prompt工程"],
    "cuda": ["CUDA", "GPU", "并行计算", "高性能计算", "优化"],
    "guide": ["博客", "技术写作", "笔记", "教程", "学习总结", "日常记录"],
}


def detect_category(content: str, user_specified: str | None = None) -> str:
    """基于关键词匹配的智能分类"""
    if user_specified and user_specified in CATEGORIES:
        return user_specified

    scores: dict[str, int] = {}
    for cat, patterns in CATEGORY_PATTERNS.items():
        score = 0
        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            score += len(matches)
        scores[cat] = score

    best = max(scores, key=scores.get) if scores else "guide"
    if scores.get(best, 0) == 0:
        best = "guide"
    return best


def extract_description(content: str, max_chars: int = 80) -> str:
    """从正文提取前 80 字作为 description"""
    lines = [
        l.strip()
        for l in content.split("\n")
        if l.strip()
        and not l.strip().startswith("#")
        and not l.strip().startswith("```")
        and not l.strip().startswith("- [")
    ]
    if not lines:
        return "技术日记"
    text = lines[0]
    text = re.sub(r"[\*\-\•\d+\.]\s+", "", text).strip()
    return text[:max_chars]


def auto_tags(content: str, category: str, count: int = 5) -> list[str]:
    """根据内容和分类自动推荐标签"""
    tags: list[str] = []
    lower = content.lower()

    # AI 类标签检测
    if re.search(r"openclaw|claw|agent|mcp|prompt|智能体|工具调用|技能", lower):
        tags.append("OpenClaw")
    if re.search(r"agent|智能体|多agent|multi.agent", lower):
        tags.append("AI Agent")
    if re.search(r"LLM|大模型|claude|gpt|deepseek|模型|推理|生成", lower):
        tags.append("大模型")
    if re.search(r"RAG|检索|向量|embedding|知识库", lower):
        tags.append("RAG")
    if re.search(r"自动化|工作流|pipeline|编排|n8n|dify|coze", lower):
        tags.append("自动化")
    if re.search(r"prompt|提示词|system.prompt", lower):
        tags.append("Prompt工程")
    if re.search(r"mcp|协议|server|tool", lower):
        tags.append("MCP")

    # 硬件类标签
    if re.search(r"esp32|s3|嵌入式|gpio|spi|i2c|uart|固件|烧录", lower):
        tags.append("ESP32")
    if re.search(r"硬件|电路|焊接|pcb|传感器|电机|引脚", lower):
        tags.append("硬件")

    # 软件工程标签
    if re.search(r"astro|博客|blog|tailwind|css|前端|组件", lower):
        tags.append("博客开发")
    if re.search(r"python|node\.?js|typescript|react|fastapi", lower):
        tags.append("后端")
    if re.search(r"git|github|actions|部署|CI|CD|docker", lower):
        tags.append("DevOps")
    if re.search(r"cuda|gpu|并行|kernel|tensorrt", lower):
        tags.append("CUDA")

    # 基础标签
    base_tags = ["学习总结", "日常记录", "技术"]
    for t in base_tags:
        if t not in tags:
            tags.append(t)

    # 按匹配顺序截断
    return tags[:count]


# ═══════════════════════════════════════════════════════
# 首页状态联动
# ═══════════════════════════════════════════════════════

def update_homepage_status(status_line: str) -> bool:
    """
    更新首页 PersonalIntro 卡片的状态文字。

    PersonalIntro.tsx 中有类似:
      <span>在线 · 正在编码中...</span>

    这里将 "正在编码中..." 替换为用户指定的状态。
    """
    try:
        source = PERSONAL_INTRO_TSX.read_text(encoding="utf-8")

        # 匹配模式: 在线 · (任意文字)
        pattern = r"(在线\s*[·•]\s*)(.*?)(?=<)"
        if re.search(pattern, source):
            new_source = re.sub(pattern, rf"\g<1>{status_line}", source, count=1)
            PERSONAL_INTRO_TSX.write_text(new_source, encoding="utf-8")
            return True
        return False
    except Exception as e:
        sys.stderr.write(f"⚠ 更新首页状态失败: {e}\n")
        return False


# ═══════════════════════════════════════════════════════
# 文件与 Git 操作
# ═══════════════════════════════════════════════════════

def make_frontmatter(
    title: str,
    description: str,
    diary_date: str,
    category: str,
    tags: list[str],
    draft: bool = False,
) -> str:
    if category not in CATEGORIES:
        category = "guide"
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


def write_diary(
    content: str,
    diary_date: str,
    title: str | None,
    description: str | None,
    category: str,
    tags: list[str],
) -> Path:
    if title is None:
        dt = datetime.strptime(diary_date, "%Y-%m-%d")
        title = f"每日学习 {dt.year}年{dt.month}月{dt.day}日"

    if description is None:
        description = extract_description(content)

    filename = f"daily-{diary_date}.mdx"
    filepath = POSTS_DIR / filename
    POSTS_DIR.mkdir(parents=True, exist_ok=True)

    fm = make_frontmatter(title, description, diary_date, category, tags)
    full = fm + content.strip() + "\n"
    filepath.write_text(full, encoding="utf-8")

    return filepath


def git_push(filepath: Path, diary_date: str, *, status_file: Path | None = None) -> list[str]:
    """Push 到 GitHub，可选提交首页状态文件"""
    import os as _os
    _os.chdir(str(REPO_DIR))

    files = [str(filepath)]
    if status_file:
        files.append(str(status_file))

    def run(cmd: list[str]) -> str:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"Git error: {' '.join(cmd)}\n{result.stderr}")
        return result.stdout.strip()

    status = run(["git", "status", "--porcelain", "--"] + files)
    if not status:
        return ["ℹ 文件无变更"]

    for f in files:
        run(["git", "add", f])

    msg = f"📝 自动日记: {diary_date}"
    run(["git", "commit", "-m", msg])

    run(["git", "push", GIT_REMOTE, GIT_BRANCH])
    return [f"📦 已推送 {len(files)} 个文件", f"💾 {msg}"]


# ═══════════════════════════════════════════════════════
# MCP JSON-RPC 2.0 协议处理器
# ═══════════════════════════════════════════════════════

SERVER_NAME = "sevik-blog-mcp"
SERVER_VERSION = "2.0.0"

TOOLS = [
    {
        "name": "publish_daily_log",
        "description": (
            "将 AI 生成的每日技术日记发布到 Sevik 的 Astro 博客。"
            "自动检测内容分类、提取摘要、推荐标签，并推送到 GitHub 触发部署。"
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "日记 Markdown 正文（不含 frontmatter），需包含 ## 今日概要、## 工作记录、## 技术笔记等章节",
                },
                "date": {
                    "type": "string",
                    "description": "日记日期 YYYY-MM-DD，不填则使用今天",
                },
                "title": {
                    "type": "string",
                    "description": "文章标题，不填自动生成「每日学习 2026年X月X日」",
                },
                "category": {
                    "type": "string",
                    "enum": ["hardware", "ai", "cuda", "guide"],
                    "description": "手动指定分类，不填则自动根据关键词判断（如 ESP32→hardware，OpenClaw→ai）",
                },
                "tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "手动指定标签，不填则自动根据内容推荐 3-5 个",
                },
                "status": {
                    "type": "string",
                    "description": "（可选）更新首页在线状态文字，如「刚写完 MCP Server」「调试 ESP32-S3 中」",
                },
                "dry_run": {
                    "type": "boolean",
                    "description": "预览模式：只生成文件不推送。默认 false",
                },
            },
            "required": ["content"],
        },
    },
]


def handle_initialize(params: dict[str, Any]) -> dict[str, Any]:
    return {
        "protocolVersion": "2024-11-05",
        "capabilities": {"tools": {}},
        "serverInfo": {
            "name": SERVER_NAME,
            "version": SERVER_VERSION,
        },
    }


def handle_tools_list() -> dict[str, Any]:
    return {"tools": TOOLS}


def handle_tools_call(params: dict[str, Any]) -> dict[str, Any]:
    name = params.get("name")
    arguments = params.get("arguments", {})

    if name != "publish_daily_log":
        return {
            "content": [{"type": "text", "text": f"❌ 未知工具: {name}"}],
            "isError": True,
        }

    content_raw: str = arguments.get("content", "")
    diary_date: str = arguments.get("date") or datetime.now().strftime("%Y-%m-%d")
    title: str | None = arguments.get("title")
    category_in: str | None = arguments.get("category")
    tags_in: list[str] | None = arguments.get("tags")
    status: str | None = arguments.get("status")
    dry_run: bool = arguments.get("dry_run", False)

    if not content_raw.strip():
        return {
            "content": [{"type": "text", "text": "❌ 日记内容不能为空"}],
            "isError": True,
        }

    # 智能分类
    category = detect_category(content_raw, category_in)
    if category_in and category_in != category:
        pass  # 用户指定优先，已在上方处理

    # 智能标签
    tags = tags_in if tags_in else auto_tags(content_raw, category)

    # 提取描述
    description = extract_description(content_raw)

    # 自动标题
    if title is None:
        dt = datetime.strptime(diary_date, "%Y-%m-%d")
        title = f"每日学习 {dt.year}年{dt.month}月{dt.day}日"

    log_lines: list[str] = []
    log_lines.append(f"📅 日期: {diary_date}")
    log_lines.append(f"📌 标题: {title}")
    log_lines.append(f"🏷 分类: {category} (自动检测)")
    log_lines.append(f"🔖 标签: {', '.join(tags)}")
    log_lines.append(f"📝 摘要: {description}")
    log_lines.append("")

    # 写入文件
    try:
        filepath = write_diary(content_raw, diary_date, title, description, category, tags)
        log_lines.append(f"✅ 文件已写入: {filepath}")
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"❌ 文件写入失败: {e}"}],
            "isError": True,
        }

    # 首页状态联动
    status_file = None
    if status:
        ok = update_homepage_status(status)
        if ok:
            log_lines.append(f"🟢 首页状态已更新: {status}")
            status_file = PERSONAL_INTRO_TSX
        else:
            log_lines.append("⚠ 首页状态更新失败（未匹配到状态行）")

    if dry_run:
        log_lines.append("🏁 DRY-RUN 模式，跳过 Git 推送")
        return {"content": [{"type": "text", "text": "\n".join(log_lines)}]}

    # Git push
    try:
        msgs = git_push(filepath, diary_date, status_file=status_file)
        log_lines.extend(msgs)
    except Exception as e:
        return {
            "content": [{"type": "text", "text": "\n".join(log_lines) + f"\n❌ Git 推送失败: {e}"}],
            "isError": True,
        }

    log_lines.append("")
    log_lines.append(f"🌐 稍后访问: https://{CNAME_DOMAIN}")

    return {"content": [{"type": "text", "text": "\n".join(log_lines)}]}


def handle_request(request: dict[str, Any]) -> dict[str, Any] | None:
    method = request.get("method")
    req_id = request.get("id")
    params = request.get("params", {})

    if method == "initialize":
        result = handle_initialize(params)
    elif method == "tools/list":
        result = handle_tools_list()
    elif method == "tools/call":
        result = handle_tools_call(params)
    elif method == "notifications/initialized":
        return None  # 不响应通知
    else:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32601, "message": f"Method not found: {method}"},
        }

    return {"jsonrpc": "2.0", "id": req_id, "result": result}


# ═══════════════════════════════════════════════════════
# 主循环 —— stdin → stdout JSON-RPC
# ═══════════════════════════════════════════════════════

def main():
    # 输出日志到 stderr，不污染 MCP stdio 通道
    sys.stderr.write(f"[{SERVER_NAME} v{SERVER_VERSION}] 启动中...\n")
    sys.stderr.write(f"[MCP] 仓库路径: {REPO_DIR}\n")
    sys.stderr.flush()

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            request = json.loads(line)
        except json.JSONDecodeError as e:
            sys.stderr.write(f"[MCP] JSON 解析错误: {e}\n")
            continue

        response = handle_request(request)
        if response is not None:
            sys.stdout.write(json.dumps(response, ensure_ascii=False) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
