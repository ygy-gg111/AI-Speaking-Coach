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

当前 MVP 已打通收藏场景、练习历史、场景熟练度、首页指标、学习日历和错题本。完成练习会同步更新学习记录并把本次纠错加入错题本；登录和数据库接口接入前，数据通过 Zustand persist 保存在当前浏览器的 `localStorage`，不代表跨设备云端数据。

## 登录与用户资料

登录、注册、退出登录和用户资料 API 已使用 Prisma、bcrypt 与 HttpOnly JWT Cookie 实现。运行认证功能前需要配置 `DATABASE_URL`、执行数据库迁移，并设置不少于 16 位的 `AUTH_SECRET`；登录令牌不会暴露给前端 JavaScript，也不会写入 `localStorage`。未登录用户仍可使用访客模式体验口语练习。
