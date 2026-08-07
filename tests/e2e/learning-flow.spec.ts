import { expect, test } from "@playwright/test";

test("registration through persisted conversation review", async ({ request }) => {
  test.setTimeout(90_000);
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const register = await request.post("/api/v1/auth/register", {
    data: {
      email,
      password: "e2e-password-123",
      displayName: "E2E Learner",
      locale: "en",
    },
  });
  expect(register.ok()).toBeTruthy();

  expect((await request.post("/api/v1/auth/logout")).ok()).toBeTruthy();
  expect((await request.get("/api/v1/conversations?limit=1")).status()).toBe(401);
  const login = await request.post("/api/v1/auth/login", {
    data: { email, password: "e2e-password-123" },
  });
  expect(login.ok()).toBeTruthy();

  const scenesResponse = await request.get("/api/v1/scenes");
  expect(scenesResponse.ok()).toBeTruthy();
  const scenesPayload = await scenesResponse.json();
  const scene = scenesPayload.data[0];
  expect(scene?.id).toBeTruthy();

  const create = await request.post("/api/v1/conversations", {
    data: { sceneId: scene.id },
  });
  expect(create.ok()).toBeTruthy();
  const conversationId = (await create.json()).data.id as string;

  for (const [role, content, clientEventId] of [
    ["USER", "I want go to the airport.", "e2e-user-1"],
    ["ASSISTANT", "You want to go to the airport.", "e2e-ai-1"],
  ] as const) {
    const message = await request.post(`/api/v1/conversations/${conversationId}/messages`, {
      data: { role, content, transcript: content, clientEventId },
    });
    expect(message.ok(), await message.text()).toBeTruthy();
  }

  const review = await request.post(`/api/v1/conversations/${conversationId}/review`, {
    data: {
      durationSeconds: 65,
      final: true,
      messages: [
        { role: "user", text: "I want go to the airport." },
        { role: "assistant", text: "You want to go to the airport." },
      ],
    },
  });
  expect(review.ok()).toBeTruthy();
  const reviewData = (await review.json()).data;
  expect(["ai", "fallback"]).toContain(reviewData.source);
  expect(reviewData.evaluation.improved).toBeTruthy();

  const complete = await request.post(`/api/v1/conversations/${conversationId}/complete`, {
    data: { durationSeconds: 1, summary: "untrusted", mastery: 0 },
  });
  expect(complete.ok()).toBeTruthy();
  const completed = (await complete.json()).data;
  expect(completed.status).toBe("COMPLETED");
  expect(completed.summary).toBe(reviewData.evaluation.improved);
  expect(completed.mastery).toBeGreaterThan(0);

  const restored = await request.get(`/api/v1/conversations/${conversationId}/review`);
  expect(restored.ok()).toBeTruthy();
  expect((await restored.json()).data.evaluation).toEqual(reviewData.evaluation);

  const [history, mistakes, vocabulary, report] = await Promise.all([
    request.get("/api/v1/conversations?limit=10"),
    request.get("/api/v1/mistakes?limit=10"),
    request.get("/api/v1/vocabulary?limit=10"),
    request.get("/api/v1/reports?period=7&timezoneOffset=-480"),
  ]);
  expect(history.ok()).toBeTruthy();
  expect(mistakes.ok()).toBeTruthy();
  expect(vocabulary.ok()).toBeTruthy();
  expect(report.ok(), await report.text()).toBeTruthy();
  expect((await history.json()).data.some((item: { conversationId: string }) => item.conversationId === conversationId)).toBeTruthy();
  expect((await mistakes.json()).data.some((item: { conversationId: string }) => item.conversationId === conversationId)).toBeTruthy();
  expect((await vocabulary.json()).data.some((item: { conversationId: string }) => item.conversationId === conversationId)).toBeTruthy();
  expect((await report.json()).data.pronunciation).toEqual({
    attemptCount: 0,
    averageScore: 0,
    bestScore: 0,
  });
});
