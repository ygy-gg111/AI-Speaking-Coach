# AI Speaking Coach UI 页面与组件开发计划

## 1. 文档目的

本文以 `doc/ui/原型图.png` 为当前 UI 基准，将原型拆解为：

1. 页面与路由；
2. 桌面端和移动端导航；
3. 公共组件；
4. 页面级业务组件；
5. 数据、状态和 API 依赖；
6. MVP 开发顺序和验收标准。

首期技术约束：

- Next.js App Router；
- TypeScript；
- Ant Design；
- next-intl，支持 `zh-CN` 和 `en`；
- TanStack Query 管理服务端数据；
- Zustand 管理实时语音等客户端状态；
- WebRTC + OpenAI Realtime；
- Prisma + PostgreSQL；
- MVP 不引入 Redis。

---

## 2. 原型模块总览

原型包含以下核心模块：

| 编号 | 模块 | MVP | 说明 |
| --- | --- | --- | --- |
| 1 | 全局导航 | P0 | 桌面侧边栏、移动底部导航 |
| 2 | 首页 Dashboard | P0 | 学习概览、推荐场景、最近记录 |
| 3 | AI 实时对话练习 | P0 | 产品核心页面 |
| 4 | AI 老师评估 | P0 | 纠错、自然表达、原因和再次练习 |
| 5 | 本次学习统计 | P0 | 表达、错误和练习时长 |
| 6 | 场景库 | P0 | 搜索、分类和场景选择 |
| 7 | 学习日历 | P0 | 打卡记录和每日学习详情 |
| 8 | 我的场景库 | P0 | 收藏和历史练习 |
| 9 | 错题本 | P1 | 原型导航中存在，暂未展开完整页面 |
| 10 | 成长报告 | P1 | 原型导航中存在，暂未展开完整页面 |
| 11 | 设置 | P1 | 原型导航中存在，暂未展开完整页面 |

---

## 3. 路由拆解

所有用户页面统一放在 Locale 路由下。

```text
src/app/[locale]/
├── (app)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── scenes/
│   │   ├── page.tsx
│   │   └── [sceneId]/
│   │       └── page.tsx
│   ├── practice/
│   │   ├── page.tsx
│   │   └── [conversationId]/
│   │       ├── page.tsx
│   │       └── review/
│   │           └── page.tsx
│   ├── my-scenes/
│   │   └── page.tsx
│   ├── calendar/
│   │   ├── page.tsx
│   │   └── [date]/
│   │       └── page.tsx
│   ├── mistakes/
│   │   └── page.tsx
│   ├── reports/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
└── (auth)/
    ├── login/
    └── register/
```

### 3.1 页面与 URL

| 页面 | URL | 优先级 | 原型对应 |
| --- | --- | --- | --- |
| 首页 | `/[locale]` | P0 | 首页主区域 |
| 场景库 | `/[locale]/scenes` | P0 | 场景库模块 |
| 场景详情 | `/[locale]/scenes/[sceneId]` | P1 | 开始练习前的预览页 |
| 快速练习入口 | `/[locale]/practice` | P0 | 继续上次或选择场景 |
| 实时对话 | `/[locale]/practice/[conversationId]` | P0 | AI 对话练习区域 |
| AI 评估 | `/[locale]/practice/[conversationId]/review` | P0 | 移动端独立评估页 |
| 我的场景 | `/[locale]/my-scenes` | P0 | 收藏场景和练习记录 |
| 学习日历 | `/[locale]/calendar` | P0 | 月历和当日数据 |
| 日期详情 | `/[locale]/calendar/[date]` | P1 | 完整学习记录 |
| 错题本 | `/[locale]/mistakes` | P1 | 重复错误复习 |
| 成长报告 | `/[locale]/reports` | P1 | 周报和趋势 |
| 设置 | `/[locale]/settings` | P1 | 语言、等级和声音设置 |

---

## 4. 导航拆解

### 4.1 桌面端侧边栏

```text
首页          → /
AI 练习       → /practice
我的场景      → /my-scenes
错题本        → /mistakes
学习日历      → /calendar
成长报告      → /reports
设置          → /settings
```

侧边栏底部展示连续学习天数和最近七天打卡情况。

### 4.2 移动端底部导航

```text
首页          → /
练习          → /practice
场景          → /scenes
日历          → /calendar
我的          → /my-scenes
```

移动端不直接放置错题本、成长报告和设置。这些入口放入“我的”页面。

### 4.3 响应式原则

- `< 768px`：隐藏桌面侧边栏，使用底部导航；
- `768px - 1199px`：使用收起侧边栏或抽屉导航；
- `>= 1200px`：完整桌面侧边栏；
- 对话页桌面端显示右侧 AI 评估面板；
- 对话页移动端将 AI 评估拆为独立页面；
- 移动端重要按钮必须位于单手可触达区域；
- 移动端底部输入区需要处理安全区域和软键盘遮挡。

---

## 5. 页面拆解

## 5.1 首页

### 页面目标

让用户进入系统后能够快速了解学习状态，并在 10 秒内开始一次练习。

### 页面区域

```text
首页
├── 欢迎区域
├── 今日学习指标
│   ├── 今日目标
│   ├── 已学场景
│   └── 掌握表达
├── 今日推荐场景
├── 最近学习记录
└── 连续学习打卡
```

### 页面级组件

- `DashboardGreeting`
- `LearningMetrics`
- `RecommendedScenes`
- `RecentPracticeList`
- `LearningStreakCard`

### 移动端差异

- 指标缩减为连续学习和本周学习；
- 推荐场景以大图卡片显示；
- 最近记录可以下沉到“我的”页面；
- 使用固定底部导航。

---

## 5.2 场景库

### 页面区域

```text
场景库
├── 搜索框
├── 分类筛选
├── 难度筛选
├── 场景列表
└── 查看更多场景
```

### 首批分类

- 全部；
- 生活英语；
- 旅行出行；
- 工作职场；
- 学习教育；
- 社交交流。

### 页面级组件

- `SceneSearch`
- `SceneCategoryFilter`
- `SceneDifficultyFilter`
- `SceneGrid`
- `SceneList`

### 场景数据

```ts
type Scene = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  coverUrl: string;
  difficulty: number;
  estimatedMinutes: number;
  sceneCount?: number;
  favorite: boolean;
};
```

---

## 5.3 AI 实时对话练习

### 页面目标

让用户把注意力集中在“听清楚并说出下一句”。

### 页面区域

```text
实时练习
├── 返回与场景信息
├── AI 角色信息
├── 切换场景
├── 实时消息列表
│   ├── AI 消息
│   ├── 用户消息
│   ├── 音频播放
│   └── 实时字幕
├── 快捷帮助
│   ├── 我不会说
│   └── 提示我
├── 麦克风控制
├── 文本输入降级
└── AI 评估与本次统计
```

### 页面级组件

- `PracticeHeader`
- `CoachProfile`
- `ConversationTimeline`
- `RealtimeVoiceControls`
- `TextFallbackInput`
- `CoachEvaluationPanel`
- `SessionLearningStats`

### 必须支持的实时状态

```text
idle
requesting-permission
connecting
connected
listening
user-speaking
ai-thinking
ai-speaking
reconnecting
ended
error
```

### 状态对应 UI

| 状态 | 页面反馈 |
| --- | --- |
| requesting-permission | 显示麦克风授权说明 |
| connecting | 麦克风按钮加载，禁止重复点击 |
| listening | 麦克风按钮高亮并显示波形 |
| user-speaking | 展示实时用户字幕 |
| ai-thinking | 对话区显示等待状态 |
| ai-speaking | AI 消息高亮并允许用户打断 |
| reconnecting | 顶部显示非阻塞重连提示 |
| error | 展示重试和文本输入降级 |
| ended | 跳转或打开学习评估 |

---

## 5.4 AI 老师评估

### 页面内容

- 用户原始表达；
- 更自然的表达；
- 错误原因；
- 难度评分；
- 收藏表达；
- 再练一次。

### 页面级组件

- `ExpressionComparison`
- `CorrectionReason`
- `DifficultyRating`
- `FavoriteExpressionButton`
- `RetryPracticeButton`

桌面端复用为右侧 `CoachEvaluationPanel`，移动端复用同一数据渲染独立页面。

---

## 5.5 本次学习统计

### 指标

- 新学表达；
- 纠正错误；
- 练习时长。

### 组件

- `SessionLearningStats`
- `LearningStatItem`

该模块应复用于：

- 对话页右侧面板；
- 对话完成页；
- 日历每日详情；
- 最近学习记录详情。

---

## 5.6 学习日历

### 页面区域

```text
学习日历
├── 月份切换
├── 今日按钮
├── 星期标题
├── 日历日期格
└── 选中日期学习摘要
```

### 页面级组件

- `CalendarHeader`
- `LearningCalendarGrid`
- `LearningCalendarDay`
- `DailyLearningSummary`

### 日期状态

- 无学习记录；
- 已完成学习；
- 当前选中；
- 今天；
- 非本月日期。

---

## 5.7 我的场景库

### 页面区域

```text
我的场景
├── 收藏的场景
├── 我的练习记录
├── 场景熟练度
├── 最近练习时间
└── 管理场景库
```

### 页面级组件

- `MyScenesTabs`
- `SavedSceneList`
- `SavedSceneItem`
- `MasteryBadge`
- `ManageScenesButton`

---

## 6. 公共组件拆解

## 6.1 应用框架组件

放置目录：

```text
src/components/layout/
```

组件：

- `AppShell`
- `DesktopSidebar`
- `MobileBottomNav`
- `MobileTopBar`
- `PageContainer`
- `PageHeader`
- `LocaleSwitcher`
- `UserMenu`

## 6.2 场景公共组件

放置目录：

```text
src/features/scenes/components/
```

组件：

- `SceneCard`
- `SceneListItem`
- `SceneCover`
- `SceneDifficulty`
- `SceneDuration`
- `SceneCategoryTag`
- `FavoriteSceneButton`
- `StartPracticeButton`
- `MasteryBadge`

`SceneCard` 不应通过大量布尔属性支持所有样式，建议使用明确变体：

```ts
type SceneCardVariant = "recommended" | "grid" | "compact";
```

## 6.3 对话公共组件

放置目录：

```text
src/features/conversation/components/
src/features/realtime/components/
```

组件：

- `ConversationTimeline`
- `AssistantMessage`
- `UserMessage`
- `AudioPlaybackButton`
- `TranscriptText`
- `TranscriptStatus`
- `ConnectionStatus`
- `MicrophoneButton`
- `VoiceWaveform`
- `HintButton`
- `CantSayButton`
- `TextFallbackInput`
- `EndPracticeButton`

## 6.4 学习反馈公共组件

放置目录：

```text
src/features/correction/components/
src/features/learning/components/
```

组件：

- `ExpressionComparison`
- `CorrectionReason`
- `LearningStatItem`
- `SessionLearningStats`
- `PracticeRecordItem`
- `LearningStreak`
- `EmptyLearningState`

## 6.5 基础 UI 组件

优先复用 Ant Design，不重复实现 Button、Card、Input、Tabs、Tag、Avatar、List、Modal、Drawer 和 Progress。

项目自定义基础组件：

- `AppLogo`
- `SectionTitle`
- `AsyncContent`
- `ErrorState`
- `EmptyState`
- `ResponsiveDrawer`
- `ConfirmAction`

---

## 7. 推荐 Feature 目录

```text
src/
├── components/
│   ├── layout/
│   └── ui/
├── features/
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── scenes/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── conversation/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── realtime/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types.ts
│   ├── correction/
│   ├── calendar/
│   ├── learning/
│   └── profile/
├── providers/
├── i18n/
├── messages/
└── lib/
```

页面文件只负责：

1. 接收路由参数；
2. 获取初始数据；
3. 组合 Feature 组件；
4. 设置页面 Metadata。

业务逻辑不得集中堆积在 `page.tsx`。

---

## 8. 数据与状态边界

## 8.1 TanStack Query

用于管理服务端数据：

- 首页学习概览；
- 场景列表；
- 场景详情；
- 收藏场景；
- 历史练习；
- 学习日历；
- AI 评估结果。

建议 Query Key：

```ts
["dashboard", locale]
["scenes", filters]
["scene", sceneId]
["conversation", conversationId]
["conversation-review", conversationId]
["my-scenes", tab]
["calendar", year, month]
```

## 8.2 Zustand

只保存客户端交互状态：

- Realtime 连接状态；
- 麦克风状态；
- 音频设备；
- 实时字幕；
- 未持久化的当前消息；
- 移动端抽屉状态。

用户资料、场景数据、日历数据不得重复存入 Zustand。

## 8.3 URL 状态

以下状态放入 URL：

- 场景分类；
- 搜索关键词；
- 难度筛选；
- 我的场景 Tab；
- 日历年月；
- 当前选中日期。

这样可以刷新恢复、分享链接并支持浏览器前进后退。

---

## 9. 页面与 API 对应关系

| 页面 | API |
| --- | --- |
| 首页 | `GET /api/v1/dashboard` |
| 场景库 | `GET /api/v1/scenes` |
| 场景详情 | `GET /api/v1/scenes/:sceneId` |
| 创建练习 | `POST /api/v1/conversations` |
| Realtime 临时凭证 | `POST /api/v1/realtime/session` |
| 保存消息事件 | `POST /api/v1/conversations/:id/messages` |
| 结束练习 | `POST /api/v1/conversations/:id/complete` |
| AI 评估 | `POST /api/v1/conversations/:id/review` |
| 我的场景 | `GET /api/v1/my-scenes` |
| 收藏场景 | `POST /api/v1/scenes/:id/favorite` |
| 取消收藏 | `DELETE /api/v1/scenes/:id/favorite` |
| 学习日历 | `GET /api/v1/calendar?year=&month=` |
| 日期详情 | `GET /api/v1/calendar/:date` |

---

## 10. MVP 开发顺序

开发顺序以尽早跑通“选择场景 → 实时练习 → AI 评估 → 保存记录”闭环为目标。

## 阶段 0：UI 基础设施

目标：

- 建立颜色、圆角、间距和阴影 Token；
- 配置 Ant Design Theme；
- 完成中英文基础文案；
- 建立 Mock 数据；
- 建立 Loading、Empty、Error 状态。

产出：

- `AppShell`
- `PageContainer`
- `AsyncContent`
- 全局 Theme
- 基础翻译 Key

## 阶段 1：响应式应用框架

目标：

- 桌面侧边栏；
- 移动底部导航；
- 页面容器；
- Locale 切换；
- 路由选中状态。

验收：

- 桌面和移动导航均可正常切换页面；
- 刷新后 Locale 和当前路由保持；
- 页面没有横向溢出。

## 阶段 2：场景组件与场景库

目标：

- 建立 `Scene` 类型；
- 完成场景卡片三种变体；
- 完成分类、搜索和列表；
- 完成桌面网格和移动列表。

验收：

- 可根据分类和关键词筛选；
- 可以收藏；
- 可以点击开始练习；
- 空结果和加载状态完整。

当前实现说明：场景卡片、场景库和 `/[locale]/scenes/[sceneId]` 详情预览均已完成。详情页展示训练目标、高频表达、对话角色、练习次数和场景熟练度；从详情页或场景卡片进入实时练习时，场景参数会持续传递到对话和复盘页面，不再使用固定场景。

## 阶段 3：首页 Dashboard

目标：

- 首页指标；
- 推荐场景；
- 最近记录；
- 连续学习打卡。

依赖：

- 复用阶段 2 的场景组件；
- 暂时使用 Mock 数据，随后接入 Dashboard API。

## 阶段 4：实时练习静态界面与状态机

目标：

- 对话消息；
- 麦克风控制区；
- 提示和“我不会说”；
- 文本输入降级；
- Realtime 状态机；
- 桌面右侧评估面板；
- 移动端练习页面。

本阶段先使用模拟消息和模拟连接状态，确保所有状态都能被人工触发和检查。

## 阶段 5：WebRTC Realtime 接入

目标：

- 麦克风授权；
- 服务端签发临时凭证；
- WebRTC 建连；
- 实时音频输入和输出；
- VAD；
- 用户和 AI 实时字幕；
- 用户打断 AI；
- 断线重连；
- 文本输入降级。

验收：

- API Key 不进入浏览器；
- 用户可以完成至少 5 轮实时对话；
- 断网后有明确反馈和重试入口；
- 结束时能够保存会话。

## 阶段 6：AI 评估和学习总结

目标：

- 原句和自然表达对比；
- 错误原因；
- 本次统计；
- 收藏表达；
- 再次练习。

验收：

- 桌面端右侧面板和移动端独立页面复用同一份数据；
- 分析未完成时有等待状态；
- 分析失败不影响会话记录保存。

## 阶段 7：我的场景和学习日历

目标：

- 收藏场景；
- 历史练习；
- 熟练度；
- 月历；
- 日期学习摘要。

验收：

- 完成练习后首页、我的场景和日历数据同步；
- 日历可以切换月份；
- 移动端列表可正常滚动。

当前实现说明：阶段 7 已使用共享 Zustand persist 数据层打通收藏、练习完成写入、首页指标、我的场景和月历日期摘要。用户系统接入前先保存在浏览器本地；后续替换为 TanStack Query + PostgreSQL API 时，页面组件和统计函数保持不变。

日期详情补充：`/[locale]/calendar/[date]` 已提供可刷新、可分享的完整日期记录，包含当日统计、练习时间线、每日目标、场景复盘和再次练习入口。日期参数会严格校验，日历和历史记录进入复盘时持续携带原场景。

## 阶段 8：MVP 收尾

目标：

- 错题本基础列表；
- 登录和用户资料；
- 可访问性；
- 性能优化；
- 单元测试和 E2E；
- 错误监控。

当前实现说明：阶段 8 已完成错题本基础闭环，以及基于 Prisma、bcrypt、HttpOnly JWT Cookie 的登录、注册、退出登录和用户资料更新。未登录用户保留访客体验，用户资料 API 要求有效服务端会话；页面已补充中英文、响应式和可访问性标注。错误监控已建立供应商无关的结构化日志、敏感字段脱敏、客户端上报接口、Locale 页面错误恢复和全局兜底页；生产环境可在现有传输层继续接入 Sentry 或 OpenTelemetry。

可访问性收尾说明：应用框架已增加键盘跳转主内容、`aria-current` 当前导航、连续学习状态文本、全局 `:focus-visible`、移动端最小触控高度和 `prefers-reduced-motion`。路由切换提供带屏幕阅读器状态的响应式骨架，未知路由提供本地化 404 恢复入口。

## 阶段 9：成长报告

目标：

- 近 7 天和近 30 天学习概览；
- 学习时长趋势与周期对比；
- 能力信号和数据来源说明；
- 场景练习分布；
- 基于错题分类的薄弱项建议；
- 移动端从“我的”页面进入报告、错题本和设置。

当前实现说明：成长报告直接复用共享学习记录和错题数据，通过纯函数生成周期摘要、每日趋势、场景分布、能力估算与待加强分类。能力值仅使用场景熟练度、纠错频率、新表达和场景覆盖等可验证信号，不包含尚未接入的发音评分，也不生成缺乏总体数据支持的用户排名。

首批 E2E 流程：

```text
登录
→ 进入场景库
→ 选择机场值机
→ 授权麦克风
→ 完成实时对话
→ 查看 AI 评估
→ 收藏场景
→ 在日历查看练习记录
```

---

## 11. 第一轮开发任务

第一轮不直接连接真实 AI，优先把页面骨架和可复用组件稳定下来：

1. 重构 `[locale]` 应用布局；
2. 建立桌面侧边栏和移动底部导航；
3. 建立设计 Token；
4. 建立场景 Mock 数据和 `Scene` 类型；
5. 开发 `SceneCard` 三种变体；
6. 完成场景库响应式页面；
7. 使用场景组件重构首页推荐区域；
8. 补齐中英文翻译；
9. 添加桌面和移动页面基础测试。

完成第一轮后再进入实时对话 UI 和 WebRTC 接入。

---

## 12. 不在第一轮实现的内容

- 真实 OpenAI Realtime 连接；
- 完整登录注册；
- 错题本完整逻辑；
- 成长报告图表；
- 支付与订阅；
- 自定义 AI 场景；
- AI 数字人；
- Redis、任务队列和微服务。

这些内容不会阻塞页面框架和核心 UI 组件开发。
