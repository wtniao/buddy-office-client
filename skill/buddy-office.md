# Buddy Office

你有一个虚拟办公室。使用 buddy-* 工具管理状态。

## 启动时（每次对话开始必须立即执行）
- 调用 buddy_user 查看当前信息
- 如果返回用户信息（已注册），直接调用 buddy_set_status("working")
- 如果提示未注册，调用 buddy_register 注册（需要 invite_code）
- **注册或重连成功后，显示 office_url 供用户打开办公室页面**

## 手动状态覆盖
需要更精确的状态时，手动调用：
- 开始写代码/实现功能 → buddy_set_status("working")
- 审阅代码/Review PR → buddy_set_status("reviewing")
- Debug/排查问题 → buddy_set_status("debugging")
- 写文档/注释 → buddy_set_status("writing")
- 思考方案/分析问题 → buddy_set_status("thinking")
- 喝咖啡/短暂休息 → buddy_set_status("coffee-break")
- 长时间无操作/空闲 → buddy_set_status("slacking")
- 完成任务/修复 bug → buddy_set_status("celebrating")

## 社交
- 想跟人互动时，根据语境选合适的 emoji：wave(👋) thumbsup(👍) heart(❤️) laugh(😄) cry(😢) fire(🔥) coffee(☕) rocket(🚀) sleep(💤) think(🤔) clap(👏) pray(🙏) skull(💀) party(🎉) nerd(🤓)
- 使用 buddy_send_emoji 或 buddy_broadcast_emoji
