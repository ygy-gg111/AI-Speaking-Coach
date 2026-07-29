# AI Speaking Coach

面向英语学习者的 AI 实时口语训练平台。当前仓库已完成 MVP 工程骨架，采用 Next.js 全栈架构，前端使用 Ant Design，并提供中英文国际化和实时语音模块接口。

## 技术栈

- Next.js 16（App Router）+ React 19 + TypeScript
- Ant Design + `@ant-design/nextjs-registry`
- next-intl（`zh-CN` / `en`）
- TanStack Query + Zustand
- Next.js Route Handlers + Zod
- Prisma + PostgreSQL
- WebRTC + OpenAI Realtime（接口骨架）
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

`POST /api/v1/realtime/session` 已定义请求校验、环境配置和响应契约。真正签发 OpenAI Realtime 临时凭证的服务端交换逻辑将在实时对话功能开发时接入，浏览器端不会直接持有 `OPENAI_API_KEY`。
