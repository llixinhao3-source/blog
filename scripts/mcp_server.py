#!/usr/bin/env python3
"""
Sevik Blog MCP Server v3.0 —— OpenClaw 情绪联动发布引擎

新增 publish_with_vibes 工具：
  分析情绪 → 匹配音乐 → 提取金句 → 自动分类 → GitHub 推送

协议: JSON-RPC 2.0 over stdio
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

# ═══════════════════════════════════════════════════════
# 配置
# ═══════════════════════════════════════════════════════

REPO_DIR = Path(__file__).resolve().parent.parent
POSTS_DIR = REPO_DIR / "src" / "content" / "posts"
PERSONAL_INTRO_TSX = REPO_DIR / "src" / "components" / "home" / "PersonalIntro.tsx"

GIT_REMOTE = os.environ.get("GIT_REMOTE", "origin")
GIT_BRANCH = os.environ.get("GIT_BRANCH", "main")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
CNAME_DOMAIN = os.environ.get("CNAME_DOMAIN", "sevik.me")
NETEASE_API_KEY = os.environ.get("NETEASE_API_KEY", "")

CATEGORIES = {"hardware", "ai", "cuda", "guide"}

# ═══════════════════════════════════════════════════════
# 情绪引擎
# ═══════════════════════════════════════════════════════

MOOD_KEYWORDS: dict[str, list[str]] = {
    "happy": [
        "完成", "成功", "解决", "突破", "开心", "激动", "喜悦", "太棒了",
        "终于", "跑通了", "搞定", "收工", "庆祝", "里程碑",
        "success", "done", "🎉", "😊", "✨",
    ],
    "focused": [
        "专注", "深入", "分析", "研究", "优化", "调试", "重构",
        "梳理", "总结", "归纳", "抽象", "架构", "设计",
        "refactor", "optimize", "deep.dive", "🧠",
    ],
    "tired": [
        "疲惫", "累了", "困难", "问题", "卡住", "bug", "报错",
        "折腾", "加班", "深夜", "终于修好", "踩坑",
        "debug", "fix", "issue", "😴", "😩",
    ],
    "calm": [
        "记录", "整理", "复习", "阅读", "学习", "笔记",
        "平静", "日常", "随笔", "回顾",
        "note", "learn", "read", "🌿",
    ],
    "excited": [
        "新发现", "灵感", "创意", "突破性", "惊艳", "酷",
        "amazing", "wow", "mind.blowing", "⚡", "🔥", "💡",
    ],
}

MOOD_PLAYLISTS: dict[str, dict[str, str]] = {
    "happy": {"id": "6683713201", "label": "愉快", "emoji": "😊"},
    "focused": {"id": "3097211423", "label": "专注", "emoji": "🧠"},
    "tired": {"id": "2960483441", "label": "疲惫", "emoji": "😴"},
    "calm": {"id": "2912689177", "label": "平静", "emoji": "🌿"},
    "excited": {"id": "6683713201", "label": "兴奋", "emoji": "⚡"},
}

SCENE_THEMES = {
    "cosmic": {"name": "cosmic", "label": "深空", "accent": "#c084fc"},
    "aurora": {"name": "aurora", "label": "极光", "accent": "#38bdf8"},
    "ember": {"name": "ember", "label": "余烬", "accent": "#fbbf24"},
    "forest": {"name": "forest", "label": "密林", "accent": "#34d399"},
    "void": {"name": "void", "label": "虚空", "accent": "#818cf8"},
}

SCENE_KEYWORDS: dict[str, list[str]] = {
    "cosmic": ["深夜", "星空", "星辰", "宇宙", "浩瀚", "AI", "智能", "未来", "突破", "创新", "探索"],
    "aurora": ["清晨", "灵感", "创意", "代码", "编程", "流畅", "优雅", "设计", "架构", "黎明"],
    "ember": ["午后", "坚持", "努力", "攻坚", "突破", "热血", "激情", "奋斗", "挑战"],
    "forest": ["黄昏", "安静", "总结", "复盘", "沉淀", "学习", "阅读", "笔记", "积累"],
    "void": ["深夜", "孤独", "思考", "哲学", "本质", "底层", "原理", "源码", "深入"],
}


def detect_scene_theme(content: str, mood: str) -> str:
    """根据日记内容+情绪推断场景主题"""
    scores: dict[str, int] = {}
    for theme, keywords in SCENE_KEYWORDS.items():
        scores[theme] = sum(len(re.findall(re.escape(kw), content, re.IGNORECASE)) for kw in keywords)

    # 情绪加权
    mood_theme_bias = {
        "excited": "ember", "happy": "aurora", "focused": "void",
        "tired": "cosmic", "calm": "forest",
    }
    bias = mood_theme_bias.get(mood)
    if bias and bias in scores:
        scores[bias] += 3

    best = max(scores, key=scores.get) if scores else "cosmic"
    return best if scores.get(best, 0) > 0 else "cosmic"


def determine_card_rarity(content: str, mood: str, quote: str | None) -> str:
    """根据内容质量+情绪+金句判定卡牌稀有度"""
    score = 0
    # 金句加分
    if quote:
        score += 2
        if len(quote) > 15:
            score += 1
    # 突破性关键词
    for kw in ["突破", "搞定", "成功", "里程碑", "创新", "amazing", "wow", "首创", "第一次"]:
        score += len(re.findall(re.escape(kw), content, re.IGNORECASE))
    # 深度技术
    for kw in ["源码", "底层", "内核", "架构", "设计模式", "算法", "优化", "refactor"]:
        score += len(re.findall(re.escape(kw), content, re.IGNORECASE)) * 2

    # 情绪加权
    if mood == "excited":
        score += 3
    elif mood == "focused":
        score += 2

    if score >= 7:
        return "epic"
    elif score >= 3:
        return "rare"
    return "common"


def analyze_mood(content: str) -> str:
    """分析日记情绪，返回 mood key"""
    scores: dict[str, int] = {}
    for mood, keywords in MOOD_KEYWORDS.items():
        score = 0
        for kw in keywords:
            score += len(re.findall(re.escape(kw), content, re.IGNORECASE))
        scores[mood] = score
    best = max(scores, key=scores.get) if scores else "calm"
    if scores.get(best, 0) == 0:
        best = "calm"
    return best


def extract_golden_quote(content: str) -> str | None:
    """从日记中提取「今日金句」"""
    m = re.search(
        r"#+\s*今日金句.*?\n+>+\s*[\"「]?(.+?)[\"」]?\s*$",
        content, re.MULTILINE,
    )
    if m:
        return m.group(1).strip()
    m = re.search(r'>\s*"(.+?)"', content)
    if m:
        return m.group(1).strip()
    return None


# ═══════════════════════════════════════════════════════
# 智能分类 + 标签（保持与 v2 兼容）
# ═══════════════════════════════════════════════════════

CATEGORY_PATTERNS: dict[str, list[str]] = {
    "hardware": [
        r"ESP32", r"esp32", r"S3", r"嵌入式", r"单片机", r"GPIO", r"SPI",
        r"I2C", r"UART", r"PWM", r"ADC", r"FreeRTOS", r"Arduino",
        r"电路", r"焊接", r"示波器", r"传感器", r"电机",
        r"PCB", r"硬件", r"引脚", r"寄存器", r"中断", r"DMA",
        r"烧录", r"固件", r"bootloader",
    ],
    "ai": [
        r"模型", r"训练", r"推理", r"深度学习", r"神经网络",
        r"OpenClaw", r"Claude", r"GPT", r"DeepSeek", r"LLM",
        r"大模型", r"Agent", r"RAG", r"检索增强",
        r"Prompt", r"智能体", r"MCP", r"工具调用",
        r"微调", r"向量数据库", r"embedding",
    ],
    "cuda": [
        r"CUDA", r"GPU", r"kernel", r"核函数",
        r"显存", r"并行", r"cuBLAS", r"cuDNN", r"TensorRT",
    ],
}


def detect_category(content: str, user_specified: str | None = None) -> str:
    if user_specified and user_specified in CATEGORIES:
        return user_specified
    scores: dict[str, int] = {}
    for cat, patterns in CATEGORY_PATTERNS.items():
        scores[cat] = sum(len(re.findall(p, content, re.IGNORECASE)) for p in patterns)
    best = max(scores, key=scores.get) if scores else "guide"
    return best if scores.get(best, 0) > 0 else "guide"


def extract_description(content: str, max_chars: int = 80) -> str:
    lines = [
        l.strip() for l in content.split("\n")
        if l.strip() and not l.strip().startswith("#")
        and not l.strip().startswith("```") and not l.strip().startswith("- [")
    ]
    if not lines:
        return "技术日记"
    return re.sub(r"[\*\-\•\d+\.]\s+", "", lines[0]).strip()[:max_chars]


def auto_tags(content: str, category: str, count: int = 5) -> list[str]:
    tags: list[str] = []
    lower = content.lower()
    if re.search(r"openclaw|claw|agent|mcp|prompt|智能体|工具调用|技能", lower):
        tags.append("OpenClaw")
    if re.search(r"agent|智能体|多agent", lower):
        tags.append("AI Agent")
    if re.search(r"LLM|大模型|claude|gpt|deepseek|模型|推理", lower):
        tags.append("大模型")
    if re.search(r"RAG|检索|向量|embedding", lower):
        tags.append("RAG")
    if re.search(r"自动化|工作流|pipeline|编排|n8n|dify", lower):
        tags.append("自动化")
    if re.search(r"prompt|提示词|system.prompt", lower):
        tags.append("Prompt工程")
    if re.search(r"mcp|协议|server|tool", lower):
        tags.append("MCP")
    if re.search(r"esp32|s3|嵌入式|gpio|spi|i2c|uart|固件", lower):
        tags.append("ESP32")
    if re.search(r"硬件|电路|焊接|pcb|传感器", lower):
        tags.append("硬件")
    if re.search(r"astro|博客|blog|tailwind|css|前端|组件", lower):
        tags.append("博客开发")
    if re.search(r"git|github|actions|部署|CI|CD|docker", lower):
        tags.append("DevOps")
    if re.search(r"cuda|gpu|并行|kernel|tensorrt", lower):
        tags.append("CUDA")
    for t in ["学习总结", "日常记录", "技术"]:
        if t not in tags:
            tags.append(t)
    return tags[:count]


# ═══════════════════════════════════════════════════════
# 首页状态联动
# ═══════════════════════════════════════════════════════

def update_homepage_status(status_line: str) -> bool:
    try:
        source = PERSONAL_INTRO_TSX.read_text(encoding="utf-8")
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
# 文件生成与 Git
# ═══════════════════════════════════════════════════════

def make_frontmatter(
    title: str,
    description: str,
    diary_date: str,
    category: str,
    tags: list[str],
    music_id: str = "",
    golden_quote: str = "",
    scene_theme: str = "",
    card_rarity: str = "",
    draft: bool = False,
) -> str:
    if category not in CATEGORIES:
        category = "guide"
    tags_yaml = ", ".join(f'"{t}"' for t in tags)
    lines = [
        "---",
        f'title: "{title}"',
        f'description: "{description}"',
        f"date: {diary_date}",
        f"category: {category}",
        f"tags: [{tags_yaml}]",
        f'draft: {str(draft).lower()}',
    ]
    if music_id:
        lines.append(f"music_id: {music_id}")
    if golden_quote:
        escaped = golden_quote.replace('"', '\\"')
        lines.append(f'golden_quote: "{escaped}"')
    if scene_theme:
        lines.append(f"scene_theme: {scene_theme}")
    if card_rarity:
        lines.append(f"card_rarity: {card_rarity}")
    lines.append("---")
    return "\n".join(lines) + "\n"


def write_diary(
    content: str,
    diary_date: str,
    title: str | None,
    description: str | None,
    category: str,
    tags: list[str],
    music_id: str = "",
    golden_quote: str = "",
    scene_theme: str = "",
    card_rarity: str = "",
) -> Path:
    if title is None:
        dt = datetime.strptime(diary_date, "%Y-%m-%d")
        title = f"每日学习 {dt.year}年{dt.month}月{dt.day}日"
    if description is None:
        description = extract_description(content)
    filename = f"daily-{diary_date}.mdx"
    filepath = POSTS_DIR / filename
    POSTS_DIR.mkdir(parents=True, exist_ok=True)
    fm = make_frontmatter(title, description, diary_date, category, tags, music_id, golden_quote, scene_theme, card_rarity)
    full = fm + content.strip() + "\n"
    filepath.write_text(full, encoding="utf-8")
    return filepath


def git_push(filepath: Path, diary_date: str, *, status_file: Path | None = None) -> list[str]:
    os.chdir(str(REPO_DIR))
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
    run(["git", "commit", "-m", f"📝 自动日记: {diary_date}"])
    run(["git", "push", GIT_REMOTE, GIT_BRANCH])
    return [f"📦 已推送 {len(files)} 个文件", f"💾 commit: {diary_date}"]


# ═══════════════════════════════════════════════════════
# MCP 协议
# ═══════════════════════════════════════════════════════

SERVER_NAME = "sevik-blog-mcp"
SERVER_VERSION = "4.0.0"

TOOLS = [
    {
        "name": "publish_daily_log",
        "description": "将 AI 生成的每日技术日记发布到 Sevik 的 Astro 博客。自动检测内容分类、提取摘要、推荐标签，并推送到 GitHub 触发部署。",
        "inputSchema": {
            "type": "object",
            "properties": {
                "content": {"type": "string", "description": "日记 Markdown 正文（不含 frontmatter）"},
                "date": {"type": "string", "description": "日记日期 YYYY-MM-DD，不填则使用今天"},
                "title": {"type": "string", "description": "文章标题，不填自动生成"},
                "category": {"type": "string", "enum": ["hardware", "ai", "cuda", "guide"], "description": "手动指定分类"},
                "tags": {"type": "array", "items": {"type": "string"}, "description": "手动指定标签"},
                "status": {"type": "string", "description": "更新首页在线状态文字"},
                "dry_run": {"type": "boolean", "description": "预览模式"},
            },
            "required": ["content"],
        },
    },
    {
        "name": "publish_with_vibes",
        "description": (
            "【★ 推荐】情绪联动全流程发布：分析日记情绪 → 匹配网易云歌单 → 提取今日金句 "
            "→ 自动分类 → 智能标签推荐 → 更新首页状态 → Git Push → 自动部署。"
            "一次调用完成所有步骤。"
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "日记 Markdown 正文（不含 frontmatter），需包含 ## 今日金句 章节",
                },
                "date": {"type": "string", "description": "日记日期 YYYY-MM-DD，不填则使用今天"},
                "title": {"type": "string", "description": "文章标题，不填自动生成"},
                "category": {"type": "string", "enum": ["hardware", "ai", "cuda", "guide"], "description": "手动覆盖分类（否则自动检测）"},
                "tags": {"type": "array", "items": {"type": "string"}, "description": "手动追加标签"},
                "status_override": {"type": "string", "description": "手动覆盖首页状态（否则自动根据情绪生成）"},
                "dry_run": {"type": "boolean", "description": "预览模式：显示分析结果但不真正推送"},
            },
            "required": ["content"],
        },
    },
]


def handle_initialize(params: dict[str, Any]) -> dict[str, Any]:
    return {
        "protocolVersion": "2024-11-05",
        "capabilities": {"tools": {}},
        "serverInfo": {"name": SERVER_NAME, "version": SERVER_VERSION},
    }


def handle_tools_list() -> dict[str, Any]:
    return {"tools": TOOLS}


def handle_publish_daily_log(arguments: dict[str, Any]) -> dict[str, Any]:
    """处理 publish_daily_log 工具调用（v2 兼容）"""
    content_raw: str = arguments.get("content", "")
    diary_date: str = arguments.get("date") or datetime.now().strftime("%Y-%m-%d")
    title: str | None = arguments.get("title")
    category_in: str | None = arguments.get("category")
    tags_in: list[str] | None = arguments.get("tags")
    status: str | None = arguments.get("status")
    dry_run: bool = arguments.get("dry_run", False)

    if not content_raw.strip():
        return {"content": [{"type": "text", "text": "❌ 日记内容不能为空"}], "isError": True}

    category = detect_category(content_raw, category_in)
    tags = tags_in if tags_in else auto_tags(content_raw, category)
    description = extract_description(content_raw)

    if title is None:
        dt = datetime.strptime(diary_date, "%Y-%m-%d")
        title = f"每日学习 {dt.year}年{dt.month}月{dt.day}日"

    log_lines = [
        f"📅 日期: {diary_date}",
        f"📌 标题: {title}",
        f"🏷 分类: {category} (自动检测)",
        f"🔖 标签: {', '.join(tags)}",
        f"📝 摘要: {description}",
        "",
    ]

    try:
        filepath = write_diary(content_raw, diary_date, title, description, category, tags)
        log_lines.append(f"✅ 文件已写入: {filepath}")
    except Exception as e:
        return {"content": [{"type": "text", "text": f"❌ 文件写入失败: {e}"}], "isError": True}

    status_file = None
    if not dry_run:
        if status:
            ok = update_homepage_status(status)
            if ok:
                log_lines.append(f"🟢 首页状态已更新: {status}")
                status_file = PERSONAL_INTRO_TSX
            else:
                log_lines.append("⚠ 首页状态更新失败")
    elif status:
        log_lines.append(f"🟡 DRY-RUN: 首页状态将更新为「{status}」")

    if dry_run:
        log_lines.append("🏁 DRY-RUN 模式，跳过 Git 推送")
        return {"content": [{"type": "text", "text": "\n".join(log_lines)}]}

    try:
        msgs = git_push(filepath, diary_date, status_file=status_file)
        log_lines.extend(msgs)
    except Exception as e:
        return {"content": [{"type": "text", "text": "\n".join(log_lines) + f"\n❌ Git 推送失败: {e}"}], "isError": True}

    log_lines.append("")
    log_lines.append(f"🌐 稍后访问: https://{CNAME_DOMAIN}")
    return {"content": [{"type": "text", "text": "\n".join(log_lines)}]}


def handle_publish_with_vibes(arguments: dict[str, Any]) -> dict[str, Any]:
    """处理 publish_with_vibes 工具调用 —— 全流程情绪联动"""
    content_raw: str = arguments.get("content", "")
    diary_date: str = arguments.get("date") or datetime.now().strftime("%Y-%m-%d")
    title: str | None = arguments.get("title")
    category_in: str | None = arguments.get("category")
    user_tags: list[str] | None = arguments.get("tags")
    status_override: str | None = arguments.get("status_override")
    dry_run: bool = arguments.get("dry_run", False)

    if not content_raw.strip():
        return {"content": [{"type": "text", "text": "❌ 日记内容不能为空"}], "isError": True}

    # 1. 分析情绪
    mood = analyze_mood(content_raw)
    playlist = MOOD_PLAYLISTS[mood]

    # 2. 提取金句
    quote = extract_golden_quote(content_raw)

    # 3. 智能分类
    category = detect_category(content_raw, category_in)

    # 4. 智能标签（合并用户指定）
    tags = auto_tags(content_raw, category)
    if user_tags:
        for t in user_tags:
            if t not in tags:
                tags.append(t)
    tags = tags[:6]  # 最多 6 个

    # 5. 描述
    description = extract_description(content_raw)

    # 6. 标题
    if title is None:
        dt = datetime.strptime(diary_date, "%Y-%m-%d")
        title = f"每日学习 {dt.year}年{dt.month}月{dt.day}日"

    # 7. 首页状态（情绪驱动）
    if status_override:
        status_line = status_override
    else:
        status_templates = {
            "happy": f"刚完成了很棒的工作 {playlist['emoji']}",
            "focused": f"深度编码中 {playlist['emoji']}",
            "tired": f"踩坑修复中 {playlist['emoji']}",
            "calm": f"安静学习中 {playlist['emoji']}",
            "excited": f"发现新大陆 {playlist['emoji']}",
        }
        status_line = status_templates.get(mood, f"在线 {playlist['emoji']}")

    # 8. 场景主题 + 卡牌稀有度（新增 v4.0）
    scene_theme = detect_scene_theme(content_raw, mood)
    theme_info = SCENE_THEMES[scene_theme]
    card_rarity = determine_card_rarity(content_raw, mood, quote)

    # 9. 构建日志
    log_lines = [
        "╔══════════════════════════════════╗",
        "║   🎭 Sevik Blog · Vibe Check   ║",
        "╚══════════════════════════════════╝",
        "",
        f"🔮 情绪分析: {playlist['emoji']} {playlist['label']}",
        f"🎵 推荐歌单: {playlist['label']}歌单 (ID: {playlist['id']})",
        f"🔗 网易云: https://music.163.com/playlist?id={playlist['id']}",
        f"🌌 场景主题: {theme_info['label']} ({theme_info['accent']})",
        f"🃏 卡牌稀有度: {card_rarity.upper()}",
    ]
    if quote:
        log_lines.append(f'💬 今日金句: "{quote}"')
    else:
        log_lines.append("💬 今日金句: (未检测到)")

    log_lines += [
        "",
        f"📅 日期: {diary_date}",
        f"📌 标题: {title}",
        f"🏷 分类: {category}",
        f"🔖 标签: {', '.join(tags)}",
        f"📝 摘要: {description}",
        "",
    ]

    # 10. 写入文件（含 music_id, golden_quote, scene_theme, card_rarity）
    music_id = playlist["id"]
    try:
        filepath = write_diary(
            content_raw, diary_date, title, description,
            category, tags,
            music_id=music_id,
            golden_quote=quote or "",
            scene_theme=scene_theme,
            card_rarity=card_rarity,
        )
        log_lines.append(f"✅ 文件已写入: {filepath}")
        log_lines.append(f"🎵 frontmatter.music_id: {music_id}")
        if quote:
            log_lines.append(f'💬 frontmatter.golden_quote: "{quote}"')
        log_lines.append(f"🌌 frontmatter.scene_theme: {scene_theme}")
        log_lines.append(f"🃏 frontmatter.card_rarity: {card_rarity}")
    except Exception as e:
        return {"content": [{"type": "text", "text": f"❌ 文件写入失败: {e}"}], "isError": True}

    # 11. 首页状态联动 (dry_run 跳过文件修改)
    status_file = None
    if not dry_run:
        try:
            ok = update_homepage_status(status_line)
            if ok:
                log_lines.append(f"🟢 首页状态已更新: {status_line}")
                status_file = PERSONAL_INTRO_TSX
            else:
                log_lines.append("⚠ 首页状态更新失败")
        except Exception as e:
            log_lines.append(f"⚠ 首页状态更新异常: {e}")
    else:
        log_lines.append(f"🟡 DRY-RUN: 首页状态将更新为「{status_line}」")

    if dry_run:
        log_lines.append("🏁 DRY-RUN 模式，跳过 Git 推送")
        return {"content": [{"type": "text", "text": "\n".join(log_lines)}]}

    # 11. Git push
    try:
        msgs = git_push(filepath, diary_date, status_file=status_file)
        log_lines.extend(msgs)
    except Exception as e:
        return {"content": [{"type": "text", "text": "\n".join(log_lines) + f"\n❌ Git 推送失败: {e}"}], "isError": True}

    log_lines += [
        "",
        f"🌐 即将上线: https://{CNAME_DOMAIN}",
        f"🎧 打开歌单: https://music.163.com/playlist?id={music_id}",
    ]
    return {"content": [{"type": "text", "text": "\n".join(log_lines)}]}


def handle_tools_call(params: dict[str, Any]) -> dict[str, Any]:
    name = params.get("name")
    arguments = params.get("arguments", {})

    if name == "publish_daily_log":
        return handle_publish_daily_log(arguments)
    elif name == "publish_with_vibes":
        return handle_publish_with_vibes(arguments)
    else:
        return {"content": [{"type": "text", "text": f"❌ 未知工具: {name}"}], "isError": True}


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
        return None
    else:
        return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"Method not found: {method}"}}
    return {"jsonrpc": "2.0", "id": req_id, "result": result}


def main():
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
