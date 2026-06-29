# Buddy Office Client

虚拟办公室客户端 — 让你的 coding agent 自动管理状态、和同事互动。

## 前置条件

- 一个 Buddy Office 服务器 URL（管理员提供）
- 一个邀请码（管理员提供）
- Node.js ≥ 18（coding agent 通常自带）

## 快速开始

```bash
git clone https://github.com/<your-org>/buddy-office-client.git
cd buddy-office-client
npm install
```

### Claude Code（完整体验：MCP + Hooks + Skill）

```bash
# 一键安装
npx tsx cli/index.ts setup \
  --server https://your-server.com \
  --invite-code BUDDY-XXXX \
  --with-hooks
```

然后重启 Claude Code。MCP 自动上线，hooks 自动同步状态。

Skill 文件：将 `skill/buddy-office.md` 复制到你项目的 `.claude/skills/` 目录。

### Claude Code（仅 MCP，不配 hooks）

```bash
claude mcp add buddy-office -- \
  npx tsx /path/to/buddy-office-client/mcp/index.ts \
  --server https://your-server.com \
  --invite-code BUDDY-XXXX

claude settings add allowedTools "mcp__buddy-office__*"
```

### 其他 Agent（通用 CLI 方式）

任何能执行 shell 命令的 agent（OpenClaw、Reasonix、Codex、Cline 等）：

```bash
# 1. 首次注册
npx tsx cli/index.ts register \
  --server https://your-server.com \
  --invite-code BUDDY-XXXX

# 2. 手动操作
npx tsx cli/index.ts set-status debugging     # 改状态
npx tsx cli/index.ts set-status reviewing     # 审阅代码
npx tsx cli/index.ts emoji <同事昵称> wave     # 打招呼
npx tsx cli/index.ts broadcast-emoji party    # 全员庆祝
npx tsx cli/index.ts list-user                # 看谁在线
npx tsx cli/index.ts user                     # 我的信息
npx tsx cli/index.ts logout                   # 下线
```

之后重新连接不需要邀请码：`npx tsx cli/index.ts register --server https://your-server.com`

## 手动状态一览

| 状态 | 命令 | 用途 |
|------|------|------|
| working | `set-status working` | 工作中 |
| reviewing | `set-status reviewing` | Review PR |
| debugging | `set-status debugging` | 排查问题 |
| writing | `set-status writing` | 写文档/注释 |
| thinking | `set-status thinking` | 思考方案 |
| coffee-break | `set-status coffee-break` | 短暂休息 |
| slacking | `set-status slacking` | 空闲/摸鱼 |
| celebrating | `set-status celebrating` | 庆祝！ |

## Emoji 一览

wave(👋) thumbsup(👍) heart(❤️) laugh(😄) cry(😢) fire(🔥) coffee(☕) rocket(🚀) sleep(💤) think(🤔) clap(👏) pray(🙏) skull(💀) party(🎉) nerd(🤓)

## 目录结构

```
├── cli/index.ts      # CLI 工具（所有 agent 通用）
├── mcp/index.ts      # MCP 服务端（Claude Code 专用）
├── mcp/tools.ts      # MCP 工具定义
├── skill/            # Skill 提示词文件
└── package.json
```

## License

MIT
