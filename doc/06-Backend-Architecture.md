# 7. 后端系统设计与 API 架构

------

# 7.1 本章目标

本章设计 AI Speaking Coach 后端系统。

目标：

```text
用户请求
↓
API 接收
↓
业务校验
↓
Service处理
↓
AI调用
↓
数据库保存
↓
返回结果
```

后端需要支持：

- 用户注册登录
- 场景浏览
- 开始练习
- 多轮对话
- AI纠错
- 提示系统
- 收藏场景
- 学习记录
- 打卡分享
- 音频上传
- AI日志
- 后台管理

------

# 7.2 技术架构选择

推荐：

```text
Next.js 15
+
TypeScript
+
Prisma
+
PostgreSQL
+
Object Storage
```

整体：

```
                    Browser

                       |
                       |

                  Next.js App

                       |

        --------------------------------

        API Layer        Server Action

             |

        Application Layer

             |

        Domain Service

             |

        Repository Layer

             |

        Prisma ORM

             |

        PostgreSQL
```

------

# 7.3 为什么使用 Next.js 全栈

本项目不是传统后台系统。

特点：

- 前端页面多。
- AI交互强。
- SEO需求存在。
- 用户量初期不会特别大。

Next.js 可以：

- 页面渲染。
- API。
- 鉴权。
- AI调用。
- 文件处理。

一个仓库完成。

适合：

```text
MVP
个人项目
创业早期
```

------

# 7.4 后端目录设计

推荐：

```
src/

├── app/
│
│   ├── api/
│   │
│   │   ├── auth/
│   │   ├── scenes/
│   │   ├── conversations/
│   │   ├── messages/
│   │   ├── vocabulary/
│   │   ├── checkins/
│   │   └── upload/
│
├── modules/
│
│   ├── auth/
│   │
│   ├── user/
│   │
│   ├── scene/
│   │
│   ├── conversation/
│   │
│   ├── learning/
│   │
│   ├── ai/
│   │
│   └── media/
│
├── lib/
│
│   ├── prisma.ts
│   ├── redis.ts
│   ├── storage.ts
│   └── logger.ts
│
├── middleware/
│
├── types/
│
└── utils/
```

------

# 7.5 后端分层设计

不要：

```
API
 |
直接操作 Prisma
```

后期会非常难维护。

推荐：

```
Controller

↓

Service

↓

Repository

↓

Database
```

------

## Controller

职责：

接收请求。

负责：

- 参数获取。
- 参数校验。
- 返回 HTTP。

不负责：

- 业务逻辑。
- AI调用。
- 数据处理。

示例：

```ts
export async function POST(
 request:Request
){

 const body =
 await request.json()


 const result =
 await conversationService.sendMessage(body)


 return Response.json(result)

}
```

------

# 7.6 Service 层

业务核心。

例如：

ConversationService：

负责：

- 创建会话。
- 发送消息。
- 调用 AI。
- 更新状态。

示例：

```ts
class ConversationService {


 async sendMessage(
 input:SendMessageInput
 ){

   //保存用户消息


   //获取当前步骤


   //调用AI


   //处理状态机


   //保存结果


   return result

 }

}
```

------

# 7.7 Repository 层

负责数据库。

例如：

```ts
class ConversationRepository {


 async findById(
 id:string
 ){

   return prisma.conversation.findUnique({
      where:{
        id
      }
   })

 }


}
```

Service 不直接：

```ts
prisma.xxx
```

避免业务和数据库耦合。

------

# 7.8 完整请求链路

用户发送：

```
I want go Japan
```

流程：

```
Frontend

↓

POST /api/conversations/message

↓

MessageController

↓

ConversationService

↓

ContextBuilder

↓

AI Orchestrator

↓

OpenAI Provider

↓

State Engine

↓

Repository

↓

Database

↓

Response

↓

Frontend
```

------

# 7.9 API 设计原则

统一：

```
/api/v1
```

例如：

```
/api/v1/scenes
```

规范：

GET 查询

POST 创建

PATCH 修改

DELETE 删除

------

# 7.10 API 返回格式

统一：

```json
{
 "success":true,

 "data":{},


 "error":null,


 "timestamp":"2026-07-28"
}
```

失败：

```json
{
 "success":false,

 "data":null,


 "error":{
   "code":"SCENE_NOT_FOUND",
   "messageKey":"errors.sceneNotFound"
 }
}
```

接口错误以稳定的 `code` 和 `messageKey` 为准，前端使用 `next-intl` 翻译；后端日志不得依赖本地化文案。需要本地化生成内容的接口可读取已校验的 `locale`，其优先级为用户资料、Locale Cookie、`Accept-Language`、系统默认值。

------

# 7.11 当前第一阶段实现

当前代码已经按 Controller → Service → Repository 分层完成第一批业务接口：

```text
GET  /api/v1/scenes
GET  /api/v1/scenes/:sceneId
POST /api/v1/scenes/:sceneId/favorite
DELETE /api/v1/scenes/:sceneId/favorite
GET  /api/v1/my-scenes
GET  /api/v1/calendar?year=&month=&timezoneOffset=
GET  /api/v1/calendar/:date?timezoneOffset=
GET  /api/v1/dashboard?timezoneOffset=
GET  /api/v1/reports?period=&timezoneOffset=
GET  /api/v1/mistakes?limit=
POST /api/v1/mistakes
POST /api/v1/mistakes/:mistakeId/review
GET  /api/v1/vocabulary?limit=
POST /api/v1/vocabulary
PATCH /api/v1/vocabulary/:entryId
POST /api/v1/conversations
GET  /api/v1/conversations?limit=30
GET  /api/v1/conversations/:conversationId
POST /api/v1/conversations/:conversationId/messages
POST /api/v1/conversations/:conversationId/complete
```

实现边界：

- 场景列表支持分类、难度和关键词筛选。
- 场景详情不会返回服务端 `systemPrompt`。
- 收藏写入按用户和场景保持唯一，重复收藏不会生成重复数据。
- “我的场景”只返回当前登录用户收藏的有效场景。
- 会话历史只返回当前用户已完成的练习，支持 1 到 100 条的数量限制。
- 完成会话时同步保存新表达数、纠错数和熟练度，用于跨设备恢复学习记录。
- 月历和日期详情按浏览器时区偏移计算 UTC 查询边界，避免跨午夜记录归属错误。
- Dashboard 聚合今日分钟、累计场景和表达、昨日增量、连续学习天数与最近练习。
- 会话数据按登录用户隔离，其他用户无法读取或写入。
- 消息只允许客户端写入 `USER` 和 `ASSISTANT`，禁止写入 `SYSTEM`。
- `clientEventId` 用作消息幂等键，避免重连重复入库。
- 完成会话操作可重复调用，已完成会话不会再次改变结束状态。
- 单次练习时长限制为最多 60 分钟。

数据库初始化使用 `prisma/migrations/20260731090000_init`，收藏表由 `prisma/migrations/20260731103000_add_favorite_scenes` 增量创建，会话学习指标由 `prisma/migrations/20260731120000_add_conversation_learning_metrics` 增量创建，基础场景通过 `pnpm prisma:seed` 显式写入。Prisma 7 不再在迁移后自动执行种子脚本，因此部署流程需要分别执行迁移与种子命令。

------

# 7.11 错误码设计

格式：

```
模块_错误
```

例如：

用户：

```
AUTH_INVALID_TOKEN

AUTH_USER_EXISTS

AUTH_PASSWORD_ERROR
```

场景：

```
SCENE_NOT_FOUND

SCENE_NOT_AVAILABLE
```

对话：

```
CONVERSATION_NOT_FOUND

CONVERSATION_FINISHED
```

AI：

```
AI_TIMEOUT

AI_RESPONSE_INVALID

AI_PROVIDER_ERROR
```

------

# 7.12 用户认证设计

推荐：

MVP：

```
JWT + Refresh Token
```

流程：

```
登录

↓

验证账号密码

↓

生成 Access Token

↓

生成 Refresh Token

↓

服务端设置 HttpOnly、Secure、SameSite Cookie

↓

浏览器自动携带 Cookie
```

------

# 7.13 Token设计

Access Token：

有效期：

```
15分钟
```

Refresh Token：

有效期：

```
30天
```

安全要求：

- Access Token 与 Refresh Token 不返回给前端 JavaScript。
- Refresh Token 只保存在 HttpOnly Cookie，数据库保存其哈希值。
- 每次刷新执行 Refresh Token Rotation，旧 Token 立即失效。
- 登出、改密和风险事件必须撤销对应 Refresh Token。
- 禁止使用 localStorage 保存登录 Token。

Payload：

```json
{
 "userId":"xxx",

 "role":"USER",

 "iat":123456
}
```

------

# 7.14 Auth Middleware

所有需要登录接口：

经过：

```
Request

↓

Auth Middleware

↓

解析Token

↓

查询用户

↓

注入userId

↓

Controller
```

------

示例：

```ts
export async function authMiddleware(
req
){

 const token =
 getToken(req)


 const payload =
 verify(token)


 return {
   userId:payload.userId
 }

}
```

------

# 7.15 用户相关 API

## 注册

```
POST

/api/v1/auth/register
```

请求：

```json
{
"email":"test@test.com",

"password":"123456",

"nickname":"Tom"
}
```

返回：

```json
{
"userId":"xxx"
}
```

------

## 登录

```
POST

/api/v1/auth/login
```

返回：

```json
{
"userId":"xxx",
"expiresIn":900
}
```

Token 通过 `Set-Cookie` 返回，不出现在 JSON Body。

------

## 当前用户

```
GET

/api/v1/users/me
```

返回：

```json
{
"id":"xxx",

"nickname":"Tom",

"level":"A2",

"practiceDays":20
}
```

------

# 7.16 场景 API

## 获取分类

```
GET

/api/v1/scenes/categories
```

------

## 获取场景列表

```
GET

/api/v1/scenes
```

参数：

```
category

difficulty

keyword

favorite
```

------

## 获取场景详情

```
GET

/api/v1/scenes/:id
```

返回：

包括：

```
场景介绍

学习目标

难度

预计时间

核心表达
```

注意：

不要返回：

- AI Prompt
- 内部成功条件
- 状态规则

------

# 7.17 收藏场景 API

添加：

```
POST

/api/v1/scenes/:id/favorite
```

取消：

```
DELETE

/api/v1/scenes/:id/favorite
```

------

# 7.18 开始练习 API

接口：

```
POST

/api/v1/conversations/start
```

请求：

```json
{
"sceneId":"airport-checkin"
}
```

流程：

```
验证场景

↓

获取最新版本

↓

创建Conversation

↓

创建StepState

↓

返回第一句话
```

返回：

```json
{
"conversationId":"xxx",

"scene":{
"name":"机场值机"
},

"message":{
"content":
"Good morning. Where are you flying today?"
},

"currentStep":{
"name":"确认目的地"
}
}
```

------

# 7.19 对话发送 API

核心接口：

```
POST

/api/v1/conversations/:id/messages
```

请求：

```json
{
"content":
"I want go Japan"
}
```

内部：

```
保存用户消息

↓

加载上下文

↓

调用AI

↓

解析结果

↓

更新状态

↓

保存AI消息

↓

返回
```

------

返回：

```json
{
"message":{

"content":
"Great. Which city in Japan?"

},


"correction":{

"items":[

{
"original":
"I want go Japan",

"corrected":
"I want to go to Japan"
}

]

},


"step":{

"completed":true

}

}
```

------

# 7.20 AI 调用接口设计

业务层：

```
ConversationService

↓

AIService
```

不要：

```
Controller

↓

OpenAI
```

------

AI Service：

```ts
interface AIService{


chat(
context:AIContext
):

Promise<AIResult>


}
```

------

# 7.21 提示 API

请求：

```
POST

/api/v1/conversations/:id/hint
```

参数：

```json
{
"level":1
}
```

返回：

```json
{
"type":"KEYWORDS",

"content":[
"passport",
"here"
]
}
```

------

# 7.22 复听 API

用户收藏表达。

获取：

```
GET

/api/v1/vocabulary/:id/audio
```

返回：

```json
{
"text":
"I'd like to check in.",

"audioUrl":
"xxx"
}
```

------

# 7.23 Realtime Session API

流程：

```text
浏览器请求创建 Realtime 会话
↓
后端校验登录、场景权限、并发会话数和每日语音额度
↓
浏览器创建 SDP offer，并以 application/sdp 发送到后端
↓
后端将 SDP 与服务端会话配置转发到 OpenAI Realtime Calls API
↓
后端将 SDP answer 原样返回浏览器
↓
浏览器完成 RTCPeerConnection
↓
麦克风与 AI 音频通过 WebRTC 传输
↓
DataChannel 传输字幕、VAD、响应状态和工具事件
```

------

API：

```
POST /api/v1/realtime/session
```

请求体为浏览器生成的 SDP offer，请求查询参数携带 `conversationId`、`sceneName` 和 `level`。成功响应的 `Content-Type` 为 `application/sdp`，响应体为 OpenAI 返回的 SDP answer。

正式 OpenAI API Key 永远不能返回浏览器。后端只在与 OpenAI 建立会话时使用密钥，并且不得记录 SDP、Authorization header 或上游完整错误体。

可选录音保存使用独立接口：

```text
POST /api/v1/conversations/:id/recording
```

Realtime MVP 默认只保存最终字幕，不保存音频分片或完整原始录音。

------

# 7.24 WebRTC 实时语音架构

```text
getUserMedia
↓
RTCPeerConnection
↓
WebRTC
↓
Realtime API
↓
AudioTrack：用户音频输入与 AI 音频输出
DataChannel：字幕、VAD、打断、错误与会话事件
```

默认开启 VAD。检测到用户在 AI 说话期间重新发言时，WebRTC 会话自动取消当前响应并截断尚未播放的音频；用户主动打断时前端发送 `response.cancel` 与 `output_audio_buffer.clear`。连接中断时最多自动重连两次；仍失败则保留最终字幕并降级到文字模式。

实现依据：

- [OpenAI Realtime API with WebRTC](https://developers.openai.com/api/docs/guides/realtime-webrtc)
- [OpenAI Realtime conversations](https://developers.openai.com/api/docs/guides/realtime-conversations)

------

# 7.25 文字降级模式与 SSE

在进入文字流式降级前，结构化学习评估使用独立接口：

```text
POST /api/v1/conversations/:id/review
```

请求包含场景、学习等级、练习时长和最多 50 条最终消息。服务端使用 Responses API Structured Outputs 与 Zod Schema 生成：

```text
原始表达
自然表达
中英文原因
难度
新表达数量
纠错数量
练习时长
```

Realtime 回复不直接作为结构化评估。没有 API Key 或上游分析失败时，接口返回 `source: fallback` 的基础分析，保证练习结束和复盘页面仍可使用。

------

SSE 只用于文字输入降级模式和异步纠错卡片更新，不承担实时音频传输。

```
请求

等待5秒

一次返回
```

体验差。

升级：

```
用户发送

↓

SSE连接

↓

AI生成

↓

逐字返回

↓

完成后返回纠错
```

接口：

```
POST

/api/v1/conversations/:id/stream
```

------

返回：

```
event:message

data:
"Great"


event:correction

data:
{}
```

------

# 7.26 Redis 使用

MVP 不使用 Redis。以下能力在用户规模增长后再引入：

## 后续会话缓存

```
conversation:{id}
```

保存：

```
currentStep

recentMessages

hintState
```

------

## 后续分布式限流

例如：

```
用户一分钟最多20次AI请求
```

------

## 后续 AI 结果缓存

静态内容：

```
scene opening
hint
expression
```

------

# 7.27 文件存储设计

不要存数据库。

数据库：

```
objectKey
imageUrl
```

文件：

```
Cloudflare R2
```

结构：

```
bucket

/user

 /audio

 /images

 /reports
```

------

# 7.28 定时任务

需要：

```
Cron Job
```

任务：

每日：

```
生成学习统计
```

每周：

```
生成学习报告
```

清理：

```
AI日志
临时文件
```

------

# 7.29 后台管理 API

管理员：

```
/admin
```

接口：

场景：

```
POST /admin/scenes

PATCH /admin/scenes/:id

POST /admin/scenes/:id/publish
```

Prompt：

```
GET /admin/prompts

POST /admin/prompts/version
```

------

# 7.30 权限设计

角色：

```text
USER

ADMIN

EDITOR
```

权限：

USER：

- 练习
- 收藏
- 查看历史

EDITOR：

- 创建场景
- 编辑Prompt

ADMIN：

- 用户管理
- 系统配置

------

# 7.31 后端部署架构

MVP：

```
Vercel

+

Supabase PostgreSQL

+

OpenAI API

+

Cloudflare R2
```

结构：

```
User

↓

Vercel

↓

Next.js API
├── Supabase PostgreSQL
├── Cloudflare R2
└── OpenAI Realtime API / Text Model
```

------

# 7.32 后期规模化

用户增长：

```
CDN

↓

Load Balance

↓

Next Server

↓

Queue

↓

AI Worker

↓

Database
```

AI任务异步化：

```
BullMQ

Redis

Worker
```

------

# 7.33 本章架构总结

最终后端：

```
API Route

↓

Controller

↓

Application Service

↓

Domain Service

↓

AI Engine

↓

Repository

↓

Prisma

↓

PostgreSQL
```

核心原则：

```
Controller 不写业务

Service 不直接写SQL

AI 不直接改状态

数据库保存事实

状态机控制流程
```

------

# 7.34 下一章预告

下一章：

# 第八章：前端架构设计与页面实现方案

内容：

- Next.js 页面结构
- PC + 移动端响应式设计
- 组件架构
- 状态管理
- AI 对话页面
- 录音组件
- 场景页面
- 学习中心
- 打卡日历
- 小红书分享页
- UI设计规范
- Ant Design组件体系
- next-intl国际化

进入产品真正可见部分。
