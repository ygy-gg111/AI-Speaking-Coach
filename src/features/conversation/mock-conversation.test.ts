import { describe, expect, it } from "vitest";

import { createMockConversationMessages } from "./mock-conversation";

describe("mock conversation", () => {
  it("uses the selected scene partner and opening expression", () => {
    const messages = createMockConversationMessages({
      partnerName: { "zh-CN": "咖啡师", en: "Barista" },
      openingExpression: "Could I get a latte, please?",
    });

    expect(messages).toHaveLength(3);
    expect(messages[0].text.en).toContain("barista");
    expect(messages[0].translation?.["zh-CN"]).toContain("咖啡师");
    expect(messages[1].text.en).toBe("Could I get a latte, please?");
  });
});
