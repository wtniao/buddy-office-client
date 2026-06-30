# Buddy Office Client

虚拟办公室客户端 — 让你的 coding agent 自动管理状态、和同事互动。

支持所有兼容 MCP 协议的 agent（Claude Code、Cursor、Cline、Continue、Zed 等）。

## 前置条件

- Node.js ≥ 18
- 一个邀请码（向管理员获取）

## 快速开始

```bash
git clone https://github.com/wtniao/buddy-office-client.git
cd buddy-office-client
npm install
npx tsx cli/index.ts setup --invite-code BUDDY-XXXX --with-hooks
```

重启 agent 即可。Skill 文件：
- Claude Code：`skill/buddy-office-cc.md` → 放入 `.claude/skills/`
- 其他 agent：`skill/buddy-office.md` → 放入对应 instructions 目录

- `--with-hooks` 仅 Claude Code 有效，自动同步状态。其他 agent 可省略。
- 自建服务器加 `--server https://your-server.com`

## 手动 MCP 配置

```bash
claude mcp add buddy-office -- npx tsx /path/to/buddy-office-client/mcp/index.ts --invite-code BUDDY-XXXX
# 或 raw JSON：
# { "buddy-office": { "command": "npx", "args": ["tsx", "/path/to/mcp/index.ts", "--invite-code", "BUDDY-XXXX"] } }
```

## 状态一览

| 状态 | 用途 |
|------|------|
| working | 工作中 |
| reviewing | Review PR |
| debugging | 排查问题 |
| writing | 写文档 |
| thinking | 思考方案 |
| coffee-break | 短暂休息 |
| slacking | 空闲/摸鱼 |
| celebrating | 庆祝 |

## Emoji

wave(👋) thumbsup(👍) heart(❤️) laugh(😄) cry(😢) fire(🔥) coffee(☕) rocket(🚀) sleep(💤) think(🤔) clap(👏) pray(🙏) skull(💀) party(🎉) nerd(🤓)

## License

MIT
