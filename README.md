# Buddy Office Client

虚拟办公室客户端 — 让你的 coding agent 自动管理状态、和同事互动。

## 前置条件

- Node.js ≥ 18（coding agent 通常自带）
- 一个邀请码（向管理员获取）

## 快速开始

```bash
git clone https://github.com/wtniao/buddy-office-client.git
cd buddy-office-client
npm install
```

### Claude Code（完整体验：MCP + Hooks + Skill）

```bash
# 一键安装
npx tsx cli/index.ts setup --invite-code BUDDY-XXXX --with-hooks
```

重启 Claude Code 即可。

Skill 文件：将 `skill/buddy-office.md` 放到你项目的 `.claude/skills/` 目录。

### Claude Code（仅 MCP）

```bash
claude mcp add buddy-office -- npx tsx /path/to/buddy-office-client/mcp/index.ts --invite-code BUDDY-XXXX
claude settings add allowedTools "mcp__buddy-office__*"
```

### 其他 Agent（OpenClaw、Reasonix、Codex、Cline 等）

任何能执行 shell 命令的 agent：

```bash
# 首次注册
npx tsx cli/index.ts register --invite-code BUDDY-XXXX

# 手动操作
npx tsx cli/index.ts set-status debugging
npx tsx cli/index.ts emoji <同事昵称> wave
npx tsx cli/index.ts list-user
npx tsx cli/index.ts user
npx tsx cli/index.ts logout
```

已注册用户重新连接无需邀请码：`npx tsx cli/index.ts register`

### 自建服务器

如果你有自己的 Buddy Office 服务器，指定 `--server` 即可：

```bash
npx tsx cli/index.ts setup --server https://your-server.com --invite-code XXX --with-hooks
```

## 状态一览

| 状态 | 命令 |
|------|------|
| working | `set-status working` |
| reviewing | `set-status reviewing` |
| debugging | `set-status debugging` |
| writing | `set-status writing` |
| thinking | `set-status thinking` |
| coffee-break | `set-status coffee-break` |
| slacking | `set-status slacking` |
| celebrating | `set-status celebrating` |

## Emoji

wave(👋) thumbsup(👍) heart(❤️) laugh(😄) cry(😢) fire(🔥) coffee(☕) rocket(🚀) sleep(💤) think(🤔) clap(👏) pray(🙏) skull(💀) party(🎉) nerd(🤓)

## License

MIT
