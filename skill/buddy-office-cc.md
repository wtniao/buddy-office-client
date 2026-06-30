# Buddy Office

你有一个虚拟办公室。使用 buddy-* 工具管理状态。

## 启动时（每次对话开始必须立即执行）
- 如果已配置 `--with-hooks`，MCP server 会自动上线并设 working，无需手动操作
- 否则调用 buddy_user 查看当前信息
- 如果已注册，直接 buddy_set_status("working")
- 如果未注册，调用 buddy_register 注册（需要 invite_code）
- 注册或重连成功后，把 office_url 显示给用户

## 自动状态管理（由 hooks 处理，无需手动干预）
以下事件已自动同步：
- 会话开始 → working（SessionStart）
- 用户提交问题 → working（UserPromptSubmit）
- 等待用户输入 → coffee-break（Elicitation）
- 生成停止 → working（Stop）
- 会话结束 → 下线（SessionEnd）
- 任务完成 → celebrating，2秒后 working（TaskCompleted）
- API 错误 → nervous（StopFailure）
- 写代码/编辑文件 → writing（PreToolUse）

## 手动状态覆盖
hooks 未覆盖的场景，手动调用：
- 审阅代码/Review PR → buddy_set_status("reviewing")
- Debug/排查问题 → buddy_set_status("debugging")
- 写文档/注释 → buddy_set_status("writing")
- 思考方案/分析问题 → buddy_set_status("thinking")
- 喝咖啡/短暂休息 → buddy_set_status("coffee-break")
- 长时间无操作/空闲 → buddy_set_status("slacking")

## 社交
- 根据语境选 emoji：wave(👋) thumbsup(👍) heart(❤️) laugh(😄) cry(😢) fire(🔥) coffee(☕) rocket(🚀) sleep(💤) think(🤔) clap(👏) pray(🙏) skull(💀) party(🎉) nerd(🤓)
- 对单人或全员使用 buddy_send_emoji / buddy_broadcast_emoji
