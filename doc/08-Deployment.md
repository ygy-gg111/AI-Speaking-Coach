# 08-Deployment.md

# AI Speaking Coach 部署架构设计

------

# 1. 部署目标

本项目目标：

```text
低成本上线
+
稳定运行
+
支持个人使用
+
支持朋友使用
+
未来可扩展商业化
```

部署方案需要满足：

- Next.js 应用运行
- MySQL 数据库存储
- Realtime WebRTC
- MySQL任务与额度控制
- AI API 调用
- 文件存储
- HTTPS
- 自动部署
- 日志监控

------

# 2. 整体部署架构

## 2.1 MVP 部署架构

第一阶段推荐：

```text
Browser
├── HTTPS → Vercel Next.js
│          ├── Auth/API
│          ├── Realtime Session Endpoint
│          ├── 云 MySQL
│          └── Cloudflare R2
│
└── WebRTC → OpenAI Realtime API
             ├── Audio In/Out
             ├── VAD
             ├── Live Transcript
             └── Interruption
```

------

## 2.2 服务组成

| 服务    | 作用         | 推荐                |
| ------- | ------------ | ------------------- |
| Web应用 | 前端+API     | Vercel              |
| 数据库  | 用户数据     | 云 MySQL |
| 缓存    | MVP不使用    | 后续可选 Redis      |
| 文件    | 可选录音/图片| Cloudflare R2       |
| AI      | 实时语音/分析| OpenAI Realtime API + Text Model |
| 域名    | 访问入口     | Cloudflare          |

------

# 3. 部署方案选择

根据项目阶段分三个方案。

------

# 3.1 方案A：个人 MVP（推荐）

适合：

```text
自己使用
+
朋友使用
+
验证产品
```

架构：

```text
Vercel

+

云数据库服务

+

OpenAI

+

Cloudflare R2
```

成本：

```text
数据库和 Web 可使用低成本托管额度；实时语音按实际音频用量计费，必须配置每日分钟数、单次会话时长和项目预算告警。
```

优点：

- 部署简单。
- 自动 HTTPS。
- GitHub 自动发布。
- 不需要维护服务器。

缺点：

- 国内访问速度一般。
- 后期大规模需要迁移。

------

# 3.2 方案B：国内用户版本

适合：

```text
国内公开使用
```

架构：

```text
腾讯云/阿里云

        |

     Nginx

        |

    Next.js

        |

 MySQL

        |

 Redis

        |

 OpenAI Proxy
```

组件：

| 服务     | 选择                |
| -------- | ------------------- |
| 服务器   | 腾讯云轻量/阿里云   |
| 数据库   | 云数据库 MySQL |
| 缓存     | Redis               |
| 对象存储 | COS                 |
| 反向代理 | Nginx               |

------

# 3.3 方案C：商业化版本

用户量：

```text
10万+
```

架构：

```text
              CDN

               |

          Load Balancer

               |

      ------------------

      |                |

 Next Server       Next Server


               |

          API Gateway


               |

      ------------------

      |                |

 Database          Redis


               |

          AI Worker


               |

          AI Provider
```

------

# 4. 开发环境搭建

## 4.1 本地环境要求

推荐：

```text
Node.js >= 20

pnpm >= 9

MySQL >= 8.0

Redis >= 7

Git

Docker
```

------

检查：

```bash
node -v

pnpm -v

docker -v
```

------

# 5. 本地开发启动

## 5.1 克隆项目

```bash
git clone xxx

cd ai-speaking-coach
```

------

## 5.2 安装依赖

```bash
pnpm install
```

------

## 5.3 配置环境变量

创建：

```text
.env.local
```

------

示例：

```env
DATABASE_URL=

OPENAI_API_KEY=

JWT_SECRET=

REFRESH_TOKEN_SECRET=

AUTH_COOKIE_NAME=

OPENAI_REALTIME_MODEL=

OPENAI_TEXT_MODEL=

STORAGE_ENDPOINT=

STORAGE_KEY=

STORAGE_SECRET=
```

------

## 5.4 初始化数据库

执行：

```bash
pnpm prisma migrate dev
```

生成：

```bash
pnpm prisma generate
```

------

## 5.5 启动项目

```bash
pnpm dev
```

访问：

```text
http://localhost:3000
```

------

# 6. 环境变量设计

生产环境：

```text
.env.production
```

------

## 6.1 应用配置

```env
NODE_ENV=production

APP_URL=https://example.com

DEFAULT_LOCALE=zh-CN

SUPPORTED_LOCALES=zh-CN,en
```

------

## 6.2 数据库

```env
DATABASE_URL=
```

格式：

```text
mysql://user:password@host:port/database
```

------

## 6.3 JWT

```env
JWT_SECRET=
JWT_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=30d
```

------

## 6.4 AI配置

```env
OPENAI_API_KEY=

OPENAI_REALTIME_MODEL=

OPENAI_TEXT_MODEL=
```

模型名称必须通过环境变量配置，不硬编码在客户端。正式 OpenAI API Key 只保存在 Vercel 服务端。

## 6.5 Realtime配置

```env
REALTIME_MAX_SESSION_MINUTES=15
REALTIME_DAILY_MINUTES_PER_USER=30
REALTIME_MAX_ACTIVE_SESSIONS_PER_USER=1
```

MVP 不配置 `REDIS_URL`。Realtime 会话媒体状态由 WebRTC 和 Realtime API 管理，业务记录与任务状态写入 MySQL。

------

## 6.6 对象存储

```env
STORAGE_PROVIDER=r2

STORAGE_BUCKET=

STORAGE_REGION=

STORAGE_ACCESS_KEY=

STORAGE_SECRET_KEY=
```

------

# 7. Vercel 部署方案

## 7.1 GitHub连接

流程：

```text
GitHub Repository

↓

Vercel Import

↓

自动识别 Next.js

↓

Build

↓

Deploy
```

------

## 7.2 Build配置

默认：

```bash
pnpm build
```

------

package.json:

```json
{
 "scripts":{
   "build":"next build",
   "start":"next start"
 }
}
```

------

# 8. Docker 部署方案

适合：

腾讯云服务器。

------

## 8.1 Dockerfile

```dockerfile
FROM node:20-alpine


WORKDIR /app


COPY package*.json ./


RUN npm install


COPY . .


RUN npm run build


EXPOSE 3000


CMD [
"npm",
"start"
]
```

------

## 8.2 docker-compose

```yaml
version: "3"


services:


 app:

  build: .

  ports:

   - "3000:3000"


  env_file:

   - .env



 mysql:

  image: mysql:8.4


  environment:

   MYSQL_ROOT_PASSWORD: root-password

   MYSQL_DATABASE: english_speaking

   MYSQL_USER: english_app

   MYSQL_PASSWORD: password


  ports:

   - "3306:3306"



 redis:

  image: redis:7


  ports:

   - "6379:6379"
```

------

# 9. Nginx部署

生产服务器：

```text
用户

↓

80/443

↓

Nginx

↓

3000

↓

Next.js
```

------

配置：

```nginx
server {

listen 80;

server_name example.com;


location / {


proxy_pass http://localhost:3000;


proxy_set_header Host $host;


proxy_set_header X-Real-IP $remote_addr;


}

}
```

------

# 10. HTTPS配置

推荐：

```text
Cloudflare SSL
```

或者：

```text
Let's Encrypt
```

------

流程：

```text
申请证书

↓

安装

↓

Nginx配置

↓

自动续期
```

------

# 11. 数据库部署

## 推荐

MVP：

```text
云 MySQL
```

------

生产：

```text
云数据库 MySQL
```

------

注意：

开启：

```text
自动备份

连接池

慢查询日志
```

------

# 12. Redis与队列演进

MVP 不部署 Redis，不使用 BullMQ。以下能力仅在多实例并发、数据库限流压力或异步任务吞吐明显增长后启用。

## 12.1 后续对话缓存

例如：

```text
conversation:xxxx
```

保存：

```json
{
currentStep:"",
messages:[]
}
```

------

## 12.2 后续分布式限流

例如：

```text
用户一分钟最多20次AI请求
```

------

## 12.3 后续 AI 任务队列

MVP 使用 MySQL `AnalysisJob` 表和定时任务处理纠错重试、总结与学习数据聚合。未来才升级为：

```text
用户请求

↓

Queue

↓

Worker

↓

AI
```

------

# 13. 文件存储部署

不要保存：

```text
数据库Blob
```

使用：

```text
对象存储
```

------

目录：

```text
bucket

├── audio

│    └── userId

│

├── images

│

└── reports
```

------

文件：

```text
audio/user123/xxx.mp3
```

数据库：

保存：

```text
URL
```

------

# 14. CI/CD 自动部署

推荐：

GitHub Actions。

流程：

```text
开发

↓

git push

↓

GitHub Actions

↓

Install

↓

Lint

↓

Test

↓

Build

↓

Deploy
```

------

workflow：

```yaml
name: Deploy


on:

 push:

  branches:

   - main


jobs:


 build:


  runs-on: ubuntu-latest


  steps:


   - uses: actions/checkout@v4


   - run: pnpm install


   - run: pnpm build
```

------

# 15. 数据库迁移流程

开发：

```bash
prisma migrate dev
```

生产：

```bash
prisma migrate deploy
```

------

禁止：

生产环境：

```bash
migrate dev
```

------

# 16. 日志系统

需要记录：

```text
请求日志

AI调用日志

错误日志

数据库异常
```

------

推荐：

MVP：

```text
Console + Vercel Logs
```

------

后期：

```text
Sentry

Grafana

Prometheus
```

------

# 17. 监控指标

核心指标：

## 系统

```text
CPU

Memory

Request Time

Error Rate
```

------

## AI

```text
调用次数

Token消耗

平均响应时间

失败率
```

------

## 用户

```text
每日练习人数

完成率

平均练习时间

留存率
```

------

# 18. 安全设计

## API安全

必须：

```text
身份认证

参数校验

Rate Limit

SQL防注入
```

------

## 文件安全

限制：

```text
文件大小

文件类型

上传频率
```

------

## AI安全

防止：

```text
Prompt Injection
```

例如：

用户：

```text
忽略之前规则
```

AI层：

必须保持：

```text
System Prompt最高优先级
```

------

# 19. 生产上线检查清单

## 前端

-  页面正常访问
-  SEO正常
-  移动端适配
-  Loading处理
-  Error页面
-  麦克风权限拒绝可降级
-  WebRTC断开可重连或切换文字
-  Ant Design SSR首屏无样式闪烁
-  zh-CN/en路由、语言切换和刷新持久化正常
-  canonical与hreflang正确

## 后端

-  API正常
-  JWT正常
-  Auth Cookie启用HttpOnly/Secure/SameSite
-  数据库连接
-  AI调用成功
-  限流开启
-  正式OpenAI API Key未暴露到客户端

## 数据库

-  Migration完成
-  Backup开启
-  Index检查

## AI

-  Prompt版本正确
-  Token限制
-  失败Fallback
-  VAD和用户打断正常
-  Realtime每日分钟数和单次会话上限生效

## 部署

-  HTTPS
-  域名
-  环境变量
-  日志监控

------

# 20. 推荐最终部署路线

根据当前项目：

推荐：

## 第一阶段

```text
GitHub

↓

Vercel

↓

云数据库服务

↓

OpenAI API

↓

Cloudflare R2
```

目标：

```text
4-6周完成可测试 MVP；实时语音、打断、移动端兼容和弱网重连通过验收后再公开发布
```

------

## 第二阶段

用户增加：

```text
腾讯云服务器

↓

Docker

↓

Nginx

↓

MySQL

↓

Redis
```

------

## 第三阶段

商业化：

```text
Kubernetes

+

AI Worker

+

消息队列

+

数据分析平台
```

------

# 21. 本章总结

最终部署架构：

```text
             User

              |

             CDN

              |

           Next.js

              |

      ----------------

      |              |

 MySQL       AI API

      |

    Redis

      |

 Object Storage
```

核心原则：

```text
简单上线

快速验证

数据可迁移

架构可扩展

避免过早复杂化
```

------

# 下一章

## 09-Development-Guide.md

内容：

- 开发规范
- Git规范
- 分支策略
- Commit规范
- 本地开发流程
- Prisma开发流程
- AI Coding规范
- Codex/Claude Code协作方式
- 测试规范
- Code Review流程

这一章会直接指导实际开发。
