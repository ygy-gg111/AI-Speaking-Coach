# 8. 前端架构设计与页面实现方案

------

# 8.1 本章目标

设计 AI Speaking Coach 前端系统。

目标：

```text
PC端优秀体验
+
移动端正常使用
+
响应式布局
+
AI实时交互
+
语音输入
+
学习数据展示
+
打卡分享
+
中英文国际化
```

产品定位：

不是简单聊天页面。

而是：

```text
学习工作台
+
AI陪练空间
+
个人成长记录
```

------

# 8.2 前端技术选型

推荐：

```text
Next.js 15

+

React 19

+

TypeScript

+

Ant Design

+

@ant-design/nextjs-registry

+

next-intl

+

CSS Modules / Ant Design Design Token

+

Zustand

+

React Query

+

Framer Motion
```

Ant Design 是本项目唯一的基础组件库。按钮、表单、弹窗、导航、表格、反馈和主题 Token 优先使用 Ant Design，不再引入 Shadcn/UI。

App Router 根布局必须使用 `@ant-design/nextjs-registry` 的 `AntdRegistry` 收集首屏样式，避免 SSR 样式闪烁。全局主题、组件 Locale 和弹层容器统一通过 `ConfigProvider` 管理。

------

## 为什么不用纯 Vue？

不是 Vue 不好。

而是：

当前项目特点：

```text
AI交互多

SEO需要

个人产品

快速迭代

组件生态
```

Next.js 更适合：

- AI SaaS
- 国际化产品
- Web App

------

# 8.3 前端整体架构

```text
Browser

↓

Next.js App Router

↓

Page Layer

↓

Feature Layer

↓

Component Layer

↓

Service Layer

↓

API Client

↓

Backend
```

------

# 8.4 项目目录设计

推荐：

```text
src/

├── app/

│
│   ├── page.tsx
│
│   ├── login/
│
│   ├── practice/
│
│   ├── scenes/
│
│   ├── vocabulary/
│
│   ├── calendar/
│
│   └── profile/


├── components/

│
│   ├── ui/
│
│   ├── layout/
│
│   ├── chat/
│
│   ├── audio/
│
│   ├── scene/
│
│   └── learning/


├── features/


│
│   ├── auth/
│
│   ├── conversation/
│
│   ├── scene/
│
│   ├── vocabulary/
│
│   └── checkin/


├── hooks/


├── stores/


├── services/


├── types/


└── utils/
```

------

# 8.5 页面信息架构

整体：

```text
首页

├── 场景中心

├── 开始练习

├── 我的学习

│
├── 单词本

├── 错误记录

├── 打卡日历

└── 个人中心
```

------

# 8.6 PC端布局设计

PC 不采用移动端放大。

采用：

```text
Dashboard布局
```

------

结构：

```text
------------------------------------------------

Header

------------------------------------------------

Sidebar      Main Content

菜单          内容区域


------------------------------------------------
```

------

左侧菜单：

```text
🏠 首页

🎧 场景练习

📚 我的词库

⭐ 收藏场景

📅 学习日历

📊 学习报告

⚙ 设置
```

------

# 8.7 移动端布局设计

移动端：

```text
Bottom Navigation
```

底部：

```text
首页

练习

收藏

学习

我的
```

------

响应：

PC：

```text
Sidebar
```

移动：

```text
Bottom Tab
```

------

实现：

```tsx
<ResponsiveLayout>

 <DesktopSidebar/>

 <MobileBottomNav/>

 <Main/>

</ResponsiveLayout>
```

------

# 8.8 页面路由设计

App Router：

```text
app/


├── page.tsx


├── auth/

│
├── login

│
└── register



├── scenes/

│
├── page.tsx

│
└── [id]/


├── practice/


│
└── [conversationId]/



├── vocabulary/


├── calendar/


├── reports/


└── profile/
```

------

# 8.9 首页设计

目标：

让用户快速开始学习。

------

页面结构：

```text
欢迎区域


今天学习目标


----------------


继续上次练习


----------------


推荐场景


----------------


学习数据
```

------

示例：

```text
Good evening, Tom.

今天练习 10 分钟了吗？

继续：

机场值机

进度 60%

[继续练习]


推荐：

酒店入住

程序员会议英语
```

------

# 8.10 场景中心页面

核心：

发现学习内容。

布局：

```text
分类导航


旅行

工作

生活

面试


----------------


场景卡片
```

------

场景卡：

```text
-----------------

图片


机场值机

Airport Check-in


难度 A2

8分钟


⭐收藏


开始练习

-----------------
```

------

组件：

```tsx
<SceneCard/>

 props:

 scene

 onStart

 onFavorite

/>
```

------

# 8.11 场景详情页

展示：

```text
场景介绍

学习目标

预计时间

核心表达

示例对话

开始按钮
```

------

注意：

不要展示：

```text
AI Prompt

成功条件

内部规则
```

------

页面：

```text
机场值机

你将学习：

✓ 表达目的地

✓ 出示护照

✓ 描述行李


核心表达：

"I'm flying to Tokyo."


[开始练习]
```

------

# 8.12 核心页面：AI练习页面

这是产品最重要页面。

目标：

模拟真人交流。

------

布局：

PC：

```text
---------------------------------

角色信息


AI头像


机场工作人员


---------------------------------

聊天区域



AI:

Good morning...


User:

I'm flying to Tokyo.


---------------------------------


输入区域


实时通话与麦克风按钮

提示按钮

发送


---------------------------------
```

------

移动：

```text
全屏聊天

底部输入
```

------

# 8.13 Conversation页面组件

拆分：

```text
ConversationPage


├── SceneHeader


├── ProgressBar


├── MessageList


├── MessageItem


├── CorrectionPanel


├── HintPanel


├── VoiceRecorder


└── InputBox
```

------

# 8.14 Message组件设计

支持：

AI：

```text
左侧气泡
```

用户：

```text
右侧气泡
```

------

数据：

```ts
interface Message {


 id:string


 role:
 'USER'
 |
 'ASSISTANT'


 content:string


 audioUrl?:string


 correction?:Correction

}
```

------

显示：

用户：

```text
I want go Japan.
```

下面：

```text
建议：

I want to go to Japan.
```

------

# 8.15 Realtime 音频与字幕

实时语音模式不使用 SSE 传输音频。浏览器通过 WebRTC AudioTrack 发送麦克风音频并播放 AI 音频，通过 DataChannel 接收字幕、VAD、响应生命周期和错误事件。

```text
RTCPeerConnection
├── Local AudioTrack：用户麦克风
├── Remote AudioTrack：AI语音
└── DataChannel：字幕与控制事件
```

文字降级模式仍可使用 SSE 流式显示文本；异步纠错卡片也可以通过轮询或 SSE 更新。

------

# 8.16 输入组件

支持：

```text
文字输入

语音输入

播放示范
```

------

组件：

```tsx
<RealtimeConversationControls/>


├── TextInput

├── RealtimeCallButton

├── MicrophoneButton

├── LiveTranscript

├── SendButton
```

------

# 8.17 实时语音组件设计

功能：

- 创建和关闭 Realtime 会话
- 获取麦克风权限
- 建立 RTCPeerConnection
- 播放远端 AI AudioTrack
- 展示用户与 AI 的增量字幕
- 处理 VAD、用户打断、取消和重连
- 失败时降级到文字模式

组件：

```tsx
<RealtimeVoiceSession/>
```

状态：

```text
IDLE

REQUESTING_PERMISSION

CONNECTING

LISTENING

USER_SPEAKING

AI_SPEAKING

INTERRUPTING

RECONNECTING

CLOSED

ERROR
```

------

# 8.18 浏览器 WebRTC 实现

使用：

```javascript
getUserMedia
RTCPeerConnection
RTCDataChannel
```

流程：

```text
点击开始实时练习

↓

请求麦克风权限

↓

创建 RTCPeerConnection

↓

添加本地麦克风 AudioTrack

↓

设置远端 AI AudioTrack 自动播放

↓

建立 DataChannel 并监听字幕、VAD、打断和错误事件

↓

创建并设置本地 SDP offer

↓

将 SDP offer 发送到服务端 Session Endpoint

↓

使用服务端返回的 SDP answer 完成连接
```

------

代码：

```ts
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
})

const pc = new RTCPeerConnection()
pc.addTrack(stream.getAudioTracks()[0], stream)

pc.ontrack = event => {
  audioElement.srcObject = event.streams[0]
}

const events = pc.createDataChannel("oai-events")

const offer = await pc.createOffer()
await pc.setLocalDescription(offer)

const response = await fetch(
  `/api/v1/realtime/session?${new URLSearchParams({
    conversationId,
    sceneName,
    level,
  })}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/sdp" },
    body: offer.sdp,
  },
)

await pc.setRemoteDescription({
  type: "answer",
  sdp: await response.text(),
})
```

组件卸载、结束练习或登录失效时，必须停止本地音轨、关闭 DataChannel 和 PeerConnection，并通知后端结束 `RealtimeSession`。

------

# 8.19 提示组件

三级提示：

```text
💡 提示
```

点击：

第一次：

```text
关键词：

passport
here
```

第二次：

```text
句型：

Here is my...
```

第三次：

```text
完整：

Here is my passport.
```

------

组件：

```tsx
<HintPanel
 level={1}
/>
```

------

# 8.20 纠错展示设计

不要打击用户。

错误：

❌

正确：

✅

示例：

```text
你的表达：

I want go Japan.


更自然：

I want to go to Japan.


原因：

go 后面通常需要 to。
```

------

# 8.21 学习中心页面

包含：

```text
我的词汇

错误记录

收藏表达

复习计划
```

------

布局：

```text
学习统计


今日：

新增词汇 5


待复习：

12


----------------


薄弱表达
```

------

# 8.22 单词本页面

功能：

- 查看。
- 播放。
- 收藏。
- 标记掌握。

卡片：

```text
check in


办理登记


🔊


例句：

I'd like to check in.
```

------

# 8.23 错误记录页面

展示：

```text
你的常见错误
```

例如：

```text
错误：

I want go


出现次数：

8


建议：

I want to...
```

------

# 8.24 收藏场景页面

用户收藏：

```text
机场

酒店

程序员会议

面试
```

支持：

```text
重新练习

复听

查看记录
```

------

# 8.25 学习日历页面

对应小红书打卡。

类似：

GitHub Contribution。

展示：

```text
2026 July


Mon Tue Wed


🟩🟩⬜🟩
```

------

点击日期：

显示：

```text
7月28日


完成：

机场值机


学习：

10分钟


新增表达：

3个


分享
```

------

# 8.26 小红书分享页面

目标：

自动生成：

```text
学习打卡图片
```

------

内容：

```text
Day 30


今天练习：

机场英语


学习表达：

I'd like to check in.


坚持记录。
```

------

生成：

```text
图片模板

+
用户数据
```

------

# 8.27 状态管理设计

推荐：

Zustand。

全局：

```text
user

token

theme

conversation

audioState
```

------

示例：

```ts
const useConversationStore
=
create(
(set)=>({

messages:[],

addMessage:
(msg)=>set()

})
)
```

------

# 8.28 服务请求层

使用：

React Query。

例如：

```ts
useScenes()

useConversation()

useVocabulary()
```

------

优势：

自动：

- 缓存。
- 更新。
- Loading。
- Retry。

------

# 8.29 前端 API 封装

结构：

```text
services/

├── auth.ts

├── scene.ts

├── conversation.ts

├── learning.ts

└── upload.ts
```

------

示例：

```ts
export function sendMessage(
id:string,
content:string
){

return api.post(
`/conversation/${id}/messages`,
{
content
})

}
```

------

# 8.30 UI设计规范

风格：

```text
现代AI学习工具
+
轻量教育产品
```

------

颜色：

主色：

```text
蓝紫渐变
```

辅助：

```text
绿色
学习完成

橙色
提示

红色
错误
```

------

圆角：

```text
12px-20px
```

------

阴影：

轻量。

不要做后台系统感。

------

# 8.31 动画设计

使用：

Framer Motion。

适合：

AI消息出现：

```text
fade + slide
```

完成步骤：

```text
success animation
```

提示展开：

```text
height transition
```

------

# 8.32 性能优化

重点：

## 对话页面

避免：

全部消息重新渲染。

方案：

```text
React.memo

virtual list
```

------

## 音频

懒加载：

```text
点击播放才加载
```

------

## 图片

Next Image。

------

# 8.33 SEO设计

公开页面：

支持：

```text
场景介绍

学习文章

英语教程
```

使用：

```tsx
generateMetadata()
```

------

# 8.34 国际化设计

国际化属于 MVP 基础能力，使用 `next-intl`。

首发支持：

```text
zh-CN
en
```

后续可增加 `ja` 等 Locale，但禁止把日文 Locale 错写成 `jp`。

结构：

```text
src/
├── app/
│   └── [locale]/
├── i18n/
│   ├── routing.ts
│   ├── request.ts
│   └── navigation.ts
└── messages/
    ├── zh-CN.json
    └── en.json
```

根 Provider 结构：

```tsx
<AntdRegistry>
  <NextIntlClientProvider>
    <ConfigProvider locale={antdLocale} theme={appTheme}>
      {children}
    </ConfigProvider>
  </NextIntlClientProvider>
</AntdRegistry>
```

规则：

- 所有用户可见文案使用翻译 Key，禁止在组件中硬编码。
- Ant Design Locale、`next-intl` Locale 和日期库 Locale 必须同步。
- 日期、时间、数字、复数和相对时间使用 `next-intl` 格式化。
- 表单校验和 API 错误通过稳定的 `messageKey` 翻译。
- 公开页面使用 Locale 路由，并生成正确的 canonical 与 `hreflang`。
- 登录用户切换语言后同步更新 Cookie 和 `UserProfile.uiLocale`。
- AI 练习语言与 UI Locale 分离；切换中文界面不能让 AI 角色自动改说中文。

官方接入参考：

- [Ant Design 在 Next.js App Router 中使用](https://ant.design/docs/react/use-with-next-cn/)
- [next-intl](https://next-intl.dev/)

------

# 8.35 前端测试

单元：

```text
Vitest
```

组件：

```text
Testing Library
```

E2E：

```text
Playwright
```

重点：

测试：

- 登录。
- 开始练习。
- 对话。
- 提示。
- 完成。
- 打卡。

------

# 8.36 MVP 页面优先级

第一阶段：

必须：

```text
登录

场景列表

场景详情

AI练习页

WebRTC实时语音

实时字幕、VAD与打断

历史记录

学习日历
```

------

第二阶段：

增加：

```text
收藏

单词本

错误分析
```

------

第三阶段：

增加：

```text
AI老师形象

自定义场景
```

------

# 8.37 前端架构总结

最终：

```text
Next.js

↓

App Router

↓

next-intl / AntdRegistry / ConfigProvider

↓

Feature Module

↓

Component

↓

Hooks

↓

Service

↓

API

↓

Backend
```

核心页面：

```text
场景中心

↓

AI练习

↓

学习总结

↓

日历打卡

↓

长期成长
```

------

# 8.38 下一章预告

下一章：

# 08-Deployment.md：部署架构设计

内容：

- Vercel 部署
- Supabase PostgreSQL
- Realtime Session Endpoint
- WebRTC 生产环境要求
- Cloudflare R2
- 环境变量与密钥
- 语音成本保护
- 日志、监控和发布检查

这一章定义实时语音 MVP 如何安全、稳定地上线。
