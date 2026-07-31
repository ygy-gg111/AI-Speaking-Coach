# AI Speaking Coach

面向英语学习者的 AI 实时口语训练平台。当前仓库已完成 MVP 工程骨架，采用 Next.js 全栈架构，前端使用 Ant Design，并提供中英文国际化和实时语音模块接口。

## 技术栈

- Next.js 16（App Router）+ React 19 + TypeScript
- Ant Design + `@ant-design/nextjs-registry`
- next-intl（`zh-CN` / `en`）
- TanStack Query + Zustand
- Next.js Route Handlers + Zod
- Prisma + PostgreSQL
- WebRTC + OpenAI Realtime（真实音频与事件通道）
- Vitest + ESLint

MVP 不依赖 Redis。后续只有在多实例扩展、跨实例会话状态或队列压力明确出现时再评估引入。

## 本地开发

```bash
pnpm install
copy .env.example .env
pnpm prisma:generate
pnpm dev
```

打开：

- 中文：<http://localhost:3000/zh-CN>
- English：<http://localhost:3000/en>
- 健康检查：<http://localhost:3000/api/v1/health>

## 常用命令

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm prisma:validate
pnpm prisma:generate
pnpm prisma:deploy
pnpm prisma:seed
```

## 目录说明

```text
src/
├── app/                  # 页面与 API Route Handlers
├── ai/                   # Prompt、Realtime 和模型编排
├── features/             # 按业务领域拆分的前端模块
├── i18n/                 # 国际化路由与请求配置
├── infrastructure/       # 数据库等基础设施适配
├── lib/                  # 通用工具与环境变量
├── messages/             # 中英文文案
├── providers/            # Ant Design、Query 等全局 Provider
├── repositories/         # 数据访问接口
├── services/             # 业务服务
├── stores/               # Zustand 客户端状态
└── types/                # 共享类型

prisma/                   # 数据模型与迁移
doc/                      # 项目技术文档
```

UI 原型对应的页面、公共组件和开发顺序见：

- [`doc/11-UI-Development-Plan.md`](doc/11-UI-Development-Plan.md)

## Realtime 说明

浏览器通过 WebRTC 传输麦克风和模型音频，通过 RTCDataChannel 接收 VAD、回复生命周期和实时字幕事件。`POST /api/v1/realtime/session` 在服务端携带 `OPENAI_API_KEY` 与 OpenAI 交换 SDP answer，密钥不会下发到浏览器。

本地体验真实语音前，需要在 `.env` 中配置：

```env
OPENAI_API_KEY="..."
OPENAI_REALTIME_MODEL="gpt-realtime-2.1"
OPENAI_REALTIME_VOICE="marin"
OPENAI_TEXT_MODEL="gpt-5.6-sol"
```

未配置密钥或麦克风权限被拒绝时，练习页会展示可重试的降级提示。生产环境必须使用 HTTPS，并为 Realtime 会话补充用户身份、分钟数配额和并发限制。

## AI 评估说明

`POST /api/v1/conversations/:conversationId/review` 使用 Responses API Structured Outputs 生成双语纠错、自然表达和本次学习统计。练习页与复盘页通过同一个会话评估对象展示结果；未配置 `OPENAI_API_KEY` 或上游分析失败时，会返回明确标记为 `fallback` 的本地基础分析，不影响结束练习。

## 学习记录说明

当前 MVP 已打通收藏场景、练习历史、场景熟练度、首页指标、学习日历、错题本和成长报告。完成练习会同步更新学习记录、错题以及 7 天/30 天报告；登录和数据库接口接入前，数据通过 Zustand persist 保存在当前浏览器的 `localStorage`，不代表跨设备云端数据。

场景库支持进入独立详情页，在开始实时练习前查看训练目标、高频表达和对话角色。所选场景会通过 URL 传递给实时会话与复盘页，刷新或前进后退不会退回固定示例场景。

学习日历支持进入 `/[locale]/calendar/[date]` 查看可分享的日期详情，包括当日练习时间线、目标完成度、场景复盘与再次练习入口；非法日期会进入本地化 404 页面。

## 登录与用户资料

登录、注册、退出登录和用户资料 API 已使用 Prisma、bcrypt 与 HttpOnly JWT Cookie 实现。运行认证功能前需要配置 `DATABASE_URL`、执行数据库迁移，并设置不少于 16 位的 `AUTH_SECRET`；登录令牌不会暴露给前端 JavaScript，也不会写入 `localStorage`。未登录用户仍可使用访客模式体验口语练习。

## 后端核心接口

当前已提供第一批数据库业务接口：

```text
GET  /api/v1/scenes
GET  /api/v1/scenes/:sceneId
POST /api/v1/scenes/:sceneId/favorite
DELETE /api/v1/scenes/:sceneId/favorite
GET  /api/v1/my-scenes
POST /api/v1/conversations
GET  /api/v1/conversations/:conversationId
POST /api/v1/conversations/:conversationId/messages
POST /api/v1/conversations/:conversationId/complete
POST /api/v1/conversations/:conversationId/review
```

场景查询为公开接口；收藏、我的场景以及创建、查询、保存和完成练习需要登录。游客收藏继续保存在浏览器本地，登录用户的收藏会同步到 PostgreSQL。消息接口支持 `clientEventId` 幂等键，Realtime 重连或客户端重试不会重复保存同一个事件。初始化本地数据库：

```bash
pnpm prisma:deploy
pnpm prisma:seed
```

迁移会建立用户、场景、收藏、对话、消息、Realtime 会话和分析任务表，种子脚本会写入前端当前使用的 8 个基础场景。

## 错误监控

服务端认证、Realtime 和 AI 评估错误统一输出结构化 JSON 日志，客户端路由错误由 Next.js 错误边界恢复并上报到 `POST /api/v1/telemetry/client-errors`。日志层会递归脱敏密码、Cookie、Authorization、Token、API Key 和数据库连接密码。当前默认输出到服务端日志；正式部署时可在同一传输层接入 Sentry、OpenTelemetry 或云日志平台。

## 可访问性

应用框架支持键盘跳到主要内容、当前页面语义、全局清晰焦点和不少于 48px 的移动端导航触控区域。加载状态通过 `role="status"` 提供文字提示；系统开启“减少动态效果”时会关闭非必要动画。Locale 路由还提供中英文 404、页面错误恢复和全局兜底页面。
