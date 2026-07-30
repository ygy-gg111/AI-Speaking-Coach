import type { LocalizedSceneText, Scene } from "./types";

export type ScenePhrase = {
  expression: string;
  meaning: LocalizedSceneText;
};

export type SceneDetail = {
  partner: LocalizedSceneText;
  context: LocalizedSceneText;
  goals: LocalizedSceneText[];
  phrases: ScenePhrase[];
};

const sharedGoals = {
  open: {
    "zh-CN": "自然开启对话并说明自己的需求",
    en: "Open the conversation and explain what you need",
  },
  clarify: {
    "zh-CN": "听懂关键信息，并主动确认细节",
    en: "Understand key information and clarify details",
  },
  close: {
    "zh-CN": "用完整表达确认结果并结束对话",
    en: "Confirm the result and close the conversation naturally",
  },
} satisfies Record<string, LocalizedSceneText>;

export const sceneDetails: Record<Scene["id"], SceneDetail> = {
  "scene-coffee": {
    partner: { "zh-CN": "咖啡师", en: "Barista" },
    context: {
      "zh-CN": "你走进一家咖啡店，需要选择饮品、杯型和温度，最后确认付款方式。",
      en: "You enter a coffee shop, choose a drink, size, and temperature, then confirm payment.",
    },
    goals: [sharedGoals.open, sharedGoals.clarify, sharedGoals.close],
    phrases: [
      {
        expression: "Could I get a medium latte, please?",
        meaning: { "zh-CN": "请给我一杯中杯拿铁。", en: "Order a medium latte politely." },
      },
      {
        expression: "Can I have that iced?",
        meaning: { "zh-CN": "可以做成冰的吗？", en: "Ask for the drink iced." },
      },
      {
        expression: "I'll pay by card.",
        meaning: { "zh-CN": "我刷卡付款。", en: "Say how you would like to pay." },
      },
    ],
  },
  "scene-airport": {
    partner: { "zh-CN": "机场值机人员", en: "Check-in agent" },
    context: {
      "zh-CN": "你正在办理国际航班值机，需要出示证件、托运行李并确认登机信息。",
      en: "You are checking in for an international flight, dropping a bag, and confirming boarding details.",
    },
    goals: [sharedGoals.open, sharedGoals.clarify, sharedGoals.close],
    phrases: [
      {
        expression: "I'd like to check in for my flight.",
        meaning: { "zh-CN": "我想办理航班值机。", en: "Start the check-in conversation." },
      },
      {
        expression: "Could I have an aisle seat?",
        meaning: { "zh-CN": "可以给我一个靠过道的座位吗？", en: "Ask for an aisle seat." },
      },
      {
        expression: "Which gate should I go to?",
        meaning: { "zh-CN": "我应该去哪个登机口？", en: "Confirm the departure gate." },
      },
    ],
  },
  "scene-meeting": {
    partner: { "zh-CN": "项目同事", en: "Project teammate" },
    context: {
      "zh-CN": "你参加一次项目例会，需要汇报进度、说明阻塞问题并确认下一步负责人。",
      en: "You are in a project meeting to share progress, explain a blocker, and align ownership.",
    },
    goals: [sharedGoals.open, sharedGoals.clarify, sharedGoals.close],
    phrases: [
      {
        expression: "Here's a quick update on my progress.",
        meaning: { "zh-CN": "我快速同步一下目前的进度。", en: "Introduce a concise status update." },
      },
      {
        expression: "The main blocker is the API dependency.",
        meaning: { "zh-CN": "目前主要的阻塞是 API 依赖。", en: "Explain the main blocker." },
      },
      {
        expression: "I'll follow up before Friday.",
        meaning: { "zh-CN": "我会在周五前跟进。", en: "Commit to the next action." },
      },
    ],
  },
  "scene-restaurant": {
    partner: { "zh-CN": "餐厅服务员", en: "Restaurant server" },
    context: {
      "zh-CN": "你在餐厅点餐，需要询问推荐、说明饮食偏好，并在用餐后结账。",
      en: "You are ordering at a restaurant, asking for a recommendation, sharing preferences, and paying.",
    },
    goals: [sharedGoals.open, sharedGoals.clarify, sharedGoals.close],
    phrases: [
      {
        expression: "What would you recommend?",
        meaning: { "zh-CN": "你有什么推荐？", en: "Ask the server for a recommendation." },
      },
      {
        expression: "Could you make it less spicy?",
        meaning: { "zh-CN": "可以少放一点辣吗？", en: "Explain a food preference." },
      },
      {
        expression: "Could we have the bill, please?",
        meaning: { "zh-CN": "麻烦买单。", en: "Ask for the bill politely." },
      },
    ],
  },
  "scene-shopping": {
    partner: { "zh-CN": "商店店员", en: "Shop assistant" },
    context: {
      "zh-CN": "你在商店挑选商品，需要询问尺码、试穿并了解退换货规则。",
      en: "You are shopping for an item, asking about size, trying it on, and checking the return policy.",
    },
    goals: [sharedGoals.open, sharedGoals.clarify, sharedGoals.close],
    phrases: [
      {
        expression: "Do you have this in a larger size?",
        meaning: { "zh-CN": "这件有大一码的吗？", en: "Ask for another size." },
      },
      {
        expression: "Could I try this on?",
        meaning: { "zh-CN": "我可以试穿吗？", en: "Ask to try the item on." },
      },
      {
        expression: "What's your return policy?",
        meaning: { "zh-CN": "你们的退换货政策是什么？", en: "Check the return policy." },
      },
    ],
  },
  "scene-metro": {
    partner: { "zh-CN": "当地乘客", en: "Local passenger" },
    context: {
      "zh-CN": "你在陌生城市乘坐地铁，需要确认路线、换乘站和预计到达时间。",
      en: "You are taking the metro in a new city and need to confirm the route, transfer, and arrival time.",
    },
    goals: [sharedGoals.open, sharedGoals.clarify, sharedGoals.close],
    phrases: [
      {
        expression: "Which line should I take?",
        meaning: { "zh-CN": "我应该坐哪条线？", en: "Ask which metro line to take." },
      },
      {
        expression: "Where do I need to transfer?",
        meaning: { "zh-CN": "我需要在哪里换乘？", en: "Confirm the transfer station." },
      },
      {
        expression: "How long does it take?",
        meaning: { "zh-CN": "大概需要多长时间？", en: "Ask about the journey time." },
      },
    ],
  },
  "scene-hotel": {
    partner: { "zh-CN": "酒店前台", en: "Hotel receptionist" },
    context: {
      "zh-CN": "你抵达酒店办理入住，需要确认预订、早餐安排和退房时间。",
      en: "You arrive at a hotel to confirm your booking, breakfast arrangements, and checkout time.",
    },
    goals: [sharedGoals.open, sharedGoals.clarify, sharedGoals.close],
    phrases: [
      {
        expression: "I have a reservation under Chen.",
        meaning: { "zh-CN": "我用 Chen 这个名字预订了房间。", en: "Provide the name on your booking." },
      },
      {
        expression: "Is breakfast included?",
        meaning: { "zh-CN": "房费包含早餐吗？", en: "Confirm whether breakfast is included." },
      },
      {
        expression: "What time is checkout?",
        meaning: { "zh-CN": "几点退房？", en: "Ask about checkout time." },
      },
    ],
  },
  "scene-presentation": {
    partner: { "zh-CN": "项目利益相关者", en: "Project stakeholder" },
    context: {
      "zh-CN": "你需要用简洁结构汇报项目成果、主要风险和接下来的计划。",
      en: "You need to present project outcomes, key risks, and the next plan with a clear structure.",
    },
    goals: [sharedGoals.open, sharedGoals.clarify, sharedGoals.close],
    phrases: [
      {
        expression: "Let me walk you through the key results.",
        meaning: { "zh-CN": "我来介绍一下关键成果。", en: "Introduce the main results." },
      },
      {
        expression: "The biggest risk is the current timeline.",
        meaning: { "zh-CN": "最大的风险是当前时间安排。", en: "State the most important risk." },
      },
      {
        expression: "Our next step is to validate the solution.",
        meaning: { "zh-CN": "下一步是验证这个方案。", en: "Explain the next step." },
      },
    ],
  },
};

export function getSceneDetail(sceneId: Scene["id"]) {
  return sceneDetails[sceneId];
}
