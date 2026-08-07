# AI Speaking Coach

> Version：V1.0
>
> Author：System Architect
>
> Status：Planning

---

# 1. 项目简介

AI Speaking Coach 是一个基于 AI 的英语口语陪练平台。

它并不是传统意义上的英语学习软件，而是一个拥有长期记忆能力的 AI 英语伙伴（AI English Companion）。

产品核心理念：

> 在真实场景中学习英语，而不是背单词。

系统通过：

- AI角色模拟
- 场景对话
- 实时提示
- 错误分析
- 长期记忆
- 学习成长

帮助用户逐步建立英语表达能力。

---

# 2. 产品定位

定位：

AI Native 英语学习平台

产品类型：

SaaS

主要平台：

- PC Web（Primary）
- Mobile Web（Responsive）
- PWA（Future）

未来支持：

- Electron Desktop
- iOS
- Android

---

# 3. 产品目标

传统英语学习：

背单词

↓

背语法

↓

考试

↓

忘记

AI Speaking Coach：

真实场景

↓

主动表达

↓

AI纠错

↓

长期成长

↓

形成英语思维

产品最终目标：

让用户每天愿意打开10分钟。

---

# 4. MVP目标

第一阶段仅完成：

✅ 登录

✅ AI场景对话

✅ WebRTC实时语音

✅ 实时字幕与AI语音回复

✅ 用户打断AI

✅ 中英文界面国际化

✅ 场景收藏

✅ AI提示

✅ AI纠错

✅ 学习记录

✅ 打卡日历

✅ 分享小红书

控制开发周期：

4~6周

保证：

产品能够真实使用。

---

# 5. 用户画像

## 第一类

职场人士

特点：

- 工作需要英语
- 没有练习环境

---

## 第二类

英语教师

特点：

阅读能力较强

口语一般

希望提升真实表达能力。

---

## 第三类

出国旅游

特点：

需要快速学习：

机场

酒店

餐厅

购物

交通

等场景。

---

## 第四类

程序员

特点：

需要：

Daily Meeting

Bug描述

Project Discussion

Interview

---

# 6. 产品价值

不同于：

Duolingo

Memrise

Anki

AI Speaking Coach：

不是学习知识。

而是：

培养表达能力。

真正帮助用户：

把英语说出来。

---

# 7. 产品核心能力

整个产品只有四个核心。

## 一

Scene

场景系统

负责：

真实交流。

---

## 二

Conversation

AI陪练

负责：

自然聊天。

---

## 三

Correction

AI老师

负责：

纠错。

---

## 四

Memory

长期成长

负责：

记住用户。

形成个人学习轨迹。

---

# 8. 产品闭环

完整学习流程：

选择场景

↓

AI角色

↓

用户表达

↓

不会

↓

提示

↓

继续表达

↓

AI纠错

↓

记录错误

↓

加入单词本

↓

加入复习

↓

生成打卡

↓

分享到小红书

↓

第二天继续学习

这是整个产品最重要的闭环。

---

# 9. 产品原则

整个产品遵循以下原则。

原则一：

优先交流。

不是优先纠错。

原则二：

允许犯错。

AI负责帮助用户。

原则三：

场景驱动。

不是课程驱动。

原则四：

成长记录。

不是一次性学习。

原则五：

长期陪伴。

不是工具。

---

# 10. MVP范围

本阶段必须完成：

用户系统

场景系统

AI聊天

WebRTC实时语音对话

VAD语音活动检测

实时字幕

AI语音流式回复与打断

中英文界面与语言切换

Prompt Engine

Hint Engine

Correction Engine

收藏场景

学习历史

打卡

分享

以下内容暂不开发：

发音评分

AI课程生成

Agent协同

留待V2。

---

# 11. 技术原则

前端：

Next.js

React

TypeScript

Ant Design

@ant-design/nextjs-registry

next-intl

CSS Modules / Ant Design Design Token

后端：

Next FullStack

Prisma

MySQL

AI：

OpenAI Realtime API

WebRTC

Realtime Model

文本模型（结构化纠错与总结）

部署：

Vercel

云数据库服务

Cloudflare R2

Github Action

MVP 不引入 Redis 和 BullMQ。Realtime 会话的媒体状态由 WebRTC 与 Realtime API 管理，长期业务数据写入 MySQL。

---

# 12. 系统总体流程

用户

↓

选择场景

↓

AI初始化

↓

Prompt生成

↓

Conversation

↓

Correction

↓

Hint

↓

Memory

↓

Database

↓

Report

↓

Checkin

↓

Share

整个产品围绕这一条数据链进行设计。
