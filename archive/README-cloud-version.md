# 含人量 · 微信小程序（第一代）

面向 18–24 岁大学生的轻量校园状态测试。24 道题 → 0–100 含人量 → 一种大学生物种 → 专属角色小人 → 邀请一个具体朋友 → 双人关系报告。

第一代只验证一件事：**一个人测完后，是否愿意主动带来下一个人。**

- 技术栈：原生微信小程序 + TypeScript，云开发 CloudBase（云函数 + 数据库）
- 个人答题与计分 **全部在本地完成**，无需登录、无需授权头像昵称
- 不调用任何大模型 API，不做强制分享，不做排行榜

---

## 1. 目录结构

```
hanrenliang/
├── miniprogram/                 # 小程序前端（miniprogramRoot）
│   ├── app.ts / app.json / app.wxss
│   ├── config/                  # 内容配置：题目、结果、关系、维度、文案、环境
│   │   ├── content.ts           #   产品定义、娱乐声明、内容版本
│   │   ├── dimensions.ts        #   六维定义与并列顺序
│   │   ├── questions.ts         #   24 道题与开发计分
│   │   ├── results.ts           #   24 种结果与分享文案模板
│   │   ├── relationships.ts     #   12 条关系规则与共同项文案
│   │   ├── env.ts               #   云环境 ID 与邀请有效期
│   │   └── avatarAssets.ts      #   24 张 AI 角色图的统一路径
│   ├── assets/avatars/          # 24 张统一纸张拼贴风格的透明 WebP 角色图
│   ├── utils/                   # 核心逻辑（scoring / matching 为纯函数）
│   │   ├── scoring.ts           #   计分：六维、含人量、档位、关键维度
│   │   ├── matching.ts          #   相似度、互补度、好友玩法分、关系命中
│   │   ├── backend.ts           #   云函数调用 + 本地降级实现
│   │   └── inviteCore.ts        #   邀请与关系的纯逻辑（可脱离 wx 测试）
│   │   ├── storage.ts           #   进度与结果本地存储
│   │   ├── share.ts             #   分享文案与页面路径
│   │   ├── analytics.ts         #   匿名漏斗埋点
│   │   ├── result.ts            #   快照与六维视图
│   │   └── types.ts             #   数据模型
│   └── pages/                   # index / test / result / invite / relationship / about
├── cloudfunctions/              # 云开发后端（cloudfunctionRoot）
│   ├── createInvite/            #   生成不可预测 token 的邀请
│   ├── getInvite/               #   读取邀请语境
│   ├── completeInvite/          #   被邀请人完成后生成关系报告
│   ├── getRelationship/         #   读取关系报告
│   └── trackEvent/              #   匿名漏斗事件落库
├── tests/                       # 计分、可达性、关系、邀请链路、云函数一致性测试
├── scripts/
│   ├── check-pages.js           # 页面静态自检（npm run lint:pages）
│   └── build-demo.js            # 打包浏览器体验版（npm run build:demo）
├── demo/                        # 浏览器体验版：复用真实题目与计分，可完整答题
├── preview.html                 # 静态页面预览（设计稿，非运行环境）
├── project.config.json
└── tsconfig.json / tsconfig.test.json
```

---

## 2. 本地运行

```bash
npm install          # 安装 typescript / 类型声明
npm run typecheck    # 类型检查（miniprogram 全量）
npm run lint:pages   # 页面静态自检：文件齐全、事件有实现、节点 id 存在、路径已注册
npm test             # 编译并运行全部测试
npm run check        # 上面三步一起跑
```

测试覆盖：

| 测试 | 内容 |
| --- | --- |
| 内容配置校验 | 24 题 × 4 选项、每维度恰好 8 次、分数 0–3、选项 id 唯一、24 种结果文案完整且无羞辱词 |
| 计分函数 | 标准化公式、档位边界 24/25、49/50、74/75、文档计算示例（43 分 → B1-S 朋友圈观察员）、同答案同结果、非法答案报错、不修改输入 |
| 结果可达性 | 用爬山搜索为 24 种结果各找到一组可触达答案，确保没有"永远出现不了的结果" |
| 关系规则 | 12 条规则按优先级逐条命中、玩法分恒在 35–96、交换双方结果一致 |
| 邀请链路 | token 长度固定且不重复（2000 次）、7 天有效期、快照不含完整答案、双方看到同一份报告、重复完成结果一致 |
| 邀请链路集成 | 用内存版 `wx` storage 跑通"创建邀请 → 读取邀请 → 完成测试 → 关系报告 → 重复完成"，并校验各类错误码 |
| 云函数一致性 | 500 组随机输入对比 `matching.ts` 与 `cloudfunctions/completeInvite/matching.js`，结果必须完全一致 |

另有 `npm run lint:pages` 做静态自检（页面文件齐全、wxml 事件在 ts 中有实现、`select('#id')` 节点存在、页面路径已注册、无孤儿页面），用于在不开开发者工具时提前发现"能编译但点了没反应"的问题。

> 修改任一侧的关系计算后，必须同时修改另一侧，否则一致性测试会失败。

---

## 3. 微信开发者工具导入与运行

1. 打开微信开发者工具 → 导入项目 → 选择本目录（含 `project.config.json`）
2. AppID：使用 `project.config.json` 中已配置的正式 AppID；如果换账号或换项目，再在这里替换
3. 项目已开启 TypeScript 编译插件（`setting.useCompilerPlugins: ["typescript"]`），无需额外构建
4. 本项目不使用第三方 npm 包，无需执行"构建 npm"
5. 点击编译即可跑通：首页 → 答题 → 结果 → 邀请 → 双人关系

### 不开开发者工具也能先体验

```bash
npm run build:demo   # 需要一次联网下载 esbuild
```

会生成 `demo/index.html`，双击即可在浏览器里完整点完 24 题并看到真实结果。

```bash
npm run smoke:demo   # 无浏览器冒烟测试：替身 DOM 里点完 24 题，验证不会白屏或点不动
```

它不是另一套实现——`demo/main.ts` 直接 import 了 `miniprogram` 里的 `questions.ts`、`scoring.ts`、`results.ts`、`matching.ts`，由 esbuild 打包，因此**演示结果 = 小程序结果**。想验证内容或改题后的效果，先跑它比开模拟器快。

体验版覆盖两条完整路径：

- **A 自己想测**：答题 → 个人结果 → 邀请朋友 → 双人关系报告
- **B 好友视角**：首页点「从好友邀请进入」→ 看到邀请语境 → 接受鉴定 → 答题 → 直接看双人报告

邀请页与好友视角里的"朋友/邀请者"是用物种 + 含人量合成的模拟档案（页面已明确标注），真实产品里这份数据来自对方自己的答题。

### 无云环境下的降级行为

`miniprogram/config/env.ts` 中 `CLOUD_ENV` 默认为空字符串。此时：

- 邀请与双人关系保存在**本机 storage**，可在同一台手机上完整跑通"邀请 → 对方完成 → 双人报告"链路
- 不采集或上报使用事件，也不生成用于统计的匿名标识
- 云函数代码仍然完整可用，填入环境 ID 后自动切换

这是刻意设计的降级方案：**没有云环境时项目依然可启动、可演示、可验收**，不会留下跑不起来的半成品。

---

## 4. 云开发初始化

1. 开发者工具左侧「云开发」→ 开通环境 → 复制环境 ID
2. 填入 `miniprogram/config/env.ts`：`export const CLOUD_ENV = 'your-env-id'`
3. 右键 `cloudfunctions/` 下每个目录 →「上传并部署：云端安装依赖」
4. 在云开发控制台新建集合：

| 集合 | 用途 | 建议权限 |
| --- | --- | --- |
| `invitations` | 邀请记录（含邀请者结果快照） | 仅管理端/云函数可读写 |
| `relationships` | 双人关系报告 | 仅管理端/云函数可读写 |
| `analytics_events` | 匿名漏斗事件 | 仅管理端/云函数可写 |

**安全约束**：数据库安全规则请设置为"仅云函数可写"，前端不直接读写集合；完整答题答案不会写入任何可被公开查询的记录，只保存六维分数与结果 ID 快照；分享参数只携带邀请 token，或结果 ID + 0–100 含人量分数，不携带昵称、头像和完整答案。

### 数据库索引建议

- `invitations`：`token`（唯一）
- `relationships`：`invitationToken`
- `analytics_events`：`eventName`、`timestamp`

---

## 5. 埋点与传播指标

埋点事件（见 `utils/analytics.ts` 与 `cloudfunctions/trackEvent`）：

`page_view`、`test_start`、`question_answer`、`test_complete`、`result_view`、`share_personal`、`invite_created`、`invite_opened`、`invite_test_complete`、`relationship_view`、`share_relationship`、`poster_saved`

在云开发控制台的 `analytics_events` 集合中按 `eventName` 聚合，可计算：

| 指标 | 算法 |
| --- | --- |
| 首页开始率 | `test_start / page_view(首页)` |
| 测试完成率 | `test_complete / test_start` |
| 结果分享率 | `share_personal / result_view` |
| 人均邀请数 | `invite_created / test_complete` |
| 邀请点击率 | `invite_opened / invite_created` |
| 被邀请者完成率 | `invite_test_complete / invite_opened` |
| 双人报告分享率 | `share_relationship / relationship_view` |
| 病毒系数 K | `每个完成测试用户带来的新完成用户数 = 被邀请者完成数 / 完成测试人数` |

只记录 `anonymousId`、事件名、来源、邀请 token、数值、内容版本、时间戳，不采集昵称、头像、手机号等身份信息，也不伪造"超过全国多少人"之类的统计。

---

## 6. 内容更新方法

- **改题目/分数**：只改 `config/questions.ts`，页面与计分无需改动
- **改结果文案**：只改 `config/results.ts`（24 条，字段：判词、仍然像人的地方、正在掉线的部分、最佳搭子）
- **改关系规则**：同时改 `config/relationships.ts` 与 `cloudfunctions/completeInvite/matching.js`
- **任何影响结果的改动**：提升 `config/content.ts` 里的 `CONTENT_VERSION`，旧结果会因版本不匹配而失效，用户重新测一次即可

改完务必执行 `npm run check`。

---

## 7. 内容规则中未定义之处的处理

内容规则文档第七部分只定义了「未命中前 11 条且互补分高于相似分」时归入"互补生存搭子"，没有定义互补分不高于相似分的情形。为保证任何输入都有确定输出，代码按语义最接近的方式兜底：

- 相似度 ≥ 互补度 → **同频生活体**
- 否则 → **互补生存搭子**

该逻辑在 `utils/matching.ts` 的 `pickRelationshipRule` 中有注释标记，如需改成第 13 条独立关系，改这一处即可。

---

## 8. 已知限制（第一代）

- 无云环境时双人链路只存在本机，换设备/清缓存后邀请不可复原
- 邀请有效期 7 天，过期后只提示可执行的下一步，不自动重发
- 结果页已配置好友分享与朋友圈分享入口；微信不允许小程序代码直接代用户完成发布到朋友圈，用户点击页面按钮后仍需在右上角「···」中确认“分享到朋友圈”
- 云函数会校验结果快照的版本、档位、结果编号与六维分数范围，并用处理中状态防止并发重复生成；第一代仍不上传完整答案，尚未做服务端重新计分
- 六维图为 Canvas 手绘雷达，未做无障碍标签
- 未做内容审核与反作弊，分享链路依赖微信自身风控

### 第二代建议（未混入第一代）

- 宿舍多人报告（4–6 人关系图）
- 七天回人任务与每周复测（留存向）
- 校园维度的内容本地化（不同学校题库）
- 邀请过期自动提醒与重新邀请

---

## 9. 结算页与文案规范（改这里要一起改）

- **主题词固定为「含人量」**，常量在 `config/results.ts`：`INDEX_LABEL` / `INDEX_CAPTION` / `BRAND_STRIP`。任何页面都不要把它写成「得分」「分数」「测试结果」。
- **每个人物都有一段完整分析**：`ResultDefinition.portrait`，120–200 字，写法是"具体行为 → 为什么会这样 → 含人量里哪一项在掉线/撑住 → 一个可以马上做的小动作"。24 段全部手写在 `config/results.ts`，改文案只动这一个文件，小程序与体验版同时生效。
- 单元测试强制校验：每段 `portrait` 长度 100–220 字、必须出现「含人量」、不含羞辱性词语（`tests/scoring.test.ts`）。
- **答题页显示轻量进度**：显示当前题号、`n/24` 和一条细进度条，让用户知道还要多久；不引入复杂步骤或额外设置。
- 结算页结构固定为：`检测报告` → 含人量主指标（大数字 + 进度条 + 档位）→ 物种称号 → `01 含人量画像` → `02 六维状态` → `03 结果拆解` → `04 最佳搭子` → 品牌收束条；详细分析默认完整展示，不再折叠。
- **体验版首页有「浏览全部 24 种结果」**：不用答题，点任意物种直接看它的结算页（用该档位示例分 12/37/62/87 合成档案），改文案和排版时用它逐页检查。
- **24 个物种各有专属角色 IP**：统一采用原创纸张拼贴、颗粒肌理和深蓝描边；结算页、邀请页、双人报告和体验版共用对应图片资源，不依赖头像昵称授权。

---

## 10. 验收自检清单

- [x] 新用户无需登录即可完成 24 道题
- [x] 完成后立即得到 0–100 含人量、六维分数和唯一结果
- [x] 同一组答案在任何设备/次数下结果完全相同（纯函数 + 测试）
- [x] 24 种结果全部可通过自动测试触达，档位边界正确
- [x] 可返回修改答案、退出后继续；个人答题与每个邀请分别保存进度，主动重新开始需二次确认
- [x] 个人结果页可直接分享结果、可创建专属好友邀请
- [x] 本机邀请链路与双人报告逻辑通过测试；跨手机链路仍需云端部署和真机验收
- [x] 关系报告可直接分享并继续邀请新用户
- [x] 无强制分享、无虚假排行榜、无未经同意的昵称头像授权
- [x] 所有错误状态都有说明与重试/返回入口
- [x] 已完成邀请不会再次进入答题；关系报告朋友圈分享可正确回流到邀请上下文，个人结果分享会显示分数预览
- [x] 当前开发机上的类型检查、页面检查、云函数独立打包检查与单元测试通过

### 正式上线前仍需完成

- [ ] 填入云环境 ID，创建 `invitations`、`relationships`、`analytics_events` 集合并设置仅云函数访问；逐个上传部署 5 个云函数
- [ ] 用两台手机验收邀请、答题、双人报告、人物图片和好友/朋友圈分享
- [ ] 在微信开发者工具确认实际代码包体积、上传版本，在公众平台提交代码审核
- [ ] 审核通过后由管理员确认正式发布
