# 2. 系统总体架构设计

## 2.1 架构设计目标

AI Speaking Coach 的系统架构需要同时满足以下目标：

1. 支持 MVP 阶段快速开发和上线。
2. 支持 PC 优先、移动端响应式访问。
3. 支持场景对话、提示、纠错、收藏、学习记录等核心能力。
4. 支持后续接入语音识别、语音合成和发音评分。
5. 支持 AI 模型切换，避免业务代码与单一模型供应商强绑定。
6. 支持用户长期学习数据沉淀。
7. 支持后续从单体架构平滑演进为模块化服务架构。
8. 控制开发成本、部署成本和 AI 调用成本。

本项目第一阶段不采用微服务架构。

MVP 推荐采用：

```text
Next.js 全栈应用
+
MySQL
+
Prisma
+
OpenAI API
+
WebRTC Realtime
+
对象存储
```

原因如下：

- 当前产品处于验证阶段。
- 用户规模暂时较小。
- 业务边界还会不断调整。
- 微服务会增加部署、通信、监控和维护成本。
- Next.js 全栈架构已经可以完成前端、接口、鉴权和 AI 调用。

整体架构遵循以下原则：

```text
先单体
后模块化
再服务化
```

------

## 2.2 系统总体架构

```text
┌──────────────────────────────────────────────────────────────┐
│                          用户访问层                           │
│                                                              │
│       PC Web / Mobile Web / WebRTC Microphone & Audio        │
└─────────────────┬────────────────────────────┬───────────────┘
                  │ HTTPS                      │ WebRTC
                  ▼                            ▼
┌──────────────────────────────────────────────────────────────┐
│                       Next.js 应用层                          │
│                                                              │
│  页面渲染        用户交互        Server Actions              │
│  App Router      React/AntD     Route Handlers               │
│  next-intl       Zustand        Realtime Session Endpoint    │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                       业务服务层                              │
│                                                              │
│  Auth Service              Scene Service                     │
│  Conversation Service      Correction Service                │
│  Hint Service              Favorite Service                  │
│  Learning Service          Checkin Service                   │
│  Report Service            Share Service                     │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                         AI 能力层                             │
│                                                              │
│  Prompt Engine             Conversation Engine               │
│  Scene Engine              Correction Engine                 │
│  Hint Engine               Memory Engine                     │
│  Summary Engine            Model Router                      │
└───────────────────────┬───────────────────┬──────────────────┘
                        │                   │
                        ▼                   ▼
              ┌──────────────────┐  ┌──────────────────┐
              │    Text Model    │  │ Realtime Model   │
│                  │  │                  │
              │ 纠错/总结/报告    │  │ Audio In/Out     │
              │ Structured Data  │  │ VAD/Interrupt    │
              └──────────────────┘  └──────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                         数据存储层                            │
│                                                              │
│  MySQL                           Object Storage         │
│  业务数据与会话记录                    可选录音与分享图片         │
└──────────────────────────────────────────────────────────────┘
```

------

## 2.3 架构分层

系统整体分为六层。

```text
用户访问层
表现层
业务层
AI能力层
数据访问层
基础设施层
```

### 2.3.1 用户访问层

用户访问层负责承载不同终端。

第一阶段支持：

- PC 浏览器
- 手机浏览器
- 平板浏览器

后续支持：

- PWA
- Electron
- iOS
- Android

MVP 阶段只维护一套响应式 Web 代码。

------

### 2.3.2 表现层

表现层由 Next.js 和 React 组成。

主要职责：

- 页面展示
- 路由管理
- 响应式布局
- Ant Design 组件与 Design Token
- 中英文文案、日期、数字和时区格式化
- Locale 路由、语言识别与语言切换
- 用户输入
- 对话流展示
- 录音控制
- 错误卡片展示
- 提示卡片展示
- 页面状态管理

表现层不得直接拼接复杂 Prompt。

表现层不得直接调用 AI Provider。

所有 AI 请求必须经过服务端。

错误示例：

```ts
// 不允许在浏览器中直接调用模型
await openai.chat.completions.create(...)
```

正确流程：

```text
浏览器
↓
应用 API
↓
Conversation Service
↓
AI Engine
↓
Model Provider
```

这样可以避免：

- API Key 泄露
- Prompt 泄露
- 业务规则被绕过
- AI 调用失控
- 用户直接伪造请求

------

### 2.3.3 业务服务层

业务服务层负责处理产品逻辑。

推荐按领域拆分服务。

```text
services/
├── auth/
├── scene/
├── conversation/
├── correction/
├── hint/
├── favorite/
├── learning/
├── checkin/
├── report/
└── share/
```

业务服务层负责：

- 参数校验
- 用户权限校验
- 场景读取
- 会话状态管理
- AI 调用编排
- 数据保存
- 日志记录
- 错误转换
- 事务控制

业务服务层不直接关心具体页面。

例如：

```ts
conversationService.sendMessage()
```

既可以被 Web API 调用，也可以被未来的移动端接口调用。

------

### 2.3.4 AI 能力层

AI 能力层是整个项目最核心的技术层。

AI 能力层不是一个简单的 OpenAI 调用文件。

它需要完成以下能力：

```text
场景理解
Prompt 生成
对话历史管理
角色约束
状态机控制
错误分析
提示生成
学习记忆
模型选择
结构化输出解析
失败重试
调用日志
成本统计
```

推荐目录：

```text
src/ai/
├── providers/
├── engines/
├── prompts/
├── schemas/
├── parsers/
├── memory/
├── guards/
├── router/
└── logs/
```

------

### 2.3.5 数据访问层

数据访问层负责数据库读写。

使用：

```text
MySQL
+
Prisma ORM
```

推荐采用 Repository 模式，但 MVP 不需要过度封装。

推荐结构：

```text
repositories/
├── user.repository.ts
├── scene.repository.ts
├── conversation.repository.ts
├── message.repository.ts
├── correction.repository.ts
├── vocabulary.repository.ts
├── favorite.repository.ts
└── checkin.repository.ts
```

业务服务不直接散落编写 Prisma 查询。

错误示例：

```ts
// 页面接口中直接写大量 Prisma 逻辑
const conversation = await prisma.conversation.findFirst(...)
```

推荐方式：

```ts
const conversation =
  await conversationRepository.findById(conversationId)
```

这样后期更容易：

- 修改数据结构
- 编写单元测试
- 替换实现
- 增加缓存
- 控制事务

------

### 2.3.6 基础设施层

基础设施层提供通用能力。

包括：

- 数据库
- Redis
- 对象存储
- 日志系统
- 邮件服务
- 限流
- 监控
- 环境变量
- 定时任务
- 第三方 AI 服务

推荐目录：

```text
src/infrastructure/
├── database/
├── cache/
├── storage/
├── logger/
├── queue/
├── email/
├── rate-limit/
└── monitoring/
```

------

## 2.4 MVP 逻辑架构

MVP 阶段采用模块化单体架构。

```text
┌───────────────────────────────────────────────────┐
│                Next.js Application                │
│                                                   │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ UI Modules   │  │ API Modules  │              │
│  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                       │
│         └────────┬────────┘                       │
│                  ▼                                │
│        ┌─────────────────────┐                    │
│        │   Business Services │                    │
│        └──────────┬──────────┘                    │
│                   ▼                               │
│        ┌─────────────────────┐                    │
│        │      AI Engines     │                    │
│        └──────────┬──────────┘                    │
│                   ▼                               │
│        ┌─────────────────────┐                    │
│        │ Repository / Prisma │                    │
│        └─────────────────────┘                    │
└───────────────────────────────────────────────────┘
```

虽然部署时是一个应用，但代码内部必须保持模块边界。

不建议把所有逻辑写进：

```text
app/api/chat/route.ts
```

Route Handler 只负责：

1. 获取请求。
2. 校验参数。
3. 调用 Service。
4. 返回结果。

示例：

```ts
export async function POST(request: Request) {
  const session = await requireUserSession()

  const body = await request.json()

  const input = chatRequestSchema.parse(body)

  const result = await conversationService.sendMessage({
    userId: session.user.id,
    conversationId: input.conversationId,
    message: input.message,
  })

  return Response.json(result)
}
```

复杂逻辑全部放到：

```text
ConversationService
```

------

## 2.5 核心业务模块

系统包含以下核心模块。

| 模块                | 主要职责                     |
| ------------------- | ---------------------------- |
| Auth Module         | 注册、登录、会话、权限       |
| User Module         | 用户资料、等级、偏好         |
| Scene Module        | 场景分类、场景详情、场景步骤 |
| Conversation Module | 开始练习、发送消息、结束练习 |
| Hint Module         | 三级提示、提示次数记录       |
| Correction Module   | 语法、词汇、表达错误分析     |
| Favorite Module     | 收藏场景、取消收藏           |
| Vocabulary Module   | 用户词库、复习状态           |
| Learning Module     | 学习时长、完成度、能力数据   |
| Checkin Module      | 日历打卡、每日学习摘要       |
| Report Module       | 周报、月报、学习趋势         |
| Share Module        | 小红书文案和分享图片         |
| Audio Module        | 音频上传、识别、播放         |
| Admin Module        | 场景配置和内容管理           |

------

## 2.6 AI 系统总体架构

```text
用户输入
   │
   ▼
Input Guard
输入安全与格式检查
   │
   ▼
Conversation Context Builder
构建场景、步骤、用户等级、历史消息
   │
   ▼
Prompt Engine
生成系统提示词和任务提示词
   │
   ▼
Model Router
选择模型与参数
   │
   ▼
LLM Provider
调用模型
   │
   ▼
Structured Output Parser
解析结构化返回
   │
   ▼
Output Guard
检查内容、格式和场景一致性
   │
   ▼
State Engine
判断步骤是否完成
   │
   ▼
Learning Data Processor
保存纠错、单词、学习记录
   │
   ▼
返回前端
```

AI 层建议分为以下引擎。

```text
Scene Engine
Conversation Engine
Correction Engine
Hint Engine
Memory Engine
Summary Engine
Report Engine
Model Router
```

------

## 2.7 Scene Engine

Scene Engine 负责读取并组装场景配置。

输入：

```ts
{
  sceneId: string
  userId: string
  conversationId?: string
}
```

输出：

```ts
{
  scene: {
    id: string
    name: string
    roleName: string
    roleDescription: string
    difficulty: string
    openingMessage: string
  }
  currentStep: {
    id: string
    order: number
    goal: string
    successConditions: string[]
    keywords: string[]
  }
  userProfile: {
    level: string
    preferredLanguage: string
  }
}
```

Scene Engine 不负责生成最终回复。

它只负责提供场景上下文。

------

## 2.8 Conversation Engine

Conversation Engine 负责生成 AI 对话回复。

输入包括：

- 场景角色
- 当前场景步骤
- 用户等级
- 最近对话历史
- 用户本次输入
- 用户常见错误
- 本轮对话目标

输出包括：

```json
{
  "reply": "May I see your passport, please?",
  "emotion": "friendly",
  "stepCompleted": false,
  "suggestedNextStep": null,
  "shouldEnd": false
}
```

Conversation Engine 只负责：

- 保持角色
- 推进对话
- 保持自然交流
- 控制语言难度
- 避免跑题

它不直接负责输出详细语法教学。

------

## 2.9 Correction Engine

Correction Engine 负责分析用户表达。

输入：

```json
{
  "userMessage": "I want go Japan",
  "sceneContext": "Airport check-in",
  "userLevel": "A2"
}
```

输出：

```json
{
  "hasError": true,
  "corrections": [
    {
      "original": "I want go Japan",
      "corrected": "I want to go to Japan.",
      "naturalExpression": "I'm flying to Japan.",
      "type": "grammar",
      "reason": "want 后通常接 to do，国家名称前表示方向时使用 to。",
      "severity": "medium"
    }
  ]
}
```

Correction Engine 的设计原则：

```text
先完成交流
再展示纠错
```

不建议每说一个单词就打断用户。

前端可以将 AI 回复和纠错卡片同时显示，但视觉上应优先展示对话。

------

## 2.10 Hint Engine

Hint Engine 负责生成三级提示。

调用方式：

```text
用户点击提示按钮
↓
读取当前场景步骤
↓
读取 AI 当前问题
↓
根据提示等级生成结果
```

三级提示定义：

```text
Level 1：关键词
Level 2：句型结构
Level 3：完整参考表达
```

返回示例：

```json
{
  "level": 1,
  "content": ["passport", "show", "here"]
}
{
  "level": 2,
  "content": "Here is my + 名词"
}
{
  "level": 3,
  "content": "Here is my passport."
}
```

Hint Engine 需要记录：

- 用户使用了哪一级提示
- 同一个步骤使用了几次提示
- 用户查看提示后是否完成表达

这些数据后续可用于判断用户真实掌握程度。

------

## 2.11 Memory Engine

Memory Engine 负责建立用户长期学习记忆。

长期记忆不等于保存全部聊天记录。

长期记忆应该保存经过提炼的用户特征。

例如：

```json
{
  "level": "A2",
  "preferredScenes": ["travel", "work"],
  "frequentMistakes": [
    "preposition",
    "past_tense",
    "word_order"
  ],
  "strengths": [
    "basic vocabulary",
    "willingness to speak"
  ],
  "recentGoal": "Improve airport and hotel English"
}
```

Memory Engine 的数据来源：

- 对话纠错记录
- 场景完成情况
- 提示使用次数
- 词汇复习情况
- 练习时长
- 用户主动设置的目标

Memory Engine 不应在每轮对话都重新生成用户画像。

推荐触发时机：

- 一次场景练习结束
- 每日学习结束
- 每完成五次练习
- 生成周报时

------

## 2.12 Model Router

Model Router 用于控制不同任务使用不同模型。

示例：

```text
实时语音对话
→ Realtime Model

简单纠错
→ 低成本模型

复杂学习分析
→ 高能力模型

学习周报
→ 高能力模型

文字降级对话
→ 低延迟文本模型
```

模型路由接口：

```ts
type AITaskType =
  | 'conversation'
  | 'correction'
  | 'hint'
  | 'summary'
  | 'report'
  | 'speech_to_text'
  | 'text_to_speech'
interface ModelRouter {
  resolve(task: AITaskType): ModelConfig
}
```

业务层不得直接写死模型名称。

错误示例：

```ts
model: '固定模型名称'
```

推荐方式：

```ts
const modelConfig = modelRouter.resolve('conversation')
```

这样后期可以根据：

- 成本
- 速度
- 质量
- 用户套餐
- 供应商稳定性

动态切换模型。

------

## 2.13 AI Provider 抽象

需要定义统一接口。

```ts
export interface LLMProvider {
  generateText(
    input: GenerateTextInput
  ): Promise<GenerateTextResult>

  generateStructured<T>(
    input: GenerateStructuredInput<T>
  ): Promise<T>
}
```

OpenAI 只是其中一个实现。

```text
providers/
├── openai.provider.ts
├── mock.provider.ts
└── provider.factory.ts
```

后续可以增加：

```text
anthropic.provider.ts
google.provider.ts
deepseek.provider.ts
glm.provider.ts
```

业务代码只依赖统一 Provider 接口。

------

## 2.14 对话请求完整链路

用户发送一句话时，完整流程如下。

```text
1. 用户在对话页面输入内容
2. 前端进行基础校验
3. 调用 POST /api/conversations/:id/messages
4. 服务端验证用户身份
5. 验证会话是否属于当前用户
6. 查询当前场景
7. 查询当前场景步骤
8. 查询最近对话历史
9. 查询用户等级与学习记忆
10. 保存用户消息
11. 调用 Correction Engine
12. 调用 Conversation Engine
13. 解析 AI 结构化结果
14. 判断当前步骤是否完成
15. 更新会话 currentStep
16. 保存 AI 消息
17. 保存纠错记录
18. 提取可学习词汇
19. 更新本次练习统计
20. 返回前端
```

整体时序图：

```text
User
 │
 │ Send Message
 ▼
Frontend
 │
 │ POST Message
 ▼
API Route
 │
 │ Auth Check
 ▼
Conversation Service
 │
 ├──────────────► Scene Repository
 │                 Load Scene & Step
 │
 ├──────────────► Message Repository
 │                 Load History
 │
 ├──────────────► Memory Repository
 │                 Load User Memory
 │
 ├──────────────► Correction Engine
 │                 Analyze Message
 │
 ├──────────────► Conversation Engine
 │                 Generate Reply
 │
 ├──────────────► State Engine
 │                 Update Step
 │
 ├──────────────► Database
 │                 Save Result
 │
 ▼
API Response
 │
 ▼
Frontend
 │
 ▼
User
```

------

## 2.15 对话返回数据结构

推荐统一返回结构。

```ts
interface ConversationMessageResponse {
  message: {
    id: string
    role: 'assistant'
    content: string
    audioUrl?: string
    createdAt: string
  }

  correction: {
    hasError: boolean
    items: CorrectionItem[]
  }

  sceneState: {
    currentStep: number
    totalSteps: number
    stepCompleted: boolean
    sceneCompleted: boolean
    progress: number
  }

  learning: {
    newWords: VocabularyItem[]
    usedHint: boolean
  }
}
```

示例：

```json
{
  "message": {
    "id": "msg_1002",
    "role": "assistant",
    "content": "Great. How many bags would you like to check in?",
    "createdAt": "2026-07-28T10:00:00.000Z"
  },
  "correction": {
    "hasError": true,
    "items": [
      {
        "original": "I want go Japan",
        "corrected": "I want to go to Japan.",
        "naturalExpression": "I'm flying to Japan.",
        "type": "grammar",
        "reason": "want 后使用 to do。",
        "severity": "medium"
      }
    ]
  },
  "sceneState": {
    "currentStep": 3,
    "totalSteps": 6,
    "stepCompleted": true,
    "sceneCompleted": false,
    "progress": 50
  },
  "learning": {
    "newWords": [
      {
        "word": "check in",
        "meaning": "办理登机或入住"
      }
    ],
    "usedHint": false
  }
}
```

------

## 2.16 场景状态机架构

场景状态机用于防止 AI 对话跑偏。

状态机不能完全交给模型决定。

推荐采用：

```text
代码规则
+
AI 语义判断
```

代码负责：

- 当前步骤
- 步骤顺序
- 是否允许跳转
- 场景是否结束
- 最大对话轮数
- 超时处理

AI 负责：

- 判断用户是否表达了目标意思
- 判断当前步骤是否基本完成
- 判断用户是否需要额外引导

示例：

```ts
interface SceneState {
  currentStepId: string
  completedStepIds: string[]
  failedAttempts: number
  hintLevel: number
  status: 'active' | 'completed' | 'abandoned'
}
```

步骤跳转规则：

```text
用户表达满足目标
→ 进入下一步

用户表达不完整
→ AI继续追问

用户连续失败
→ 推荐提示

用户使用完整提示
→ 允许继续，但掌握度降低

完成最后一步
→ 结束场景并生成总结
```

------

## 2.17 数据流设计

系统主要存在五类数据流。

### 2.17.1 用户数据流

```text
注册登录
↓
用户资料
↓
英语等级
↓
学习目标
↓
个人偏好
```

------

### 2.17.2 场景数据流

```text
场景分类
↓
场景详情
↓
场景步骤
↓
角色配置
↓
Prompt 模板
```

------

### 2.17.3 对话数据流

```text
用户消息
↓
AI回复
↓
场景步骤变化
↓
对话历史
↓
练习完成
```

------

### 2.17.4 学习数据流

```text
用户表达
↓
错误分析
↓
错误记录
↓
词汇提取
↓
能力统计
↓
复习任务
```

------

### 2.17.5 分享数据流

```text
练习完成
↓
生成学习摘要
↓
生成分享文案
↓
生成分享图片
↓
用户复制或下载
↓
发布到小红书
```

------

## 2.18 同步与异步任务划分

不是所有任务都应该阻塞用户等待。

### 同步任务

必须立即完成：

- 用户消息保存
- Realtime 会话创建与权限校验
- 最终转写保存
- 场景步骤更新
- 基础纠错任务登记
- 提示生成
- 当前学习进度返回

### 异步任务

可以延迟处理：

- 长期记忆更新
- 周报生成
- 分享图片生成
- 可选录音格式转换
- 学习数据聚合
- 复杂能力分析
- 过期音频清理

MVP 阶段不使用 Redis 和 BullMQ。短任务可在请求内处理；耗时任务写入 MySQL 任务表，由定时任务领取、重试并记录结果。

用户量增加后引入队列。

推荐：

```text
BullMQ
+
Redis
```

异步任务示例：

```text
Conversation Completed
↓
Create Job
↓
Generate Learning Summary
↓
Update User Memory
↓
Generate Checkin Record
```

------

## 2.19 缓存设计

MVP 阶段明确不引入 Redis。Realtime 音频缓冲和连接状态由 WebRTC 与 Realtime API 管理，业务持久状态由 MySQL 管理。

当用户量增加后，可以缓存以下内容：

- 公共场景列表
- 场景详情
- Prompt 模板
- 热门场景
- 用户短期会话状态
- API 限流计数
- 模型配置
- 系统开关

不建议缓存：

- 用户最新消息
- 纠错写入结果
- 支付状态
- 关键学习记录

推荐缓存 Key：

```text
scene:list:{category}:{difficulty}
scene:detail:{sceneId}
conversation:state:{conversationId}
user:rate-limit:{userId}
prompt:template:{promptName}:{version}
```

------

## 2.20 实时语音与文件架构

实时语音属于 MVP P0 能力。主链路使用浏览器 WebRTC 直接连接 Realtime API：

```text
浏览器获取麦克风权限
↓
服务端校验用户、场景和语音额度
↓
服务端创建短期 Realtime 客户端凭证或代理 SDP 初始化
↓
浏览器通过 RTCPeerConnection 发送麦克风 AudioTrack
↓
Realtime API 执行 VAD、实时理解和 Speech-to-Speech
↓
浏览器接收 AI AudioTrack，并通过 DataChannel 接收字幕与事件
↓
用户插话时取消当前回复并截断未播放音频
↓
每轮最终转写写入 MySQL，触发结构化纠错
```

OpenAI 正式 API Key 只允许保存在服务端，浏览器只能获得短期客户端凭证。Realtime 主链路不依赖文件上传，也不把音频分片写入数据库。

默认只保存：

```text
用户最终转写
AI最终转写
会话时长
场景进度
纠错与学习记录
Realtime调用用量
```

默认不保存原始麦克风音频和 AI 输出音频。只有用户主动开启“保存录音”时，才把完整录音保存到 Cloudflare R2。

可选录音元数据包括：

```text
audioUrl
duration
format
fileSize
transcript
status
```

对象存储统一使用 Cloudflare R2，数据库只保存对象键和受控访问 URL。

音频路径示例：

```text
users/{userId}/conversations/{conversationId}/{messageId}.webm
```

------

## 2.21 权限边界

所有用户数据必须按照 `userId` 隔离。

用户只允许访问：

- 自己的会话
- 自己的消息
- 自己的错误记录
- 自己的收藏
- 自己的学习报告
- 自己的音频

公共数据：

- 公共场景
- 场景分类
- 系统角色
- 公共 Prompt 版本

管理员数据：

- 场景管理
- Prompt 管理
- 模型配置
- 内容审核
- 用户状态
- 系统日志

接口不能只根据资源 ID 查询。

错误示例：

```ts
prisma.conversation.findUnique({
  where: {
    id: conversationId,
  },
})
```

推荐方式：

```ts
prisma.conversation.findFirst({
  where: {
    id: conversationId,
    userId,
  },
})
```

------

## 2.22 日志与可观测性

AI 应用必须记录调用日志。

至少记录：

```text
requestId
userId
conversationId
sceneId
taskType
provider
model
promptVersion
inputTokens
outputTokens
latency
status
errorCode
createdAt
```

不能直接记录敏感信息和完整用户隐私。

生产环境需要重点监控：

- AI 请求成功率
- AI 平均响应时间
- 每日 Token 消耗
- 单用户成本
- 结构化输出失败率
- 对话接口错误率
- 场景完成率
- 提示使用率
- 用户中途退出率

推荐日志级别：

```text
DEBUG
INFO
WARN
ERROR
```

生产环境默认关闭 DEBUG。

------

## 2.23 错误处理架构

系统错误统一分为四类。

```text
业务错误
参数错误
外部服务错误
系统错误
```

推荐错误结构：

```ts
interface ApiErrorResponse {
  code: string
  message: string
  requestId: string
  details?: unknown
}
```

示例：

```json
{
  "code": "CONVERSATION_NOT_FOUND",
  "message": "当前练习不存在或无权访问。",
  "requestId": "req_10293"
}
```

常见错误码：

```text
UNAUTHORIZED
FORBIDDEN
INVALID_REQUEST
SCENE_NOT_FOUND
CONVERSATION_NOT_FOUND
CONVERSATION_COMPLETED
MESSAGE_TOO_LONG
AI_PROVIDER_ERROR
AI_OUTPUT_INVALID
RATE_LIMIT_EXCEEDED
AUDIO_UPLOAD_FAILED
STORAGE_ERROR
DATABASE_ERROR
```

AI 调用失败处理：

```text
第一次失败
→ 自动重试一次

结构化输出失败
→ 修复解析或重新请求

模型服务不可用
→ 切换备用模型

全部失败
→ 返回友好提示
```

前端提示不要显示：

```text
500 Internal Server Error
```

推荐显示：

```text
AI老师刚刚走神了，请重新发送一次。
```

------

## 2.24 扩展架构

当产品用户量增加后，可以按以下顺序演进。

### 阶段一：模块化单体

```text
Next.js
MySQL
对象存储
```

适用：

- MVP
- 个人使用
- 小规模内测
- 数百至数千用户

------

### 阶段二：增加缓存和任务队列

```text
Next.js
MySQL
Redis
BullMQ
对象存储
```

适用：

- 周报生成
- 分享图片生成
- 音频处理
- 用户量持续增长

------

### 阶段三：拆分 AI 服务

```text
Web Application
Business API
AI Service
Worker Service
MySQL
Redis
Object Storage
```

优先拆分 AI Service 的原因：

- AI 调用耗时较高
- AI Provider 可能频繁切换
- Prompt Engine 更新频繁
- 语音任务资源消耗较大
- AI 服务可以独立扩容

------

### 阶段四：领域服务化

```text
API Gateway
User Service
Scene Service
Conversation Service
Learning Service
AI Service
Media Service
Report Service
```

只有当以下情况出现时才考虑：

- 团队人数增加
- 各模块需要独立发布
- 单体部署出现瓶颈
- 用户量和调用量明显增长
- 不同模块需要不同扩容策略

不应为了技术复杂度而提前微服务化。

------

## 2.25 推荐部署拓扑

MVP 推荐：

```text
GitHub
  │
  ▼
Vercel
  │
  ├── Next.js Web
  ├── Route Handlers
  ├── Server Actions
  └── Realtime Session Endpoint
  │
  ├── 云 MySQL
  ├── Cloudflare R2
  └── OpenAI API（Realtime WebRTC + Text Model）
```

国内部署推荐：

```text
用户
 │
 ▼
腾讯云 CDN
 │
 ▼
Nginx
 │
 ▼
Next.js Node Service
 │
 ├── MySQL
 ├── Redis
 ├── COS
 └── AI Gateway
```

------

## 2.26 推荐项目目录

```text
ai-speaking-coach/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/
│   │   └── (dashboard)/
│   ├── api/
│   ├── layout.tsx
│   └── page.tsx
│
├── i18n/
│   ├── routing.ts
│   ├── request.ts
│   └── navigation.ts
│
├── messages/
│   ├── zh-CN.json
│   └── en.json
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── common/
│
├── features/
│   ├── auth/
│   ├── scenes/
│   ├── conversation/
│   ├── correction/
│   ├── hints/
│   ├── favorites/
│   ├── vocabulary/
│   ├── calendar/
│   ├── reports/
│   └── share/
│
├── services/
│   ├── auth/
│   ├── scene/
│   ├── conversation/
│   ├── learning/
│   └── report/
│
├── ai/
│   ├── providers/
│   ├── engines/
│   ├── prompts/
│   ├── schemas/
│   ├── parsers/
│   ├── memory/
│   ├── router/
│   └── logs/
│
├── repositories/
│   ├── user.repository.ts
│   ├── scene.repository.ts
│   ├── conversation.repository.ts
│   └── message.repository.ts
│
├── infrastructure/
│   ├── database/
│   ├── storage/
│   ├── cache/
│   ├── logger/
│   └── monitoring/
│
├── lib/
│   ├── auth/
│   ├── validation/
│   ├── errors/
│   └── utils/
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── public/
├── docs/
├── tests/
├── middleware.ts
├── next.config.ts
├── package.json
└── README.md
```

------

## 2.27 架构核心决策

### 决策一：使用 Next.js 全栈，而不是前后端完全分离

原因：

- MVP 开发速度更快
- 用户系统和页面集成方便
- 部署简单
- 适合个人开发
- 减少接口联调成本

未来仍可以拆分独立后端。

------

### 决策二：采用模块化单体，而不是微服务

原因：

- 当前业务规模不需要微服务
- 单体更容易调试和部署
- 可以通过代码分层保持边界
- 后期可以按模块拆分

------

### 决策三：AI Provider 必须抽象

原因：

- 模型名称可能更新
- 不同模型成本不同
- 不同任务需要不同模型
- 避免被单一供应商锁定

------

### 决策四：场景流程由状态机控制

原因：

- 防止 AI 跑题
- 保证场景可以完成
- 可以计算学习进度
- 可以判断用户掌握情况
- 可以生成结构化学习报告

------

### 决策五：对话和纠错逻辑分离

原因：

- 对话要求自然
- 纠错要求准确
- 两种任务 Prompt 目标不同
- 分离后更容易测试和迭代

MVP 可以在一次模型请求中完成，但代码结构仍需要保持分离。

------

### 决策六：长期记忆保存摘要，不保存无限上下文

原因：

- 控制 Token 成本
- 减少无效信息
- 提高 AI 响应稳定性
- 避免历史消息无限增长

------

### 决策七：实时语音作为 MVP P0 能力

原因：

- 产品核心价值是让用户真正开口，而不是只进行文字聊天
- 浏览器端使用 WebRTC，降低音频经过应用服务器产生的延迟
- Realtime 模型负责自然 Speech-to-Speech，文本模型负责结构化纠错
- MVP 支持 VAD、实时字幕、AI语音流和用户打断
- 发音评分、多人通话和长期录音保存仍放在后续版本

------

## 2.28 本章总结

AI Speaking Coach 第一阶段采用：

```text
Next.js 模块化单体
+
MySQL
+
Prisma
+
WebRTC Realtime
+
AI Provider 抽象
+
场景状态机
+
Prompt Engine
+
学习数据闭环
```

系统最核心的架构不是聊天页面，而是以下六个部分：

```text
Scene Engine
Conversation Engine
Correction Engine
Hint Engine
Memory Engine
State Engine
```

其中：

```text
Scene Engine
```

决定练什么。

```text
Conversation Engine
```

决定 AI 怎么说。

```text
Correction Engine
```

决定用户哪里需要改进。

```text
Hint Engine
```

决定用户不会表达时如何获得帮助。

```text
State Engine
```

决定场景如何向前推进。

```text
Memory Engine
```

决定 AI 如何逐渐了解用户。

最终系统形成完整数据闭环：

```text
选择场景
↓
进行表达
↓
AI对话
↓
错误纠正
↓
提示辅助
↓
场景完成
↓
学习总结
↓
数据沉淀
↓
个性化推荐
↓
再次练习
```
