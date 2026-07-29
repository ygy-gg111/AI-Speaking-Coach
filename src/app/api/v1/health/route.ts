import { ok } from "@/lib/api-response";

export function GET() {
  return ok({
    service: "ai-speaking-coach",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
