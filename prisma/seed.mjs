import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const scenes = [
  ["scene-coffee", "coffee-order", "daily", "coffee", "☕", 2, 8, 10],
  ["scene-airport", "airport-check-in", "travel", "airport", "✈", 3, 10, 15],
  ["scene-meeting", "work-meeting", "work", "meeting", "◫", 4, 12, 10],
  ["scene-restaurant", "restaurant-order", "daily", "restaurant", "♨", 2, 8, 12],
  ["scene-shopping", "shopping", "daily", "shopping", "◈", 2, 8, 8],
  ["scene-metro", "metro-directions", "travel", "metro", "▰", 2, 8, 8],
  ["scene-hotel", "hotel-check-in", "travel", "hotel", "▦", 3, 10, 8],
  ["scene-presentation", "project-update", "work", "presentation", "↗", 4, 12, 8],
];

const localizedContent = {
  "scene-coffee": {
    title: { "zh-CN": "咖啡店点餐", en: "Ordering coffee" },
    subtitle: {
      "zh-CN": "自然完成点单、选择杯型和付款",
      en: "Order, choose a size, and pay naturally",
    },
  },
  "scene-airport": {
    title: { "zh-CN": "机场值机", en: "Airport check-in" },
    subtitle: {
      "zh-CN": "办理值机、托运行李并确认登机口",
      en: "Check in, drop bags, and confirm the gate",
    },
  },
  "scene-meeting": {
    title: { "zh-CN": "工作会议", en: "Work meeting" },
    subtitle: {
      "zh-CN": "汇报进度、提出问题并确认下一步",
      en: "Share progress, raise issues, and align next steps",
    },
  },
  "scene-restaurant": {
    title: { "zh-CN": "餐厅点餐", en: "At a restaurant" },
    subtitle: {
      "zh-CN": "询问菜品、表达偏好并完成结账",
      en: "Ask about dishes, share preferences, and pay",
    },
  },
  "scene-shopping": {
    title: { "zh-CN": "购物", en: "Shopping" },
    subtitle: {
      "zh-CN": "询问尺码、颜色、价格和退换政策",
      en: "Ask about size, color, price, and returns",
    },
  },
  "scene-metro": {
    title: { "zh-CN": "地铁问路", en: "Metro directions" },
    subtitle: {
      "zh-CN": "询问路线、换乘方式和到站时间",
      en: "Ask for routes, transfers, and arrival time",
    },
  },
  "scene-hotel": {
    title: { "zh-CN": "酒店入住", en: "Hotel check-in" },
    subtitle: {
      "zh-CN": "确认预订、房型、早餐和退房时间",
      en: "Confirm booking, room, breakfast, and checkout",
    },
  },
  "scene-presentation": {
    title: { "zh-CN": "项目汇报", en: "Project update" },
    subtitle: {
      "zh-CN": "说明项目结果、风险与后续计划",
      en: "Present results, risks, and the next plan",
    },
  },
};

try {
  for (const [id, slug, category, coverTone, coverMark, difficulty, estimatedMinutes, lessonCount] of scenes) {
    const content = localizedContent[id];
    const searchText = [
      content.title["zh-CN"],
      content.title.en,
      content.subtitle["zh-CN"],
      content.subtitle.en,
      slug,
    ].join(" ");
    await prisma.scene.upsert({
      where: { id },
      update: {
        slug,
        searchText,
        category,
        coverTone,
        coverMark,
        difficulty,
        estimatedMinutes,
        lessonCount,
        content,
        isActive: true,
      },
      create: {
        id,
        slug,
        titleKey: `Scenes.items.${id}.title`,
        descriptionKey: `Scenes.items.${id}.description`,
        searchText,
        systemPrompt: `Role-play the ${slug} scene. Keep responses concise, natural, and suitable for an English learner.`,
        category,
        coverTone,
        coverMark,
        difficulty,
        estimatedMinutes,
        lessonCount,
        content,
        sortOrder: scenes.findIndex((scene) => scene[0] === id),
      },
    });
  }
  console.log(`Seeded ${scenes.length} scenes.`);
} finally {
  await prisma.$disconnect();
}
