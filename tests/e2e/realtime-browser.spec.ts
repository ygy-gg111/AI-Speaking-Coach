import { expect, test } from "@playwright/test";

import { installRealtimeBrowserMocks } from "./fixtures/realtime";

test("voice session switches devices, interrupts, and reconnects", async ({ page }) => {
  test.setTimeout(45_000);
  const email = `voice-${Date.now()}@example.com`;
  expect((await page.request.post("/api/v1/auth/register", {
    data: { email, password: "voice-password-123", displayName: "Voice E2E", locale: "en" },
  })).ok()).toBeTruthy();
  const scenes = (await (await page.request.get("/api/v1/scenes")).json()).data;
  const scene = scenes[0];
  const conversation = (await (await page.request.post("/api/v1/conversations", {
    data: { sceneId: scene.id },
  })).json()).data;

  await installRealtimeBrowserMocks(page);
  let connectionRequests = 0;
  await page.route("**/api/v1/realtime/session**", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({ json: { success: true, data: { configured: true } } });
    } else if (method === "POST") {
      connectionRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/sdp",
        headers: { "X-Realtime-Session-Id": `mock-session-${connectionRequests}` },
        body: "mock-answer",
      });
    } else {
      await route.fulfill({ json: { success: true, data: { updated: true } } });
    }
  });

  await page.goto(`/en/practice/${conversation.id}?scene=${scene.slug}`);

  await page.getByPlaceholder("Type what you want to say…").fill("I need a coffee");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText(/I understood:.*I need a coffee/)).toBeVisible();

  await page.getByRole("button", { name: "Start or pause voice practice" }).click();
  await expect(page.getByText("Listening", { exact: true })).toBeVisible();

  await page.getByLabel("Input microphone").click();
  await page.getByText("USB Microphone", { exact: true }).click();
  await expect.poll(() => page.evaluate(() => {
    const testState = (window as unknown as { __realtimeTest: { mediaRequests: MediaTrackConstraints[] } }).__realtimeTest;
    return JSON.stringify(testState.mediaRequests);
  })).toContain("mic-usb");

  await page.evaluate(() => {
    (window as unknown as { __realtimeTest: { emit(event: object): void } }).__realtimeTest.emit({
      type: "response.output_audio_transcript.delta",
      response_id: "assistant-1",
      delta: "Welcome",
    });
  });
  await expect(page.getByText("AI is speaking — interrupt anytime", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Start or pause voice practice" }).click();
  expect(await page.evaluate(() => {
    const events = (window as unknown as { __realtimeTest: { sentEvents: Array<{ type?: string }> } }).__realtimeTest.sentEvents;
    return events.some((event) => event.type === "response.cancel");
  })).toBe(true);

  await page.evaluate(() => {
    (window as unknown as { __realtimeTest: { disconnect(): void } }).__realtimeTest.disconnect();
  });
  await expect(page.getByText("Connection lost, reconnecting", { exact: true })).toBeVisible();
  await expect.poll(() => connectionRequests, { timeout: 8_000 }).toBe(2);
  await expect(page.getByText("Listening", { exact: true })).toBeVisible();
});
