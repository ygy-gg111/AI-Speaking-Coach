# 09-Development-Guide.md

# AI Speaking Coach 开发规范与开发指南

------

# 1. 本章目标

本章定义项目开发流程。

目标：

```text
规范代码结构

统一开发方式

降低维护成本

提高 AI Coding 效率

保证项目长期演进
```

适用：

- 前端开发。
- 后端开发。
- 数据库开发。
- AI Prompt开发。
- 部署维护。

------

# 2. 开发原则

## 2.1 MVP优先原则

不要一开始开发所有功能。

优先验证：

```text
用户是否愿意每天练习
```

第一版本只关注：

```text
登录

↓

选择场景

↓

AI对话

↓

纠错

↓

保存记录

↓

打卡
```

------

## 2.2 不过度设计原则

禁止：

```text
为了未来百万用户

提前设计复杂架构
```

例如：

第一版不需要：

- Kubernetes。
- 微服务拆分。
- 多AI Provider。
- 复杂推荐算法。
- Redis。
- BullMQ。

实时语音是产品核心能力，不属于过度设计。MVP 必须优先保证 WebRTC 建连、VAD、字幕、AI 音频播放、用户打断和文字降级稳定。

------

正确：

```text
单体应用

模块化设计

未来可拆分
```

------

# 3. 开发环境规范

## 3.1 基础环境

要求：

```text
Node.js >=20

pnpm >=9

TypeScript

Docker

Git
```

------

检查：

```bash
node -v

pnpm -v

git --version

docker --version
```

------

# 4. 项目初始化规范

## 4.1 创建项目

推荐：

```bash
pnpm create next-app
```

选择：

```text
TypeScript

ESLint

App Router

src directory
```

安装前端基础依赖：

```bash
pnpm add antd @ant-design/nextjs-registry next-intl
```

Ant Design 是唯一基础组件库，不安装 Shadcn/UI。样式优先使用 Ant Design Design Token、组件 `styles`/`classNames` 和 CSS Modules。

------

# 4.2 包管理规范

统一：

```text
pnpm
```

禁止混用：

```text
npm

yarn
```

------

安装：

```bash
pnpm add package-name
```

删除：

```bash
pnpm remove package-name
```

------

# 5. Git规范

## 5.1 分支策略

采用：

```text
main

develop

feature/*

fix/*

hotfix/*
```

------

结构：

```text
main

生产稳定版本


develop

开发集成版本


feature

功能开发


fix

Bug修复


hotfix

线上紧急修复
```

------

# 5.2 开发流程

例如开发语音功能：

```bash
git checkout develop


git checkout -b feature/audio-record


开发


git add .


git commit


git push


创建 Pull Request
```

------

# 6. Commit规范

采用：

```text
Conventional Commits
```

格式：

```text
type(scope): description
```

------

类型：

| 类型     | 说明     |
| -------- | -------- |
| feat     | 新功能   |
| fix      | 修复     |
| docs     | 文档     |
| style    | 格式     |
| refactor | 重构     |
| test     | 测试     |
| chore    | 工程配置 |

------

示例：

新增场景：

```bash
git commit -m "feat(scene): add airport checkin scene"
```

修复登录：

```bash
git commit -m "fix(auth): fix token refresh"
```

更新文档：

```bash
git commit -m "docs(readme): update deployment guide"
```

------

# 7. 代码目录规范

最终：

```text
src/


├── app

页面和接口


├── components

公共组件


├── features

业务模块


├── hooks

React Hooks


├── services

API调用


├── stores

状态管理


├── lib

第三方封装


├── utils

工具函数


└── types

类型定义
```

------

# 8. Feature模块规范

复杂业务不要全部放components。

例如：

conversation：

```text
features/conversation/


├── api.ts

├── hooks.ts

├── store.ts

├── types.ts

├── components/

│
├── ConversationPanel.tsx

└── utils.ts
```

------

原则：

```text
业务相关代码靠近业务
```

------

# 9. TypeScript规范

## 9.1 禁止any

禁止：

```ts
const data:any
```

------

推荐：

```ts
interface User {

id:string

name:string

}
```

------

## 9.2 类型命名

接口：

```ts
UserProfile
ConversationResult
SceneDetail
```

------

枚举：

```ts
ConversationStatus
```

------

函数：

```ts
createConversation()
```

------

# 10. React组件规范

## 10.1 一个组件一个职责

错误：

```text
ConversationPage

里面包含：

聊天

录音

提示

纠错

统计
```

------

正确：

```text
ConversationPage

↓

ConversationPanel

↓

MessageList

↓

MessageItem

↓

AudioButton
```

------

## 10.2 Ant Design规范

- App Router 根布局使用 `AntdRegistry`，避免服务端渲染样式闪烁。
- 全局主题和 Locale 使用统一的 `ConfigProvider`。
- 禁止重复封装与 Ant Design 等价的 Button、Input、Modal 和 Form。
- 业务组件可以组合 Ant Design，但不得直接修改组件库内部 DOM。
- 色彩、圆角、间距和字体优先来自 Design Token，禁止散落魔法值。
- 需要 Client Component 的交互组件必须显式标记 `"use client"`。

## 10.3 国际化规范

使用 `next-intl`，MVP 支持 `zh-CN` 和 `en`。

```text
src/messages/zh-CN.json
src/messages/en.json
```

规则：

- JSX、Toast、Modal、表单校验和空状态中禁止硬编码用户可见文案。
- 翻译 Key 按 Feature 分组，例如 `Conversation.connection.failed`。
- API 返回稳定错误码和 `messageKey`，由前端完成翻译。
- 日期、时间、数字、复数和相对时间统一使用 Locale Formatter。
- 新功能必须同时补齐两种语言，缺少翻译不得合并。
- 测试至少覆盖一种中文 Locale 和一种英文 Locale。
- UI Locale 与英语练习语言分离。

------

# 11. Hooks规范

自定义：

```text
useXXX
```

例如：

```ts
useConversation()

useRecorder()

useAuth()

useScenes()
```

------

禁止：

Hook中直接写大量业务。

错误：

```ts
useConversation(){

调用AI

修改数据库

计算统计

}
```

------

正确：

```text
Hook

↓

Service

↓

API
```

------

# 12. 状态管理规范

使用：

```text
Zustand
```

适合：

全局：

- 用户。
- Token。
- 当前练习状态。
- UI状态。

------

不要保存：

服务器数据。

例如：

错误：

```text
场景列表存在Zustand
```

------

使用：

```text
React Query
```

管理：

- 场景。
- 历史记录。
- 学习报告。

------

# 13. API开发规范

所有接口：

```text
/api/v1
```

------

例如：

获取场景：

```http
GET

/api/v1/scenes
```

------

创建会话：

```http
POST

/api/v1/conversations/start
```

------

# 14. 参数校验规范

后端必须校验。

推荐：

```text
Zod
```

------

示例：

```ts
const schema =
z.object({

sceneId:z.string()

})
```

------

禁止：

直接相信前端参数。

------

# 15. 数据库开发规范

使用：

```text
Prisma
```

------

修改流程：

```text
修改schema.prisma

↓

生成migration

↓

测试

↓

提交代码
```

------

命令：

开发：

```bash
pnpm prisma migrate dev
```

生产：

```bash
pnpm prisma migrate deploy
```

------

# 16. Prisma规范

## 16.1 不允许Controller直接访问Prisma

错误：

```ts
export async function GET(){

prisma.user.findMany()

}
```

------

正确：

```text
Controller

↓

Service

↓

Repository

↓

Prisma
```

------

# 17. AI开发规范

AI部分必须模块化。

结构：

```text
modules/ai/


├── providers/

├── agents/

├── prompts/

├── context/

├── parser/

└── evaluator/
```

------

# 18. AI Agent规范

不要：

```text
一个超级Prompt解决全部问题
```

------

拆分：

```text
Conversation Agent

Correction Agent

Hint Agent

Summary Agent

Recommendation Agent
```

------

# 19. Prompt管理规范

禁止：

直接写：

```ts
const prompt="xxx"
```

------

正确：

MVP 使用代码文件与 Git 版本管理：

```text
src/ai/prompts/
├── realtime/
├── correction/
└── versions.ts
```

稳定后再增加数据库中的 `PromptTemplate`、灰度发布和管理后台。

------

每次修改：

必须记录：

```text
版本

修改原因

效果
```

------

# 20. AI输出规范

必须要求：

JSON结构。

例如：

```json
{
"reply":"Great!",

"correction":[],

"stepCompleted":true,

"confidence":0.9
}
```

------

禁止：

依赖自然语言解析。

------

# 21. AI调用成本控制

原则：

```text
能不用AI判断，就不用AI
```

------

例如：

固定提示：

数据库读取。

不要：

每次调用AI生成。

------

优化：

```text
缓存

减少上下文

控制历史长度

选择合适模型
```

------

# 22. 对话上下文管理

不要发送全部历史。

策略：

当前：

```text
最近10轮
```

摘要：

```text
之前学习状态
```

------

结构：

```json
{
"summary":

"User practiced airport checkin",

"recentMessages":[]

}
```

------

# 23. 文件开发规范

Realtime 音频：

```text
WebRTC 音频分片不存数据库
默认不保存用户原始录音
只持久化最终字幕和学习结果
```

用户主动开启“保存录音”时：

```text
保存到 Cloudflare R2
数据库保存 objectKey、MIME、时长、大小和删除时间
```

------

限制：

```text
单次实时会话默认不超过15分钟
同一用户默认只允许1个活动会话
必须处理麦克风拒绝、设备切换、网络中断和页面退出
浏览器音频优先使用 WebRTC，不限定为 mp3/wav
保存录音必须进行用户授权和权限检查
```

------

# 24. 测试规范

## 单元测试

工具：

```text
Vitest
```

测试：

- 工具函数。
- 状态机。
- 数据处理。

------

## API测试

测试：

- 参数。
- 权限。
- 返回。

------

## E2E测试

工具：

```text
Playwright
```

核心流程：

```text
注册

登录

开始练习

授权麦克风

建立 WebRTC

用户语音与实时字幕

AI语音回复

用户打断AI

断网重连或文字降级

完成场景

生成报告
```

------

# 25. AI测试规范

每个场景上线前测试：

必须覆盖：

```text
正常回答

语法错误

中文回答

请求提示

不会回答

跑题

拒绝回答
```

实时语音专项必须覆盖：

```text
麦克风权限拒绝
无输入设备
VAD误触发与长停顿
AI播放期间用户插话
网络切换与PeerConnection断开
重复创建会话
页面退出后的音轨释放
临时凭证过期
Realtime失败后文字模式可用
最终字幕、纠错与会话记录一致
```

------

# 26. Code Review规范

检查：

## 代码

- 是否符合目录规范。
- 是否重复代码。
- 是否有类型问题。

## 业务

- 是否影响状态机。
- 是否影响历史数据。

## AI

- Prompt是否版本化。
- Token是否合理。

------

# 27. AI Coding协作规范

本项目大量使用：

- Codex。
- Claude Code。
- OpenCode。

------

AI生成代码必须遵守：

## 第一原则：

AI负责：

```text
生成代码

解释方案

辅助重构
```

------

开发者负责：

```text
架构决策

业务确认

代码审核
```

------

# 28. 使用AI开发流程

推荐：

```text
需求

↓

编写技术方案

↓

拆任务

↓

让AI生成

↓

人工Review

↓

测试

↓

提交
```

------

不要：

```text
一句话：

帮我写完整系统
```

------

# 29. 开发任务拆分规范

一个任务：

控制：

```text
1-3小时
```

例如：

好：

```text
实现登录接口
```

不好：

```text
完成整个用户系统
```

------

# 30. Issue规范

GitHub Issue:

格式：

```text
[模块] 问题描述
```

例如：

```text
[Conversation]
AI回复没有推进步骤
```

------

内容：

```text
问题

复现步骤

期望结果

实际结果
```

------

# 31. Release规范

版本：

```text
v0.1.0
```

规则：

```text
Major.Minor.Patch
```

------

例如：

```text
v1.0.0

正式版本


v1.1.0

新增功能


v1.1.1

Bug修复
```

------

# 32. MVP开发顺序

推荐：

## Sprint 1

基础：

```text
项目初始化

Ant Design Provider与主题

next-intl中英文基线

数据库

登录

场景列表
```

------

## Sprint 2

实时核心：

```text
Realtime Session API

WebRTC 建连

VAD 与实时字幕

AI 音频播放与用户打断

状态机
```

------

## Sprint 3

学习闭环：

```text
最终字幕持久化

纠错

提示

历史

收藏

词汇

日历
```

------

## Sprint 4

稳定与发布：

```text
弱网重连

移动端浏览器兼容

语音额度与成本保护

部署

测试

发布
```

------

# 33. 开发完成标准

一个功能完成：

必须：

```text
代码完成

类型通过

测试通过

文档更新

Git提交
```

------

# 34. 项目长期维护原则

保持：

```text
简单

清晰

可扩展
```

------

避免：

```text
技术炫技

过度架构

无意义重构
```

------

# 35. 本章总结

开发流程：

```text
需求

↓

设计

↓

拆任务

↓

开发

↓

测试

↓

Review

↓

发布
```

代码原则：

```text
模块化

类型安全

业务隔离

AI可控

数据可追踪
```

最终目标：

打造一个：

```text
稳定

可维护

可持续迭代

真正帮助用户学习口语的 AI 产品
```

------

# 下一章

## 10-RoadMap.md

内容：

- MVP阶段规划
- 版本规划
- AI能力升级路线
- 商业化路线
- 用户增长路线
- 长期产品方向
