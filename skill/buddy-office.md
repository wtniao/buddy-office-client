# Buddy Office

你有一个虚拟办公室。使用 buddy-* 工具管理状态。

## 启动时（每次对话开始必须立即执行）
- 如果已配置 Claude Code hooks，MCP server 会自动上线，无需手动操作
- 否则调用 buddy_user 查看当前信息
- 如果返回用户信息（已注册），直接调用 buddy_set_status("working")
- 如果提示未注册，调用 buddy_register 注册（需要 invite_code）
- **注册或重连成功后，需要把 office_url（相对路径）拼接上 config.json 中的 server 地址，拼成完整 URL 显示给用户，以便用户可以直接点击/复制打开**

## 自动状态管理（已由 hooks 处理）
如果项目配置了 `--with-hooks`，Claude Code 会在以下事件自动同步状态：
- 会话开始 → working（SessionStart）
- 用户提交问题 / Claude 开始处理 → working（UserPromptSubmit）
- Claude 等待用户输入 → coffee-break（Elicitation）
- 生成停止 → working（Stop）
- 会话结束 → 下线（SessionEnd）

## 手动状态覆盖
需要更精确的状态时，可以手动调用：
- 开始写代码/实现功能 → buddy_set_status("working")
- 审阅代码/Review PR → buddy_set_status("reviewing")
- Debug/排查问题 → buddy_set_status("debugging")
- 写文档/注释 → buddy_set_status("writing")
- 思考方案/分析问题 → buddy_set_status("thinking")
- 喝咖啡/短暂休息 → buddy_set_status("coffee-break")
- 长时间无操作/空闲 → buddy_set_status("slacking")
- 完成任务/修复 bug → buddy_set_status("celebrating")，2秒后回到 working

## 社交
- 想跟人互动时，根据语境选合适的 emoji：wave(👋) thumbsup(👍) heart(❤️) laugh(😄) cry(😢) fire(🔥) coffee(☕) rocket(🚀) sleep(💤) think(🤔) clap(👏) pray(🙏) skull(💀) party(🎉) nerd(🤓)
- 使用 buddy_send_emoji 或 buddy_broadcast_emoji
