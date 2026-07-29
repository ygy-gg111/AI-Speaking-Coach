# 6. 数据库设计与 Prisma Schema

## 6.1 本章目标

本章设计 AI Speaking Coach 的数据库架构。

目标：

```text
用户可以注册登录
+
用户可以练习场景
+
保存完整对话历史
+
记录错误
+
记录不会的表达
+
收藏场景
+
生成学习报告
+
生成打卡日历
+
支持小红书分享
+
支持 AI 调用分析
```

数据库设计需要满足：

1. MVP 可以快速开发。
2. 后期支持 AI 能力扩展。
3. 支持数据分析。
4. 支持用户长期学习画像。
5. 支持场景版本迭代。
6. 支持商业化扩展。

------

# 6.2 数据库选型

## 推荐方案

### PostgreSQL + Prisma

架构：

```text
Next.js
   |
   |
Prisma ORM
   |
   |
PostgreSQL
```

原因：

### 1. 关系模型适合学习系统

本项目存在大量关系：

```text
User
 |
Conversation
 |
Message
 |
Correction
 |
Vocabulary
```

关系数据库更适合。

------

### 2. JSON 支持优秀

AI 输出结构复杂。

例如：

```json
{
  "errors":[
    {
      "type":"grammar",
      "reason":"..."
    }
  ]
}
```

PostgreSQL JSONB 可以保存。

------

### 3. Prisma 开发效率高

支持：

- TypeScript 类型提示。
- Migration。
- Schema 管理。
- 自动生成 Client。

------

# 6.3 数据库整体架构

数据库分为几个领域：

```text
database

├── User Domain
│
├── Scene Domain
│
├── Practice Domain
│
├── Learning Domain
│
├── Content Domain
│
├── AI Domain
│
└── System Domain
```

------

# 6.4 完整 ER 关系

```text
User

 |
 |--- UserProfile
 |
 |--- Conversation
 |          |
 |          |--- Message
 |          |
 |          |--- ConversationStepState
 |
 |--- FavoriteScene
 |
 |--- VocabularyRecord
 |
 |--- CorrectionRecord
 |
 |--- CheckinRecord
 |
 |--- LearningReport


SceneCategory

 |
 |--- Scene

          |
          |
          |--- SceneVersion

                    |
                    |
                    |--- SceneRole
                    |
                    |--- SceneStep
                    |
                    |--- SceneExpression


AIRequestLog

PromptTemplate

AudioRecord

RealtimeSession

AnalysisJob
```

------

# 6.5 用户体系设计

用户体系包含：

```text
User
UserProfile
UserSetting
```

------

# 6.6 User 表

用户基础信息。

```prisma
model User {

  id String @id @default(cuid())

  email String @unique

  passwordHash String?

  nickname String?

  avatar String?

  status UserStatus @default(ACTIVE)

  createdAt DateTime @default(now())

  updatedAt DateTime @updatedAt


  profile UserProfile?

  conversations Conversation[]

  favorites FavoriteScene[]

  vocabularyRecords VocabularyRecord[]

  corrections CorrectionRecord[]

  checkins CheckinRecord[]

  reports LearningReport[]

  audioRecords AudioRecord[]

  realtimeSessions RealtimeSession[]

  analysisJobs AnalysisJob[]

}
```

------

状态：

```prisma
enum UserStatus {

  ACTIVE

  DISABLED

  DELETED

}
```

------

# 6.7 UserProfile

用户学习画像。

不要全部放 User。

原因：

用户基础信息和学习数据生命周期不同。

------

```prisma
model UserProfile {

  id String @id @default(cuid())


  userId String @unique


  user User @relation(
    fields:[userId],
    references:[id]
  )


  englishLevel EnglishLevel


  learningGoal String?


  targetScenes Json?


  strengths Json?


  weaknesses Json?


  frequentMistakes Json?


  preferredDifficulty String?

  uiLocale String @default("zh-CN")

  explanationLocale String @default("zh-CN")

  timeZone String @default("Asia/Shanghai")


  totalPracticeMinutes Int @default(0)


  totalConversationCount Int @default(0)


  createdAt DateTime @default(now())


  updatedAt DateTime @updatedAt

}
```

------

英语等级：

```prisma
enum EnglishLevel {

 A1

 A2

 B1

 B2

 C1

}
```

------

示例：

```json
{
 "frequentMistakes":[
    {
      "type":"preposition",
      "example":"go Japan",
      "count":8
    }
 ]
}
```

------

# 6.8 Scene 领域设计

核心：

```text
Scene
SceneVersion
SceneStep
```

------

# 6.9 SceneCategory

```prisma
model SceneCategory {


 id String @id @default(cuid())


 code String @unique


 name String


 description String?


 icon String?


 sortOrder Int @default(0)


 isActive Boolean @default(true)


 scenes Scene[]


 createdAt DateTime @default(now())

}
```

------

示例：

```text
TRAVEL

旅行英语
```

------

# 6.10 Scene

场景主表。

注意：

Scene 不保存具体步骤。

步骤属于版本。

------

```prisma
model Scene {


 id String @id @default(cuid())


 categoryId String


 category SceneCategory @relation(
 fields:[categoryId],
 references:[id]
 )


 code String @unique


 slug String @unique


 name String


 nameEn String


 summary String


 coverImage String?


 difficulty EnglishLevel


 estimatedMinutes Int


 status SceneStatus
 @default(DRAFT)


 currentVersionId String?


 versions SceneVersion[]


 favorites FavoriteScene[]


 conversations Conversation[]


 createdAt DateTime @default(now())


 updatedAt DateTime @updatedAt

}
```

------

状态：

```prisma
enum SceneStatus {

 DRAFT

 PUBLISHED

 ARCHIVED

}
```

------

# 6.11 SceneVersion

场景版本。

核心设计：

```text
一个场景
可以有多个版本
```

例如：

```text
机场值机 v1

机场值机 v2
```

------

```prisma
model SceneVersion {


 id String @id @default(cuid())


 sceneId String


 scene Scene @relation(
 fields:[sceneId],
 references:[id]
 )


 version Int


 status SceneVersionStatus


 title String


 background String


 learningObjectives Json


 minTurns Int


 maxTurns Int


 promptVersion String


 roles SceneRole[]


 steps SceneStep[]


 expressions SceneExpression[]


 conversations Conversation[]


 createdAt DateTime @default(now())


 publishedAt DateTime?


 @@unique([sceneId, version])


}
```

------

版本状态：

```prisma
enum SceneVersionStatus {


 DRAFT


 TESTING


 PUBLISHED


 ARCHIVED


}
```

------

`@@unique([sceneId, version])` 必须位于 `SceneVersion` 模型内部，保证同一场景版本号唯一。

------

# 6.12 SceneRole

AI 角色。

------

```prisma
model SceneRole {


 id String @id @default(cuid())


 sceneVersionId String


 sceneVersion SceneVersion @relation(
 fields:[sceneVersionId],
 references:[id]
 )


 roleType RoleType


 name String


 displayName String


 description String


 personality String


 speakingStyle String


 tone String


 openingMessage String?


 voiceId String?


}
```

------

```prisma
enum RoleType {

 AI

 USER

 SECONDARY_AI

}
```

------

# 6.13 SceneStep

场景步骤。

------

```prisma
model SceneStep {


 id String @id @default(cuid())


 sceneVersionId String


 sceneVersion SceneVersion @relation(
 fields:[sceneVersionId],
 references:[id]
 )


 code String


 order Int


 name String


 description String


 goal String


 aiInstruction String


 userTask String


 successConditions Json


 maxAttempts Int @default(3)


 allowSkip Boolean @default(false)


 isRequired Boolean @default(true)


 transitionMode TransitionMode


 hints SceneStepHint[]


 expressions SceneExpression[]


 states ConversationStepState[]


}
```

------

```prisma
enum TransitionMode {

 SEQUENTIAL

 CONDITIONAL

}
```

------

# 6.14 SceneStepHint

三级提示。

------

```prisma
model SceneStepHint {


 id String @id @default(cuid())


 sceneStepId String


 sceneStep SceneStep @relation(
 fields:[sceneStepId],
 references:[id]
 )


 level Int


 type HintType


 content String


 explanation String?


 isDynamic Boolean @default(false)

}
```

------

```prisma
enum HintType {


 KEYWORDS


 PATTERN


 FULL_SENTENCE

}
```

------

# 6.15 SceneExpression

场景表达库。

------

```prisma
model SceneExpression {


 id String @id @default(cuid())


 sceneVersionId String


 sceneVersion SceneVersion @relation(
 fields:[sceneVersionId],
 references:[id]
 )


 sceneStepId String?


 sceneStep SceneStep? @relation(
 fields:[sceneStepId],
 references:[id]
 )


 text String


 meaning String


 type ExpressionType


 level EnglishLevel


 isCore Boolean @default(false)


 example String?


 audioUrl String?

}
```

------

类型：

```prisma
enum ExpressionType {


 WORD


 PHRASE


 SENTENCE_PATTERN


 FULL_SENTENCE

}
```

------

# 6.16 练习领域设计

核心：

```text
Conversation

Message

ConversationStepState
```

------

# 6.17 Conversation

一次练习。

------

```prisma
model Conversation {


 id String @id @default(cuid())


 userId String


 user User @relation(
 fields:[userId],
 references:[id]
 )


 sceneId String


 scene Scene @relation(
 fields:[sceneId],
 references:[id]
 )


 sceneVersionId String


 sceneVersion SceneVersion @relation(
 fields:[sceneVersionId],
 references:[id]
 )


 currentStepId String?


 status ConversationStatus


 turnCount Int @default(0)


 hintCount Int @default(0)


 correctionCount Int @default(0)


 completionRate Float @default(0)


 durationSeconds Int @default(0)


 messages Message[]


 stepStates ConversationStepState[]

 checkins CheckinRecord[]

 realtimeSessions RealtimeSession[]

 analysisJobs AnalysisJob[]


 startedAt DateTime @default(now())


 completedAt DateTime?


 lastActiveAt DateTime @updatedAt

}
```

------

状态：

```prisma
enum ConversationStatus {


 INITIALIZING


 ACTIVE


 PAUSED


 COMPLETED


 ABANDONED


 FAILED

}
```

------

# 6.18 Message

对话消息。

------

```prisma
model Message {


 id String @id @default(cuid())


 conversationId String


 conversation Conversation @relation(
 fields:[conversationId],
 references:[id]
 )


 role MessageRole


 content String


 source MessageSource @default(TEXT)


 isFinalTranscript Boolean @default(true)


 audioUrl String?


 tokens Int?


 createdAt DateTime @default(now())


 corrections CorrectionRecord[]

 analysisJobs AnalysisJob[]


 }
```

```prisma
enum MessageSource {

 TEXT

 REALTIME_AUDIO

 FILE_AUDIO

}
```

------

角色：

```prisma
enum MessageRole {


 USER


 ASSISTANT


 SYSTEM

}
```

------

示例：

```text
USER

I want go Japan.


ASSISTANT

Great. Which city are you flying to?
```

------

# 6.19 ConversationStepState

步骤状态。

------

```prisma
model ConversationStepState {


 id String @id @default(cuid())


 conversationId String


 conversation Conversation @relation(
 fields:[conversationId],
 references:[id]
 )


 sceneStepId String


 sceneStep SceneStep @relation(
 fields:[sceneStepId],
 references:[id]
 )


 status StepStatus


 attemptCount Int @default(0)


 hintLevel Int @default(0)


 score Float?


 aiConfidence Float?


 completedAt DateTime?

}
```

------

```prisma
enum StepStatus {


 LOCKED


 ACTIVE


 COMPLETED


 SKIPPED


 FAILED

}
```

------

# 6.20 学习数据设计

包括：

```text
错误
词汇
收藏
打卡
报告
```

------

# 6.21 CorrectionRecord

用户错误记录。

------

```prisma
model CorrectionRecord {


 id String @id @default(cuid())


 userId String


 user User @relation(
 fields:[userId],
 references:[id]
 )


 messageId String


 message Message @relation(
 fields:[messageId],
 references:[id]
 )


 original String


 corrected String


 naturalExpression String?


 type CorrectionType


 severity SeverityLevel


 reason String


 createdAt DateTime @default(now())

}
```

------

# 6.22 VocabularyRecord

用户学习词汇。

------

```prisma
model VocabularyRecord {


 id String @id @default(cuid())


 userId String


 user User @relation(
 fields:[userId],
 references:[id]
 )


 text String


 meaning String


 example String?


 type ExpressionType


 source String?


 mastery Int @default(0)


 reviewCount Int @default(0)


 lastReviewedAt DateTime?


 createdAt DateTime @default(now())


 }
```

------

掌握度：

```text
0-100
```

------

# 6.23 FavoriteScene

收藏场景。

------

```prisma
model FavoriteScene {


 id String @id @default(cuid())


 userId String


 user User @relation(
 fields:[userId],
 references:[id]
 )


 sceneId String


 scene Scene @relation(
 fields:[sceneId],
 references:[id]
 )


 createdAt DateTime @default(now())


 @@unique([
 userId,
 sceneId
 ])

}
```

------

# 6.24 CheckinRecord

打卡日历。

对应小红书记录功能。

------

```prisma
model CheckinRecord {


 id String @id @default(cuid())


 userId String


 user User @relation(
 fields:[userId],
 references:[id]
 )


 conversationId String?


 conversation Conversation? @relation(
 fields:[conversationId],
 references:[id]
 )


 date DateTime


 title String


 content String


 imageUrl String?


 shareStatus ShareStatus


 createdAt DateTime @default(now())

 @@unique([userId, date])

 }
```

`date` 保存用户所属时区归一化后的学习日零点。写入打卡记录时必须使用 upsert，避免同一天重复打卡。

------

状态：

```prisma
enum ShareStatus {

 NOT_SHARED

 SHARED

}
```

------

示例：

```text
2026-07-28

今天完成机场英语练习。

学习表达：

I'd like to check in.
```

------

# 6.25 LearningReport

学习总结。

------

```prisma
model LearningReport {


 id String @id @default(cuid())


 userId String


 user User @relation(
 fields:[userId],
 references:[id]
 )


 conversationId String


 summary String


 strengths Json


 improvements Json


 expressions Json


 score Float?


 createdAt DateTime @default(now())

}
```

------

# 6.26 AudioRecord

语音数据。

------

```prisma
model AudioRecord {


 id String @id @default(cuid())


 userId String


 user User @relation(
 fields:[userId],
 references:[id]
 )


 messageId String?
 message Message? @relation(fields:[messageId], references:[id])


 objectKey String


 mimeType String


 fileSize Int


 duration Float


 transcript String?


 pronunciationScore Float?


 status AudioStatus @default(UPLOADED)


 errorMessage String?


 deletedAt DateTime?


 createdAt DateTime @default(now())

}
```

Realtime MVP 默认不创建 `AudioRecord`，只保存最终字幕。只有用户主动开启“保存录音”时才写入对象存储并创建记录。

```prisma
enum AudioStatus {

 UPLOADED

 PROCESSING

 READY

 FAILED

 DELETED

}
```

------

# 6.27 AI 系统表

包括：

```text
Prompt

AI调用日志

模型配置
```

------

# 6.28 PromptTemplate

------

```prisma
model PromptTemplate {


 id String @id @default(cuid())


 name String


 version String


 taskType String


 content String


 status PromptStatus


 createdAt DateTime @default(now())


 @@unique([name, version])


}
```

```prisma
enum PromptStatus {

 DRAFT

 ACTIVE

 ARCHIVED

}
```

MVP 的 Prompt 以代码文件和 Git 版本为准，`PromptTemplate` 作为后续管理后台能力保留，不是首发阻塞项。

------

# 6.29 AIRequestLog

------

```prisma
model AIRequestLog {


 id String @id @default(cuid())


 userId String?


 taskType String


 provider String


 model String


 promptVersion String


 inputTokens Int


 outputTokens Int


 latencyMs Int


 status AIRequestStatus


 errorMessage String?


 createdAt DateTime @default(now())

}
```

------

状态：

```prisma
enum AIRequestStatus {


 SUCCESS


 FAILED


 FALLBACK

}
```

------

# 6.30 RealtimeSession

`RealtimeSession` 只保存实时会话的业务元数据，不保存临时客户端凭证、WebRTC SDP 或音频分片。

```prisma
model RealtimeSession {
 id String @id @default(cuid())

 userId String
 user User @relation(fields:[userId], references:[id])

 conversationId String
 conversation Conversation @relation(fields:[conversationId], references:[id])

 provider String
 model String
 status RealtimeSessionStatus @default(CREATING)

 startedAt DateTime @default(now())
 connectedAt DateTime?
 endedAt DateTime?
 lastEventAt DateTime?

 inputAudioSeconds Int @default(0)
 outputAudioSeconds Int @default(0)
 disconnectReason String?

 @@index([userId, status])
 @@index([conversationId, startedAt])
}

enum RealtimeSessionStatus {
 CREATING
 CONNECTED
 RECONNECTING
 ENDED
 FAILED
}
```

------

# 6.31 AnalysisJob

MVP 不使用 Redis/BullMQ。最终字幕的纠错、总结和学习数据处理使用 PostgreSQL 任务表。

```prisma
model AnalysisJob {
 id String @id @default(cuid())

 userId String
 user User @relation(fields:[userId], references:[id])

 conversationId String
 conversation Conversation @relation(fields:[conversationId], references:[id])

 messageId String?
 type AnalysisJobType
 status AnalysisJobStatus @default(PENDING)
 attempts Int @default(0)
 availableAt DateTime @default(now())
 lockedAt DateTime?
 lastError String?
 createdAt DateTime @default(now())
 completedAt DateTime?

 @@index([status, availableAt])
 @@index([conversationId, createdAt])
}

enum AnalysisJobType {
 CORRECTION
 STEP_REVIEW
 SUMMARY
 MEMORY_UPDATE
}

enum AnalysisJobStatus {
 PENDING
 PROCESSING
 COMPLETED
 FAILED
}
```

------

# 6.32 Prisma 索引设计

重点查询：

下列 `@@index` 是设计摘要，实际 `schema.prisma` 中必须分别写入对应的 `Conversation`、`Scene`、`Message` 和 `AIRequestLog` 模型内部，不能作为模型外的独立语句。

## 用户历史练习

```prisma
@@index([
 userId,
 createdAt
])
```

------

## 场景查询

```prisma
@@index([
 categoryId,
 status
])
```

------

## 消息查询

```prisma
@@index([
 conversationId,
 createdAt
])
```

------

## AI日志统计

```prisma
@@index([
 taskType,
 createdAt
])
```

------

# 6.33 数据生命周期设计

## 消息

长期保存。

用途：

- 历史回顾。
- AI复盘。
- 数据分析。

------

## AI日志

保存周期：

```text
30-180天
```

根据成本调整。

------

## 音频

建议：

```text
默认不保存 Realtime 原始音频

用户主动保存录音时写入 Cloudflare R2

数据库保存 objectKey 与元数据
```

音频对象必须设置访问控制、生命周期清理和账号删除联动。

------

## Prompt

永久保存。

因为：

```text
历史效果分析需要知道当时使用哪个Prompt
```

------

# 6.34 MVP 数据库最小版本

如果第一版快速上线。

只需要：

```text
User

Scene

SceneVersion

SceneStep

Conversation

RealtimeSession

Message

AnalysisJob

CorrectionRecord

VocabularyRecord

CheckinRecord
```

即可。

------

# 6.35 后续扩展

增加：

```text
Subscription

Payment

Achievement

Leaderboard

Community

TeacherReview

CustomScene

VoiceConversation

PronunciationAssessment
```

------

# 6.36 数据库架构总结

最终数据库：

```text
User
 |
 |
 +-- Profile
 |
 +-- Conversation
       |
       +-- Message
       |
       +-- StepState
       |
       +-- Correction
       |
       +-- Report


Scene
 |
 +-- Version
       |
       +-- Role
       |
       +-- Step
       |
       +-- Hint
       |
       +-- Expression


AI
 |
 +-- Prompt
 |
 +-- RequestLog


Learning
 |
 +-- Vocabulary
 |
 +-- Favorite
 |
 +-- Checkin
```

------

# 6.37 本章核心决策

## 决策1

场景必须版本化。

原因：

保证历史数据一致。

------

## 决策2

对话必须保存。

原因：

AI 学习系统核心资产就是用户行为数据。

------

## 决策3

错误和词汇独立存储。

原因：

未来需要：

- 复习。
- 推荐。
- 薄弱点分析。

------

## 决策4

AI 输出不要全部塞 JSON 字段。

原因：

关系数据和 AI 数据分离。

------

## 决策5

第一版不要设计复杂积分体系。

先验证：

```text
用户是否愿意每天练习
```

------

# 6.38 下一章预告

下一章：

# 第七章：后端系统设计与 API 架构

内容：

- Next.js 全栈架构
- Controller / Service / Repository 分层
- API 路由设计
- 登录认证
- JWT / Session
- 场景接口
- 对话接口
- AI 调用接口
- 文件上传接口
- 音频处理流程
- WebSocket / SSE 流式回复
- 错误码设计
- 权限设计

进入真正开发阶段。
