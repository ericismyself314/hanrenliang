# 含人量测试

面向大学生的生活状态娱乐测试微信小程序，附浏览器体验版。通过校园生活场景生成含人量、专属人物形象、画像与六维状态。当前题库和评分内容版本为 `content-v2.0`。

![首页人物](miniprogram/assets/home-human-v5.png)

## 功能

- 首页、答题、进度恢复、重新测试与个人结果。
- 六维计分、专属称号、人物 IP、画像及状态分析。
- 本地生成好友分享卡片与朋友圈结果图，朋友打开分享后可独立测试。
- 当前版本无需登录或云开发，答案与个人结果保存在当前设备，不上报使用事件。
- 测试用于娱乐和近期生活状态观察，不构成心理或医学评估。

## 本地运行

需要 Node.js 20 或更新版本。

```sh
npm ci
npm run check
npm run build:demo
npm run smoke:demo
```

浏览器体验版可以直接打开 `demo/index.html`，也可从项目根目录启动静态服务器并访问 `/demo/index.html`。体验版用于浏览器展示，不代表已经发布的微信小程序。

## 微信开发者工具

1. 导入仓库根目录，`miniprogramRoot` 已设为 `miniprogram/`。
2. `project.config.json` 使用游客 AppID。真机预览、分享和上传时，替换为你自己注册的小程序 AppID。
3. 在 `miniprogram/pages/about/index.ts` 填写自己的备案号；空值时隐藏备案区域。
4. 在 `miniprogram/config/sharing.ts` 设置自己小程序的正式名称。取得真实小程序码后，可填写 `MINIPROGRAM_CODE_PATH`，并把图片放入代码包。
5. 编译并真机预览，完成验收后上传、提交审核，审核通过再发布。

好友分享需要真实微信环境。朋友圈结果图通过微信图片分享面板，由用户选择朋友圈并确认；同时保留页面分享入口。部分接口依赖微信和基础库版本，浏览器体验版无法完整模拟。

## 项目结构

| 路径 | 内容 |
| --- | --- |
| `miniprogram/` | 小程序入口、页面、题库、计分、人物素材与分享 |
| `demo/main.ts`、`demo/shell.html` | 浏览器体验版源码 |
| `demo/index.html` | 构建生成的可直接打开的体验版 |
| `tests/` | 计分、结果可达性和历史模块测试 |
| `scripts/` | 页面检查、无云运行检查、构建与冒烟测试 |
| `archive/`、`cloudfunctions/` | 历史双人玩法及云端实现，仅供参考，当前版本不需要部署 |

修改题目使用 `miniprogram/config/questions.ts`；修改称号、画像与分析使用 `results.ts`。题目或评分发生变化时，提升 `content.ts` 中的内容版本，避免旧存档与新评分混用。

修改体验版请编辑 `demo/main.ts` 与 `demo/shell.html`，再执行 `npm run build:demo`，不要直接修改生成的 HTML。

人物素材使用 AI 辅助生成，小程序使用兼容 PNG；原 WebP 保留用于素材维护并排除微信上传包。头像候选与本地备份不属于此仓库。

## 验证与贡献

提交变更前运行 `npm run check`；涉及体验版时同时运行构建与冒烟测试。本地检查不能替代 iPhone、Android 上的图片、Canvas 导出和实际分享验收。

欢迎通过 Issues 报告问题，或通过 Pull Requests 提交改进。请说明复现步骤及使用环境。

## 开源许可

项目按 [MIT License](LICENSE) 开源，允许使用、修改和商业使用，并保留许可和版权声明。仓库不包含原项目的私人配置、账号凭证、AppID 或备案号。
