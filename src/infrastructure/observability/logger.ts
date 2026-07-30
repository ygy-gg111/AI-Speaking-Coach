type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

export type StructuredLogEvent = {
  timestamp: string;
  level: LogLevel;
  event: string;
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: unknown;
};

const sensitiveKeyPattern =
  /password|passwd|secret|token|authorization|cookie|api[-_]?key|session/i;

function sanitizeText(value: string) {
  return value
    .replace(
      /(postgres(?:ql)?:\/\/[^:\s]+:)[^@\s]+@/gi,
      "$1[REDACTED]@",
    )
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[REDACTED]")
    .replace(/\bsk-[A-Za-z0-9_-]{10,}\b/g, "[REDACTED_API_KEY]")
    .slice(0, 4_000);
}

export function sanitizeLogValue(
  value: unknown,
  depth = 0,
): unknown {
  if (depth > 4) {
    return "[TRUNCATED]";
  }
  if (typeof value === "string") {
    return sanitizeText(value);
  }
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "undefined"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, 20)
      .map((item) => sanitizeLogValue(item, depth + 1));
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 40)
        .map(([key, item]) => [
          key,
          sensitiveKeyPattern.test(key)
            ? "[REDACTED]"
            : sanitizeLogValue(item, depth + 1),
        ]),
    );
  }
  return String(value);
}

export function createStructuredLog(
  level: LogLevel,
  event: string,
  message: string,
  error?: unknown,
  context?: LogContext,
): StructuredLogEvent {
  const normalizedError =
    error instanceof Error
      ? {
          name: error.name,
          message: sanitizeText(error.message),
          ...(error.stack ? { stack: sanitizeText(error.stack) } : {}),
        }
      : error
        ? {
            name: "UnknownError",
            message: sanitizeText(String(error)),
          }
        : undefined;
  return {
    timestamp: new Date().toISOString(),
    level,
    event: sanitizeText(event),
    message: sanitizeText(message),
    ...(normalizedError ? { error: normalizedError } : {}),
    ...(context ? { context: sanitizeLogValue(context) } : {}),
  };
}

export function reportServerError(
  event: string,
  message: string,
  error?: unknown,
  context?: LogContext,
) {
  console.error(
    JSON.stringify(
      createStructuredLog("error", event, message, error, context),
    ),
  );
}
