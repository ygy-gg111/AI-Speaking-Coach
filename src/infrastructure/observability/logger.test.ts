import { describe, expect, it } from "vitest";

import { createStructuredLog, sanitizeLogValue } from "./logger";

describe("structured logger", () => {
  it("redacts sensitive keys recursively", () => {
    expect(
      sanitizeLogValue({
        email: "learner@example.com",
        password: "plain-text",
        nested: { authorization: "Bearer top-secret", count: 2 },
      }),
    ).toEqual({
      email: "learner@example.com",
      password: "[REDACTED]",
      nested: { authorization: "[REDACTED]", count: 2 },
    });
  });

  it("redacts credentials embedded in error messages", () => {
    const event = createStructuredLog(
      "error",
      "database.connection",
      "Unable to connect",
      new Error(
        "postgresql://user:password@localhost/db Bearer abc.def sk-1234567890abcdef",
      ),
    );
    expect(event.error?.message).not.toContain("password");
    expect(event.error?.message).not.toContain("abc.def");
    expect(event.error?.message).not.toContain("sk-1234567890abcdef");
  });

  it("limits deeply nested and oversized values", () => {
    const value = sanitizeLogValue({
      a: { b: { c: { d: { e: { f: "hidden" } } } } },
      list: Array.from({ length: 30 }, (_, index) => index),
    }) as { a: unknown; list: number[] };
    expect(JSON.stringify(value.a)).toContain("[TRUNCATED]");
    expect(value.list).toHaveLength(20);
  });
});
