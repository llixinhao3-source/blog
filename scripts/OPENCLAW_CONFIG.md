# OpenClaw 集成 Sevik Blog MCP Server · 配置说明

## 一、架构总览

```
┌──────────────────────────────────────────────────┐
│                   OpenClaw                        │
│  · 对话中自然描述：「帮我发布今天的日记」           │
│  · LLM 自动生成 Markdown                           │
│  · 调用 MCP 工具 publish_daily_log                 │
└─────────────────────┬────────────────────────────┘
                      │ JSON-RPC over stdio
┌─────────────────────▼────────────────────────────┐
│           mcp_server.py                           │
│  · 接收 content / date / category / tags / status │
│  · 智能分类：关键词自动判定 hardware|ai|cuda|guide  │
│  · 智能标签：根据内容推荐 3-5 个标签               │
│  · 自动提取 description 前 80 字                  │
│  · 写入 daily-YYYY-MM-DD.mdx                      │
│  · git add → commit → push                       │
│  · (可选) 更新首页在线状态                         │
└─────────────────────┬────────────────────────────┘
                      │ git push
┌─────────────────────▼────────────────────────────┐
│           GitHub Actions                          │
│  · npx astro build                                │
│  · 部署 gh-pages → sevik.me                       │
└──────────────────────────────────────────────────┘
```

## 二、OpenClaw MCP 配置

在 OpenClaw 的 `claw.yaml` 或 MCP 配置文件中添加：

```yaml
mcp_servers:
  - name: sevik-blog
    command: python3
    args:
      - /absolute/path/to/blog/scripts/mcp_server.py
    env:
      GIT_REMOTE: origin
      GIT_BRANCH: main
      GITHUB_TOKEN: ${GITHUB_TOKEN}
      CNAME_DOMAIN: sevik.me
    description: "Sevik 的 Astro 博客发布引擎 —— 写日记、push、自动部署"
```

如果你用它作为 OpenClaw 自身的 MCP 工具（而不是独立进程）：

```json
{
  "mcpServers": {
    "sevik-blog": {
      "command": "python3",
      "args": ["/Users/sevik/Desktop/blog/scripts/mcp_server.py"],
      "env": {
        "GIT_REMOTE": "origin",
        "GIT_BRANCH": "main",
        "CNAME_DOMAIN": "sevik.me"
      }
    }
  }
}
```

## 三、工具说明

### `publish_daily_log`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `content` | string | ✅ | Markdown 正文（不含 frontmatter） |
| `date` | string | 否 | YYYY-MM-DD，默认今天 |
| `title` | string | 否 | 文章标题，默认「每日学习 2026年X月X日」 |
| `category` | string | 否 | `hardware`/`ai`/`cuda`/`guide`，默认自动检测 |
| `tags` | string[] | 否 | 标签列表，默认自动推荐 |
| `status` | string | 否 | 更新首页在线状态文字 |
| `dry_run` | boolean | 否 | 预览模式，默认 false |

### 调用示例

OpenClaw 对话中直接说：

> 「帮我把今天的工作整理成日记发布」

LLM 会：
1. 根据当天对话上下文生成 Markdown
2. 调用 `publish_daily_log` 工具
3. 工具返回发布结果

等价于手动 JSON-RPC：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "publish_daily_log",
    "arguments": {
      "content": "## 今日概要\n- 完成了 MCP Server 开发\n\n## 工作记录\n1. **MCP Server 化**\n   ...",
      "status": "刚写完 MCP Server"
    }
  }
}
```

## 四、智能分类规则

| 关键词 | 自动分类 |
|--------|----------|
| ESP32, 嵌入式, GPIO, SPI, I2C, 固件, PCB... | `hardware` |
| OpenClaw, Claude, GPT, LLM, Agent, RAG, Prompt... | `ai` |
| CUDA, GPU, kernel, TensorRT, 并行... | `cuda` |
| 其他 | `guide` |

手动指定 `category` 参数会覆盖自动检测。

## 五、智能标签规则

根据内容自动匹配标签（最多 5 个），优先级：

```
OpenClaw 相关 → "OpenClaw"
AI Agent 相关 → "AI Agent"
LLM 相关     → "大模型"
自动化相关   → "自动化"
Prompt 相关  → "Prompt工程"
ESP32 相关   → "ESP32"
硬件相关     → "硬件"
博客相关     → "博客开发"
Git/部署相关 → "DevOps"
CUDA 相关    → "CUDA"
```

后附基础标签 `["学习总结", "日常记录", "技术"]`。

## 六、首页状态联动（可选）

当传入 `status` 参数时，脚本会修改 `PersonalIntro.tsx` 中的在线状态行：

```
在线 · 正在编码中...     →     在线 · 刚写完 MCP Server
```

这会通过同一次 git push 一并提交，GitHub Actions 部署后首页实时更新。

## 七、安全说明

- `GITHUB_TOKEN` 通过环境变量读取，不硬编码
- `.env` 文件已在 `.gitignore` 中（确认一下）
- MCP Server 运行在本地，不暴露网络端口
- 所有 Git 操作限制在 REPO_DIR 内

## 八、测试

```bash
# 1. 先手动测试 MCP Server
cd ~/blog
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | python3 scripts/mcp_server.py

# 2. 测试工具列表
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | python3 scripts/mcp_server.py

# 3. 测试 dry_run 发布
python3 scripts/mcp_server.py <<'EOF'
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"publish_daily_log","arguments":{"content":"## 今日概要\n- 测试 MCP Server\n\n## 工作记录\n1. 完成第一条 MCP 日记\n\n## 技术笔记\n### MCP 协议\n```python\nprint('hello mcp')\n```\n\n## 明日关注\n- [ ] 继续\n\n## 今日金句\n> 自动化是工程师的浪漫","date":"2026-05-14","dry_run":true}}}
EOF

# 4. 正式发布（不加 dry_run）
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | python3 scripts/mcp_server.py
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"publish_daily_log","arguments":{"content":"## 今日概要\n...","status":"刚写完 MCP Server"}}}' | python3 scripts/mcp_server.py
```

## 九、Cron 定时触发（备选）

如果不想通过 OpenClaw 交互触发，也可以用 cron：

```bash
# 每天 23:00 北京时
0 23 * * * cd ~/blog && python3 scripts/mcp_server.py < /tmp/diary-input.json
```

但推荐通过 OpenClaw 对话式调用，可以用自然语言描述当天内容，LLM 自动整理格式。
