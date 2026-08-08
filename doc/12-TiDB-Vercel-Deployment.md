# TiDB Cloud + Vercel 免费部署

## 架构

```text
GitHub -> Vercel -> TiDB Cloud Starter
                    -> OpenAI API
```

本地开发继续使用 MariaDB。Vercel 运行时使用 TiDB Cloud Serverless Prisma Adapter，通过 HTTPS 查询数据库；数据库迁移仍使用 TiDB 提供的 MySQL TCP 连接。

## 环境切换

本地 `.env`：

```dotenv
DATABASE_DRIVER="mariadb"
DATABASE_URL="mysql://english_app:password@127.0.0.1:3306/english_speaking"
```

Vercel Production：

```dotenv
DATABASE_DRIVER="tidb-cloud"
DATABASE_URL="mysql://<user>:<password>@<tidb-host>:4000/<database>?sslaccept=strict"
```

同时在 Vercel 配置 `OPENAI_API_KEY`、Realtime 模型和额度、JWT RSA 密钥、应用 URL 与默认语言。任何真实密钥只能放在本地未跟踪的 `.env`、密码管理器或 Vercel Environment Variables 中。

## 首次发布顺序

1. 创建 TiDB Cloud Starter 实例并记录连接信息。
2. 在本地临时使用 TiDB TCP 连接执行 `pnpm prisma:deploy`。
3. 执行 `pnpm prisma:seed` 写入基础场景。
4. 用 TiDB SQL Editor 核对业务表和 `_prisma_migrations`。
5. 在 Vercel 导入 GitHub 仓库并配置 Production 环境变量。
6. 部署 `main`，检查 `/api/v1/health`、注册、登录和场景列表。
7. 完成一次文字练习、一次 Realtime 语音练习和一次发音评分。

必须先迁移数据库，再发布依赖新字段或新表的应用代码。

## 自动校验

`.github/workflows/ci.yml` 在 `develop`、`main` 和 Pull Request 上运行：

- 依赖锁定安装；
- Prisma Client 生成及 Schema 校验；
- TypeScript；
- ESLint；
- Vitest；
- Next.js 生产构建。

## 后续迁移云服务器

应用仅依赖标准环境变量和 Prisma 数据层。迁移时导出 TiDB 数据到云 MySQL，将 `DATABASE_DRIVER` 改为 `mariadb`，更新 `DATABASE_URL`，执行迁移并部署同一份 Next.js 构建即可。当前不保存原始录音，因此暂不需要 Cloudflare R2。
